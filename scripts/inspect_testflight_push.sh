#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /path/to/Ally.ipa [output_dir]"
  exit 1
fi

IPA_PATH="$1"
if [[ ! -f "$IPA_PATH" ]]; then
  echo "IPA not found: $IPA_PATH"
  exit 1
fi

OUTPUT_DIR="${2:-./artifacts/push-investigation}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_DIR="$OUTPUT_DIR/$STAMP"
TMP_DIR="/tmp/ally_ipa_$STAMP"

mkdir -p "$RUN_DIR"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

echo "[1/5] Extracting IPA..."
unzip -q "$IPA_PATH" -d "$TMP_DIR"

APP_DIR="$(find "$TMP_DIR/Payload" -maxdepth 1 -type d -name '*.app' | head -n 1)"
if [[ -z "${APP_DIR:-}" ]]; then
  echo "Failed to find .app bundle in IPA payload"
  exit 1
fi

APP_BIN_NAME="$(basename "$APP_DIR" .app)"
APP_BIN="$APP_DIR/$APP_BIN_NAME"
if [[ ! -f "$APP_BIN" ]]; then
  APP_BIN="$(find "$APP_DIR" -maxdepth 1 -type f -perm -111 | head -n 1 || true)"
fi

if [[ ! -f "${APP_BIN:-}" ]]; then
  echo "Failed to locate app binary in $APP_DIR"
  exit 1
fi

echo "[2/5] Dumping signed entitlements..."
codesign -d --entitlements :- "$APP_DIR" > "$RUN_DIR/signed-entitlements.plist" 2> "$RUN_DIR/codesign.stderr.log" || true

echo "[3/5] Checking APNs entitlement..."
if rg -n "aps-environment" "$RUN_DIR/signed-entitlements.plist" > "$RUN_DIR/aps-entitlement-check.txt"; then
  echo "aps-environment present" | tee -a "$RUN_DIR/summary.txt"
else
  echo "aps-environment missing" | tee -a "$RUN_DIR/summary.txt"
fi

echo "[4/5] Inspecting push plugin symbols in app binary..."
strings "$APP_BIN" | rg -n "CAPPush|PushNotifications|registrationError|didRegisterForRemoteNotifications" > "$RUN_DIR/push-symbols.txt" || true
if [[ -s "$RUN_DIR/push-symbols.txt" ]]; then
  echo "push-related symbols present" | tee -a "$RUN_DIR/summary.txt"
else
  echo "push-related symbols missing" | tee -a "$RUN_DIR/summary.txt"
fi

echo "[5/5] Comparing project wiring in repo..."
rg -n "CODE_SIGN_ENTITLEMENTS|relativePath = \"CapApp-SPM|PRODUCT_BUNDLE_IDENTIFIER" \
  ios/App/ALLY.xcodeproj/project.pbxproj \
  ios/App/App.xcodeproj/project.pbxproj > "$RUN_DIR/xcodeproj-wiring.txt"

cat > "$RUN_DIR/next-steps.txt" <<'EON'
Next checks:
1. If aps-environment is missing: archive/build is using a project/target config without entitlements.
2. If push symbols are missing: plugin linkage issue in iOS project package wiring.
3. If both are present: proceed to runtime logs on device for registrationError / permission path.
EON

rm -rf "$TMP_DIR"

echo "Done. Artifacts saved to: $RUN_DIR"
