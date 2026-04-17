#!/bin/bash
# QHUB LaunchAgent Setup
# Run once: bash /Users/samuelgilmore/Documents/qhub-site/scripts/install-launchagent.sh

PLIST="$HOME/Library/LaunchAgents/com.q.qhub.plist"
QHUB_DIR="$HOME/Documents/qhub-site"
NODE_PATH="/usr/local/bin/node"

echo "Installing QHUB LaunchAgent..."

# Write the plist
cat > "$PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.q.qhub</string>

  <key>ProgramArguments</key>
  <array>
    <string>$NODE_PATH</string>
    <string>$QHUB_DIR/server.js</string>
  </array>

  <key>WorkingDirectory</key>
  <string>$QHUB_DIR</string>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>StandardOutPath</key>
  <string>$HOME/Library/Logs/qhub.log</string>

  <key>StandardErrorPath</key>
  <string>$HOME/Library/Logs/qhub-error.log</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>HOME</key>
    <string>$HOME</string>
  </dict>
</dict>
</plist>
EOF

# Stop old instance if running
launchctl unload "$PLIST" 2>/dev/null || true

# Load the new agent
launchctl load "$PLIST"

echo ""
echo "✓ QHUB LaunchAgent installed"
echo "  Server starts automatically at login"
echo "  Logs: ~/Library/Logs/qhub.log"
echo "  To check status: launchctl list | grep qhub"
echo "  To stop: launchctl unload ~/Library/LaunchAgents/com.q.qhub.plist"
echo "  To restart: launchctl kickstart -k gui/\$(id -u)/com.q.qhub"
echo ""
echo "  Dashboard: http://localhost:3000"
