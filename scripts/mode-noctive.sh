#!/bin/bash
# QHUB — Noctive Mode
# Opens: Lead Engine + Instantly in Chrome
# Hides: everything else
# Creates/switches to dedicated Space 2

NODE=/usr/local/bin/node
QHUB_DIR="$HOME/Documents/qhub-site"
SECRET="qhub-samuel-2026-noctive"

# 1. Ping QHUB server to activate mode in dashboard
curl -s -X POST http://localhost:3000/api/mode \
  -H "Content-Type: application/json" \
  -H "x-qhub-token: $SECRET" \
  -d '{"mode":"noctive"}' &

# 2. Open Chrome with mode tabs
osascript << 'APPLE'
tell application "Google Chrome"
  activate
  if (count of windows) = 0 then make new window
  set W to front window
  set URL of active tab of W to "https://noctive-lead-engine-dztnw3c87n2iz5tyse52aw.streamlit.app/"
  tell W to make new tab at end of tabs
  set URL of last tab of W to "https://app.instantly.ai"
  set active tab index of W to 1
end tell
APPLE

# 3. Hide all other apps (leave Chrome visible)
osascript -e '
tell application "System Events"
  set frontApp to name of first process whose frontmost is true
  repeat with proc in (every process whose visible is true)
    if name of proc is not "Google Chrome" and name of proc is not "Finder" then
      set visible of proc to false
    end if
  end repeat
end tell'

# 4. Notification
osascript -e 'display notification "Lead Engine + Instantly ready. Distractions hidden." with title "Noctive Mode" subtitle "⚡ Sales stack active"'
