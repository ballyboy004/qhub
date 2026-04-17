#!/bin/bash
# Creates Automator Service workflows for QHUB keyboard shortcuts
# These install as macOS Services, assignable via:
# System Settings → Keyboard → Keyboard Shortcuts → Services
#
# Shortcuts to assign after running this:
#   QHUB Noctive Mode  →  ⌥⌘N
#   QHUB Music Mode    →  ⌥⌘M
#   QHUB BLKBOX Mode   →  ⌥⌘B
#   QHUB Exit Mode     →  ⌥⌘0

SCRIPTS_DIR="$HOME/Documents/qhub-site/scripts"
SERVICES_DIR="$HOME/Library/Services"

mkdir -p "$SERVICES_DIR"

create_service() {
  local NAME="$1"
  local SCRIPT_PATH="$2"
  local SERVICE_DIR="$SERVICES_DIR/${NAME}.workflow"
  local CONTENTS_DIR="$SERVICE_DIR/Contents"

  mkdir -p "$CONTENTS_DIR"

  # Info.plist
  cat > "$CONTENTS_DIR/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSServices</key>
  <array>
    <dict>
      <key>NSMenuItem</key>
      <dict>
        <key>default</key>
        <string>${NAME}</string>
      </dict>
      <key>NSMessage</key>
      <string>runWorkflowAsService</string>
    </dict>
  </array>
</dict>
</plist>
EOF

  # document.wflow
  cat > "$CONTENTS_DIR/document.wflow" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>AMApplicationBuild</key>
  <string>523</string>
  <key>AMApplicationVersion</key>
  <string>2.10</string>
  <key>AMDocumentVersion</key>
  <string>2</string>
  <key>actions</key>
  <array>
    <dict>
      <key>action</key>
      <dict>
        <key>AMAccepts</key>
        <dict>
          <key>Container</key>
          <string>List</string>
          <key>Optional</key>
          <true/>
          <key>Types</key>
          <array><string>com.apple.cocoa.string</string></array>
        </dict>
        <key>AMActionVersion</key>
        <string>2.0.3</string>
        <key>AMApplication</key>
        <array><string>Automator</string></array>
        <key>AMParameterProperties</key>
        <dict>
          <key>COMMAND_STRING</key>
          <dict/>
          <key>inputMethod</key>
          <dict/>
          <key>shell</key>
          <dict/>
          <key>source</key>
          <dict/>
        </dict>
        <key>AMProvides</key>
        <dict>
          <key>Container</key>
          <string>List</string>
          <key>Types</key>
          <array><string>com.apple.cocoa.string</string></array>
        </dict>
        <key>ActionBundlePath</key>
        <string>/System/Library/Automator/Run Shell Script.action</string>
        <key>ActionName</key>
        <string>Run Shell Script</string>
        <key>ActionParameters</key>
        <dict>
          <key>COMMAND_STRING</key>
          <string>bash ${SCRIPT_PATH}</string>
          <key>inputMethod</key>
          <integer>0</integer>
          <key>shell</key>
          <string>/bin/bash</string>
          <key>source</key>
          <string></string>
        </dict>
        <key>BundleIdentifier</key>
        <string>com.apple.RunShellScript</string>
        <key>CFBundleVersion</key>
        <string>2.0.3</string>
        <key>CanShowSelectedItemsWhenRun</key>
        <false/>
        <key>CanShowWhenRun</key>
        <true/>
        <key>Category</key>
        <array><string>AMCategoryUtilities</string></array>
        <key>Class Name</key>
        <string>RunShellScriptAction</string>
        <key>InputUUID</key>
        <string>$(uuidgen)</string>
        <key>Keywords</key>
        <array><string>Shell</string><string>Script</string><string>Command</string><string>Run</string></array>
        <key>OutputUUID</key>
        <string>$(uuidgen)</string>
        <key>UUID</key>
        <string>$(uuidgen)</string>
        <key>UnlockRunRequiresUserAction</key>
        <false/>
        <key>arguments</key>
        <dict>
          <key>0</key>
          <dict>
            <key>default value</key>
            <integer>0</integer>
            <key>name</key>
            <string>inputMethod</string>
            <key>required</key>
            <string>0</string>
            <key>type</key>
            <string>0</string>
            <key>uuid</key>
            <string>0</string>
          </dict>
          <key>1</key>
          <dict>
            <key>default value</key>
            <string></string>
            <key>name</key>
            <string>COMMAND_STRING</string>
            <key>required</key>
            <string>0</string>
            <key>type</key>
            <string>0</string>
            <key>uuid</key>
            <string>1</string>
          </dict>
        </dict>
        <key>conversionLabel</key>
        <integer>0</integer>
        <key>isViewVisible</key>
        <true/>
        <key>location</key>
        <string>309.5:153.0</string>
        <key>nibPath</key>
        <string>/System/Library/Automator/Run Shell Script.action/Contents/Resources/English.lproj/main.nib</string>
      </dict>
      <key>isViewVisible</key>
      <true/>
    </dict>
  </array>
  <key>connectors</key>
  <dict/>
  <key>workflowMetaData</key>
  <dict>
    <key>serviceInputTypeIdentifier</key>
    <string>com.apple.Automator.noInput</string>
    <key>serviceOutputTypeIdentifier</key>
    <string>com.apple.Automator.noOutput</string>
    <key>serviceProcessesInput</key>
    <false/>
    <key>workflowTypeIdentifier</key>
    <string>com.apple.Automator.servicesMenu</string>
  </dict>
</dict>
</plist>
EOF

  echo "✓ Created: ${NAME}"
}

# Create all four workflows
create_service "QHUB Noctive Mode"  "$SCRIPTS_DIR/mode-noctive.sh"
create_service "QHUB Music Mode"    "$SCRIPTS_DIR/mode-music.sh"
create_service "QHUB BLKBOX Mode"   "$SCRIPTS_DIR/mode-blkbox.sh"
create_service "QHUB Exit Mode"     "$SCRIPTS_DIR/mode-exit.sh"

# Reload services database
/System/Library/CoreServices/pbs -update 2>/dev/null || true

echo ""
echo "✓ All 4 Automator Services installed"
echo ""
echo "To assign keyboard shortcuts:"
echo "  System Settings → Keyboard → Keyboard Shortcuts → Services → General"
echo ""
echo "  QHUB Noctive Mode  →  ⌥⌘N  (Option+Cmd+N)"
echo "  QHUB Music Mode    →  ⌥⌘M  (Option+Cmd+M)"
echo "  QHUB BLKBOX Mode   →  ⌥⌘B  (Option+Cmd+B)"
echo "  QHUB Exit Mode     →  ⌥⌘0  (Option+Cmd+Zero)"
echo ""
echo "You can also trigger modes directly:"
echo "  bash ~/Documents/qhub-site/scripts/mode-noctive.sh"
echo "  bash ~/Documents/qhub-site/scripts/mode-music.sh"
echo "  bash ~/Documents/qhub-site/scripts/mode-blkbox.sh"
echo "  bash ~/Documents/qhub-site/scripts/mode-exit.sh"
