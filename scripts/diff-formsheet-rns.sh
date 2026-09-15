#!/usr/bin/env bash
# Compare iOS FormSheet working trees. Exit: 0 identical, 1 differences, 2 error.
set -euo pipefail

usage() {
  printf '%s\n' \
    'Usage: diff-formsheet-rns.sh [--raw] [--summary] [RNS_REPOSITORY]' \
    '' \
    'Compares iOS FormSheet, including renamed bridges and files unique to either side.' \
    'Default upstream: ../react-native-screens relative to this repository.' \
    'Direction: - RNS, + Lynx. Includes staged and unstaged working-tree contents.' \
    'Default: omit #import/#include declarations; hunk numbers refer to filtered content.' \
    '--raw: retain imports/includes and original source line numbers.' \
    '--summary: show file mappings and status without patch bodies.' \
    'Diff mode writes only patches; metadata, file status and statistics require --summary.' \
    '' \
    'Mappings: ComponentView -> Component; HostShadowStateProxy -> common/RNSShadowStateProxy.' \
    'Fabric C++ files and Lynx custom ShadowNode files are shown separately (not 1:1).' \
    'Only-side entries show source coverage, not necessarily missing migration work.' \
    'Android, TypeScript, examples and build configuration are outside this comparison.' \
    '' \
    'Exit codes: 0 = identical, 1 = differences, 2 = error.'
}

raw=false
summary=false
rns_repo=''
for arg in "$@"; do
  case "$arg" in
    --raw) raw=true ;;
    --summary) summary=true ;;
    --help|-h) usage; exit 0 ;;
    -*) usage >&2; exit 2 ;;
    *)
      if [[ -n "$rns_repo" ]]; then usage >&2; exit 2; fi
      rns_repo=$arg
      ;;
  esac
done

# Metadata is only visible in summary mode; errors still go to stderr.
if $summary; then
  exec 3>&1
else
  exec 3>/dev/null
fi

repo_root=$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel) || exit 2
rns_repo=${rns_repo:-"$repo_root/../react-native-screens"}
for directory in "$rns_repo/ios/modals/form-sheet" "$rns_repo/ios/modals/utils" \
  "$rns_repo/common/cpp/react/renderer/components/rnscreens" "$repo_root/ios/form-sheet"; do
  if [[ ! -d "$directory" ]]; then
    printf 'Directory not found: %s\n' "$directory" >&2
    exit 2
  fi
done
rns_repo=$(git -C "$rns_repo" rev-parse --show-toplevel) || exit 2

temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/diff-ios-formsheet.XXXXXX") || exit 2
trap 'rm -rf "$temp_dir"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
mkdir -p "$temp_dir/rns" "$temp_dir/lynx"
: > "$temp_dir/mapped-lynx"

printf 'RNS:  %s @ %s\n' "$rns_repo" "$(git -C "$rns_repo" rev-parse HEAD)" >&3
printf 'Lynx: %s @ %s\n' "$repo_root" "$(git -C "$repo_root" rev-parse HEAD)" >&3
printf 'Comparing working-tree contents; direction: - RNS, + Lynx\n' >&3
if ! $raw; then
  printf 'Imports/includes omitted; use --raw for exact source differences.\n' >&3
fi
printf 'Only-side files include framework-specific replacements, not just missing ports.\n\n' >&3

same=0
changed=0
rns_only=0
lynx_only=0

compare() {
  local upstream=$1 counterpart=$2 status source target
  source="$temp_dir/rns/${upstream:-EMPTY}"
  target="$temp_dir/lynx/${counterpart:-EMPTY}"
  mkdir -p "$(dirname "$source")" "$(dirname "$target")"
  if [[ -n "$upstream" ]]; then
    if $raw; then
      cp "$rns_repo/$upstream" "$source"
    else
      sed -E '/^[[:space:]]*#[[:space:]]*(import|include)[[:space:]]/d' "$rns_repo/$upstream" > "$source"
    fi
  else
    : > "$source"
  fi
  if [[ -n "$counterpart" ]]; then
    if $raw; then
      cp "$repo_root/$counterpart" "$target"
    else
      sed -E '/^[[:space:]]*#[[:space:]]*(import|include)[[:space:]]/d' "$repo_root/$counterpart" > "$target"
    fi
  else
    : > "$target"
  fi

  if [[ -z "$upstream" ]]; then
    printf '[LYNX ONLY] %s\n' "$counterpart" >&3
    lynx_only=$((lynx_only + 1))
  elif [[ -z "$counterpart" ]]; then
    printf '[RNS ONLY]  %s\n' "$upstream" >&3
    rns_only=$((rns_only + 1))
  elif cmp -s "$source" "$target"; then
    printf '[SAME]      %s -> %s\n' "$upstream" "$counterpart" >&3
    same=$((same + 1))
    return
  else
    printf '[CHANGED]   %s -> %s\n' "$upstream" "$counterpart" >&3
    changed=$((changed + 1))
  fi

  if $summary; then return; fi
  if git --no-pager -C "$temp_dir" diff --no-index --no-ext-diff --no-textconv --color=auto \
    --src-prefix= --dst-prefix= -- "${source#"$temp_dir/"}" "${target#"$temp_dir/"}"; then
    :
  else
    status=$?
    if [[ $status -ne 1 ]]; then exit 2; fi
  fi
}

shopt -s nullglob
upstream_files=("$rns_repo"/ios/modals/form-sheet/*.{h,m,mm})
if [[ ${#upstream_files[@]} -eq 0 ]]; then
  printf 'No upstream iOS FormSheet files found.\n' >&2
  exit 2
fi
for required in RNSPresentationSourceProvider.h RNSPresentationSourceProvider.mm; do
  if [[ ! -f "$rns_repo/ios/modals/utils/$required" ]]; then
    printf 'Required upstream file missing: %s\n' "$required" >&2
    exit 2
  fi
  upstream_files+=("$rns_repo/ios/modals/utils/$required")
done

for file in "${upstream_files[@]}"; do
  name=${file##*/}
  case "$name" in
    RNSFormSheetHostComponentView.*|RNSFormSheetContentWrapperComponentView.*)
      counterpart="ios/form-sheet/${name/ComponentView/Component}" ;;
    RNSFormSheetHostShadowStateProxy.*)
      counterpart="ios/common/${name/FormSheetHost/}" ;;
    *) counterpart="ios/form-sheet/$name" ;;
  esac
  if [[ -f "$repo_root/$counterpart" ]]; then
    printf '%s\n' "$counterpart" >> "$temp_dir/mapped-lynx"
  else
    counterpart=''
  fi
  compare "${file#"$rns_repo/"}" "$counterpart"
done

# Fabric's state/descriptor/node collectively map to Lynx's custom ShadowNode.
# Keep these files visible instead of guessing a misleading one-to-one pairing.
for file in "$rns_repo"/common/cpp/react/renderer/components/rnscreens/RNSFormSheetHost*.{h,cpp}; do
  compare "${file#"$rns_repo/"}" ''
done

for file in "$repo_root"/ios/form-sheet/*.{h,m,mm}; do
  relative=${file#"$repo_root/"}
  if ! grep -Fxq "$relative" "$temp_dir/mapped-lynx"; then
    compare '' "$relative"
  fi
done

printf '\nSummary: %s same, %s changed, %s RNS-only, %s Lynx-only.\n' \
  "$same" "$changed" "$rns_only" "$lynx_only" >&3
if [[ $changed -gt 0 || $rns_only -gt 0 || $lynx_only -gt 0 ]]; then exit 1; fi
