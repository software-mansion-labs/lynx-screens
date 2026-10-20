#!/usr/bin/env bash
# Compare iOS and Android FormSheet working trees. Exit: 0 identical, 1 differences, 2 error.
set -euo pipefail

usage() {
  printf '%s\n' \
    'Usage: diff-formsheet-rns.sh [--platform ios|android|all] [--raw] [--summary] [RNS_REPOSITORY]' \
    '' \
    '--platform: select native sources to compare (default: all).' \
    'Default upstream: ../react-native-screens relative to this repository.' \
    'Direction: - RNS, + Lynx. Includes staged and unstaged working-tree contents.' \
    'Default: omit imports/includes and Kotlin package declarations.' \
    '--raw: retain declarations and original source line numbers.' \
    '--summary: show file mappings and status without patch bodies.' \
    'Diff mode writes only patches; metadata, file status and statistics require --summary.' \
    '' \
    'iOS mappings: ComponentView -> Component; HostShadowStateProxy -> common/RNSShadowStateProxy.' \
    'Fabric C++ files and Lynx custom ShadowNode files are shown separately (not 1:1).' \
    'Android: compare upstream native FormSheet files with main/formSheetMaterial counterparts.' \
    'Android Lynx-only bridge files are outside this comparison.' \
    'Only-side entries show source coverage, not necessarily missing migration work.' \
    'TypeScript, examples and build configuration are outside this comparison.' \
    '' \
    'Exit codes: 0 = identical, 1 = differences or missing counterparts, 2 = error.'
}

platform=all
raw=false
summary=false
rns_repo=''
while [[ $# -gt 0 ]]; do
  case "$1" in
    --platform)
      if [[ $# -lt 2 ]]; then usage >&2; exit 2; fi
      platform=$2
      shift
      ;;
    --platform=*) platform=${1#--platform=} ;;
    --raw) raw=true ;;
    --summary) summary=true ;;
    --help|-h) usage; exit 0 ;;
    -*) usage >&2; exit 2 ;;
    *)
      if [[ -n "$rns_repo" ]]; then usage >&2; exit 2; fi
      rns_repo=$1
      ;;
  esac
  shift
done
case "$platform" in
  ios|android|all) ;;
  *) printf 'Unknown platform: %s\n' "$platform" >&2; usage >&2; exit 2 ;;
esac

# Metadata is only visible in summary mode; errors still go to stderr.
if $summary; then
  exec 3>&1
else
  exec 3>/dev/null
fi

repo_root=$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel) || exit 2
rns_repo=${rns_repo:-"$repo_root/../react-native-screens"}
rns_android='android/src/main/java/com/swmansion/rnscreens/core/modals/formsheet'
lynx_android_main='android/src/main/java/com/lynxscreens/screens/core/modals/formsheet'
lynx_android_material='android/src/formSheetMaterial/java/com/lynxscreens/screens/core/modals/formsheet'

required_dirs=()
if [[ $platform != android ]]; then
  required_dirs+=("$rns_repo/ios/modals/form-sheet" "$rns_repo/ios/modals/utils"
    "$rns_repo/common/cpp/react/renderer/components/rnscreens" "$repo_root/ios/form-sheet")
fi
if [[ $platform != ios ]]; then
  required_dirs+=("$rns_repo/$rns_android" "$repo_root/$lynx_android_main" "$repo_root/$lynx_android_material")
fi
for directory in "${required_dirs[@]}"; do
  if [[ ! -d "$directory" ]]; then
    printf 'Directory not found: %s\n' "$directory" >&2
    exit 2
  fi
done

