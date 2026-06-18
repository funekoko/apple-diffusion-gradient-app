#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="弥散渐变生成器"
APP_DIR="$ROOT_DIR/$APP_NAME.app"
CONTENTS="$APP_DIR/Contents"
MACOS="$CONTENTS/MacOS"
RESOURCES="$CONTENTS/Resources"
WWW="$RESOURCES/www"

mkdir -p "$MACOS" "$WWW"
cp "$ROOT_DIR/native/Info.plist" "$CONTENTS/Info.plist"
cp "$ROOT_DIR/index.html" "$WWW/index.html"
cp "$ROOT_DIR/styles.css" "$WWW/styles.css"
cp "$ROOT_DIR/app.js" "$WWW/app.js"

export CLANG_MODULE_CACHE_PATH="$ROOT_DIR/.module-cache"
mkdir -p "$CLANG_MODULE_CACHE_PATH"

clang "$ROOT_DIR/native/GradientApp.m" \
  -o "$MACOS/GradientApp" \
  -fobjc-arc \
  -arch arm64 \
  -arch x86_64 \
  -mmacosx-version-min=12.0 \
  -framework Cocoa \
  -framework UniformTypeIdentifiers \
  -framework WebKit

chmod +x "$MACOS/GradientApp"
codesign --force --deep --sign - "$APP_DIR"
echo "$APP_DIR"
