#!/bin/bash
# QHUB — Exit Mode (restore normal state)
# Shows all hidden apps, resets QHUB mode, turns off Do Not Disturb
# Trigger: ⌥⌘0 keyboard shortcut or clicking Default in QHUB

SECRET="qhub-samuel-2026-noctive"

# 1. Reset QHUB mode in dashboard
curl -s -X POST http://localhost:3000/api/mode \
  -H "Content-Type: application/json" \
  -H "x-qhub-token: $SECRET" \
  -d '{"mode":"none"}' &

# 2. Show all hidden applications
osascript << 'APPLE'
tell application "System Events"
  repeat with proc in every process
    try
      set visible of proc to true
    end try
  end repeat
end tell
APPLE

# 3. Turn off Do Not Disturb
osascript -e 'try
  do shell script "shortcuts run \"Turn Off Do Not Disturb\" 2>/dev/null || true"
end try' 2>/dev/null || true

# 4. Notification
osascript -e 'display notification "All apps restored. Focus mode off." with title "Default Mode" subtitle "✓ Back to normal"'