# Validate the selected inputs before emitting any comparison output.
shopt -s nullglob
if [[ $platform != android ]]; then
  ios_files=("$rns_repo"/ios/modals/form-sheet/*.{h,m,mm})
  if [[ ${#ios_files[@]} -eq 0 ]]; then
    printf 'No upstream iOS FormSheet files found.\n' >&2
    exit 2
  fi
  for required in RNSPresentationSourceProvider.h RNSPresentationSourceProvider.mm; do
    if [[ ! -f "$rns_repo/ios/modals/utils/$required" ]]; then
      printf 'Required upstream file missing: %s\n' "$required" >&2
      exit 2
    fi
    ios_files+=("$rns_repo/ios/modals/utils/$required")
  done
fi
if [[ $platform != ios ]]; then
  android_files=("$rns_repo/$rns_android"/*/*.kt)
  if [[ ${#android_files[@]} -eq 0 ]]; then
    printf 'No upstream Android FormSheet Kotlin files found: %s\n' "$rns_repo/$rns_android" >&2
    exit 2
  fi
fi

temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/diff-formsheet-rns.XXXXXX") || exit 2
trap 'rm -rf "$temp_dir"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
mkdir -p "$temp_dir/rns" "$temp_dir/lynx" || exit 2
: > "$temp_dir/mapped-lynx"

if $summary; then
  printf 'RNS:  %s @ %s\n' "$rns_repo" "$(git -C "$rns_repo" rev-parse HEAD 2>/dev/null || printf unknown)" >&3
  printf 'Lynx: %s @ %s\n' "$repo_root" "$(git -C "$repo_root" rev-parse HEAD)" >&3
  printf 'Comparing %s working-tree sources; direction: - RNS, + Lynx\n' "$platform" >&3
  if ! $raw; then
    printf 'Declarations omitted; hunk numbers refer to filtered content. Use --raw for exact sources.\n' >&3
  fi
  printf 'Only-side files include framework-specific replacements, not just missing ports.\n\n' >&3
fi

same=0
changed=0
rns_only=0
lynx_only=0

compare() {
  local upstream=$1 counterpart=$2 status source target declarations
  source="$temp_dir/rns/${upstream:-EMPTY}"
  target="$temp_dir/lynx/${counterpart:-EMPTY}"
  mkdir -p "$(dirname "$source")" "$(dirname "$target")" || exit 2
  case "${upstream:-$counterpart}" in
    *.kt) declarations='/^[[:space:]]*(package|import)[[:space:]]/d' ;;
    *) declarations='/^[[:space:]]*#[[:space:]]*(import|include)[[:space:]]/d' ;;
  esac
  if [[ -n "$upstream" ]]; then
    if $raw; then
      cp "$rns_repo/$upstream" "$source" || exit 2
    else
      sed -E "$declarations" "$rns_repo/$upstream" > "$source" || exit 2
    fi
  else
    : > "$source"
  fi
  if [[ -n "$counterpart" ]]; then
    if $raw; then
      cp "$repo_root/$counterpart" "$target" || exit 2
    else
      sed -E "$declarations" "$repo_root/$counterpart" > "$target" || exit 2
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

if [[ $platform != android ]]; then
  for file in "${ios_files[@]}"; do
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
  # Keep them visible instead of guessing a misleading one-to-one pairing.
  for file in "$rns_repo"/common/cpp/react/renderer/components/rnscreens/RNSFormSheetHost*.{h,cpp}; do
    compare "${file#"$rns_repo/"}" ''
  done
  for file in "$repo_root"/ios/form-sheet/*.{h,m,mm}; do
    relative=${file#"$repo_root/"}
    if ! grep -Fxq "$relative" "$temp_dir/mapped-lynx"; then
      compare '' "$relative"
    fi
  done
fi

if [[ $platform != ios ]]; then
  for file in "${android_files[@]}"; do
    relative=${file#"$rns_repo/$rns_android/"}
    counterpart="$lynx_android_main/$relative"
    if [[ ! -f "$repo_root/$counterpart" ]]; then
      counterpart="$lynx_android_material/$relative"
    fi
    if [[ ! -f "$repo_root/$counterpart" ]]; then
      counterpart=''
    fi
    compare "${file#"$rns_repo/"}" "$counterpart"
  done
fi

printf '\nSummary: %s same, %s changed, %s RNS-only, %s Lynx-only.\n' \
  "$same" "$changed" "$rns_only" "$lynx_only" >&3
if [[ $changed -gt 0 || $rns_only -gt 0 || $lynx_only -gt 0 ]]; then exit 1; fi
