#!/usr/bin/env bash
set -euo pipefail

platform="${1:-}"
case "$platform" in
  android | ios | web) ;;
  *)
    echo "Usage: $0 <android|ios|web>"
    exit 1
    ;;
esac

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
tmp_root="${RUNNER_TEMP:-$(mktemp -d)}"
pack_dir="$tmp_root/plugin-package"
test_app="$tmp_root/plugin-example-app"

cd "$repo_root"

bun run build

rm -rf "$pack_dir" "$test_app"
mkdir -p "$pack_dir" "$test_app"
bun pm pack --destination "$pack_dir" --quiet

shopt -s nullglob
packed_packages=("$pack_dir"/*.tgz)
shopt -u nullglob
if [ "${#packed_packages[@]}" -ne 1 ]; then
  echo "Expected exactly one package tarball, found ${#packed_packages[@]}"
  exit 1
fi

plugin_name="$(bun -e 'console.log(require("./package.json").name)')"
cp -R example-app/. "$test_app/"
cd "$test_app"
bun remove "$plugin_name"
bun add "${packed_packages[0]}"
bun run build

case "$platform" in
  android)
    if [ ! -d android ]; then
      bunx cap add android
    fi
    bunx cap sync android
    cd android
    ./gradlew build test
    ;;
  ios)
    if [ ! -d ios ]; then
      bunx cap add ios
    fi
    bunx cap sync ios
    if [ -f app-shortcuts.config.json ]; then
      node "$repo_root/scripts/generate-app-shortcuts.mjs" \
        --config app-shortcuts.config.json \
        --output ios-shortcuts/CapgoGeneratedAppShortcuts.swift
    fi
    if [ -f ios-shortcuts/CapgoGeneratedAppShortcuts.swift ] && [ -d ios/App/App ]; then
      cp ios-shortcuts/CapgoGeneratedAppShortcuts.swift ios/App/App/CapgoGeneratedAppShortcuts.swift
    fi
    if [ -f ios/App/CapApp-SPM/Package.swift ]; then
      sed -i.bak 's/.iOS(.v15)/.iOS(.v16)/g' ios/App/CapApp-SPM/Package.swift
      rm -f ios/App/CapApp-SPM/Package.swift.bak
    fi
    rm -rf "$HOME/Library/Caches/org.swift.swiftpm/artifacts"/https___github_com_ionic_team_capacitor_swift_pm_releases_download_*
    xcodebuild \
      -project ios/App/App.xcodeproj \
      -scheme App \
      -destination generic/platform=iOS \
      -clonedSourcePackagesDirPath "$tmp_root/plugin-example-swiftpm" \
      -derivedDataPath "$tmp_root/plugin-example-derived-data" \
      CODE_SIGNING_ALLOWED=NO \
      IPHONEOS_DEPLOYMENT_TARGET=16.0
    ;;
  web)
    ;;
esac
