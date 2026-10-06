#!/usr/bin/env bash
# Compare Android FormSheet working-tree files, excluding package and import declarations.
# Exit codes: 0 = identical, 1 = differences or missing counterparts, 2 = error.
set -euo pipefail

usage() {
  printf '%s\n' \
    'Usage: diff-formsheet-rns.sh [RNS_REPOSITORY]' \
    '' \
    'Defaults to the react-native-screens repository next to this repository.' \
    'Compares each upstream Android native FormSheet file with its Lynx counterpart.' \
    'Diff direction: - RNS, + Lynx. Package and import declarations are excluded.' \
    'Includes uncommitted changes. Hunk line numbers refer to filtered content.' \
    'Lynx-only bridge files and iOS files are outside this comparison.' \
    '' \
    'Exit codes: 0 = identical, 1 = differences or missing counterparts, 2 = error.'
}

if [[ $# -gt 1 ]]; then
  usage >&2
  exit 2
fi
if [[ ${1:-} == '--help' || ${1:-} == '-h' ]]; then
  usage
  exit 0
fi

if ! repo_root=$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel); then
  exit 2
fi

rns_repo=${1:-"$repo_root/../react-native-screens"}
rns_native="$rns_repo/android/src/main/java/com/swmansion/rnscreens/modals/formsheet/native"
lynx_main="$repo_root/android/src/main/java/com/lynxscreens/screens/formsheet"
lynx_material="$repo_root/android/src/formSheetMaterial/java/com/lynxscreens/screens/formsheet"

for directory in "$rns_native" "$lynx_main" "$lynx_material"; do
  if [[ ! -d "$directory" ]]; then
    printf 'Directory not found: %s\n' "$directory" >&2
    exit 2
  fi
done

shopt -s nullglob
upstream_files=("$rns_native"/*/*.kt)
if [[ ${#upstream_files[@]} -eq 0 ]]; then
  printf 'No Android FormSheet Kotlin files found in: %s\n' "$rns_native" >&2
  exit 2
fi

if ! temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/diff-formsheet-rns.XXXXXX"); then
  exit 2
fi
trap 'rm -rf "$temp_dir"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

changed=0
missing=0
for upstream in "${upstream_files[@]}"; do
  relative=${upstream#"$rns_native"/}
  counterpart="$lynx_main/$relative"
  if [[ ! -f "$counterpart" ]]; then
    counterpart="$lynx_material/$relative"
  fi

  if [[ ! -f "$counterpart" ]]; then
    printf 'Missing Lynx counterpart: %s\n' "$relative" >&2
    missing=$((missing + 1))
    continue
  fi

  # Filter both inputs so package/import changes are excluded even in mixed diff hunks.
  if ! mkdir -p "$temp_dir/rns/$(dirname "$relative")" "$temp_dir/lynx/$(dirname "$relative")" ||
    ! sed -E '/^[[:space:]]*(package|import)[[:space:]]/d' "$upstream" > "$temp_dir/rns/$relative" ||
    ! sed -E '/^[[:space:]]*(package|import)[[:space:]]/d' "$counterpart" > "$temp_dir/lynx/$relative"; then
    exit 2
  fi

  # git diff returns 1 for differences; keep comparing the remaining files.
  if git --no-pager -C "$temp_dir" diff --no-index --no-ext-diff --no-textconv --color=auto \
    --src-prefix= --dst-prefix= -- "rns/$relative" "lynx/$relative"; then
    continue
  else
    status=$?
    if [[ $status -ne 1 ]]; then
      printf 'Comparison failed for %s (git exit code %s).\n' "$relative" "$status" >&2
      exit 2
    fi
    changed=$((changed + 1))
  fi
done

printf 'Checked %s upstream files: %s changed, %s missing Lynx counterparts.\n' \
  "${#upstream_files[@]}" "$changed" "$missing" >&2
if [[ $changed -gt 0 || $missing -gt 0 ]]; then
  exit 1
fi
