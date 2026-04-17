#!/bin/bash
# QHUB — Music Mode
# Opens: FL Studio
# Closes: Slack, Discord, Mail, Messages, Safari, Chrome
# Sets Do Not Disturb

SECRET="qhub-samuel-2026-noctive"

# 1. Ping QHUB dashboard
curl -s -X POST http://localhost:3000/api/mode \
  -H "Content-Type: application/json" \
  -H "x-qhub-token: $SECRET" \
  -d '{"mode":"music"}' &

# 2. Kill distracting apps hard
for app in "Slack" "Discord" "Mail" "Messages" "Safari" "Notes" "Telegram"; do
  osascript -e "try
    tell application \"$app\" to quit
  end try" 2>/dev/null &
done

# 3. Hide remaining visible apps
osascript << 'APPLE'
tell application "System Events"
  repeat with proc in (every process whose visible is true)
    set n to name of proc
    if n is not "FL Studio 21" and n is not "FL Studio 20" and n is not "FL Studio" and n is not "Finder" then
      set visible of proc to false
    end if
  end repeat
end tell
APPLE

# 4. Launch FL Studio (try different versions)
osascript << 'APPLE'
set launched to false
repeat with flName in {"FL Studio 21", "FL Studio 20", "FL Studio"}
  try
    tell application flName to activate
    set launched to true
    exit repeat
  end try
end repeat
if not launched then
  try
    do shell script "open -a 'FL Studio'"
  end try
end if
APPLE

# 5. Turn on Do Not Disturb via Focus
osascript -e '
tell application "System Events"
  tell process "Control Center"
    try
      do shell script "shortcuts run \"Turn On Do Not Disturb\" 2>/dev/null || true"
    end try
  end tell
end tell' 2>/dev/null || true

# 6. Notification
osascript -e 'display notification "FL Studio open. Everything else hidden. Make something." with title "Music Mode" subtitle "🎹 Beat session active"'
