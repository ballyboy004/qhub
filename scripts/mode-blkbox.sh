#!/bin/bash
# QHUB — BLKBOX Mode
# Opens: Terminal with blkbx (tmux blackbox session) + Vercel + Supabase in Chrome
# Hides: everything else

SECRET="qhub-samuel-2026-noctive"

# 1. Ping QHUB dashboard
curl -s -X POST http://localhost:3000/api/mode \
  -H "Content-Type: application/json" \
  -H "x-qhub-token: $SECRET" \
  -d '{"mode":"blkbox"}' &

# 2. Open Terminal and run blkbx alias
osascript << 'APPLE'
tell application "Terminal"
  activate
  -- Check if blackbox tmux session exists
  try
    do script "source ~/.zshrc 2>/dev/null; blkbx"
  end try
end tell
APPLE

# 3. Open Chrome with Vercel + Supabase
osascript << 'APPLE'
tell application "Google Chrome"
  activate
  if (count of windows) = 0 then make new window
  set W to front window
  set URL of active tab of W to "https://vercel.com/dashboard"
  tell W to make new tab at end of tabs
  set URL of last tab of W to "https://supabase.com/dashboard/projects"
  set active tab index of W to 1
end tell
APPLE

# 4. Hide everything except Terminal and Chrome
osascript << 'APPLE'
tell application "System Events"
  repeat with proc in (every process whose visible is true)
    set n to name of proc
    if n is not "Terminal" and n is not "Google Chrome" and n is not "Finder" then
      set visible of proc to false
    end if
  end repeat
end tell
APPLE

# 5. Notification
osascript -e 'display notification "Claude Code session + Vercel + Supabase ready." with title "BLKBOX Mode" subtitle "⬛ Platform dev active"'
