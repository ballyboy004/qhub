// QHUB Local Server
// Run with: npm run dev
// Handles all API routes locally so osascript (Mac control) actually works.
// The Vercel deploy handles voice/tasks via Redis — this layer adds Mac automation on top.

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

try { require('dotenv').config({ path: path.join(__dirname, '.env.local') }); } catch(e) {}

const PORT   = process.env.PORT || 3000;
const SECRET = process.env.QHUB_SECRET || 'qhub-samuel-2026-noctive';

const MODE_SCRIPTS = {
  noctive: {
    label: 'Noctive Mode',
    script: `tell application "Google Chrome"
  activate
  if (count of windows) = 0 then
    make new window
  end if
  set W to front window
  set URL of active tab of W to "https://noctive-lead-engine-dztnw3c87n2iz5tyse52aw.streamlit.app/"
  tell W to make new tab at end of tabs
  set URL of last tab of W to "https://app.instantly.ai"
  set active tab index of W to 1
end tell`
  },
  music: {
    label: 'Music Mode',
    script: `tell application "System Events"
  set distracting to {"Slack", "Discord", "Mail", "Messages"}
  repeat with appName in distracting
    if exists (processes where name is appName) then
      tell application appName to quit
    end if
  end repeat
end tell
try
  do shell script "open -a 'FL Studio 21'"
on error
  try
    do shell script "open -a 'FL Studio 20'"
  on error
    try
      do shell script "open -a 'FL Studio'"
    end try
  end try
end try`
  },
  blkbox: {
    label: 'BLKBOX Mode',
    // blkbx alias: attaches to tmux session 'blackbox', or creates it
    // then opens Chrome with Vercel + Supabase
    script: `tell application "Terminal"
  activate
  do script "source ~/.zshrc && blkbx"
end tell
delay 1
tell application "Google Chrome"
  activate
  if (count of windows) = 0 then
    make new window
  end if
  set W to front window
  set URL of active tab of W to "https://vercel.com/dashboard"
  tell W to make new tab at end of tabs
  set URL of last tab of W to "https://supabase.com/dashboard/projects"
  set active tab index of W to 1
end tell`
  }
};

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
  });
}

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

const VERCEL_URL = process.env.VERCEL_URL || 'https://qhub-pied.vercel.app';

async function proxyToVercel(req, body) {
  const fetch = require('node-fetch');
  const url = VERCEL_URL + req.url;
  const opts = { method: req.method, headers: { 'Content-Type': 'application/json', 'x-qhub-token': SECRET } };
  if (body && Object.keys(body).length) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return { status: r.status, data: await r.json() };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE' });
    return res.end();
  }

  const url = req.url.split('?')[0];

  if (url === '/' || url === '/index.html') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(html);
  }

  if (url === '/api/mac' && req.method === 'POST') {
    if (req.headers['x-qhub-token'] !== SECRET) return sendJSON(res, 401, { error: 'Unauthorized' });
    const body = await parseBody(req);
    const cfg = MODE_SCRIPTS[body.mode];
    if (!cfg) return sendJSON(res, 400, { error: 'Unknown mode' });
    console.log(`[mac] Launching ${cfg.label}...`);
    try {
      const tmpFile = `/tmp/qhub_${body.mode}.applescript`;
      fs.writeFileSync(tmpFile, cfg.script);
      await execAsync(`osascript "${tmpFile}"`);
      console.log(`[mac] ${cfg.label} done`);
      return sendJSON(res, 200, { ok: true, mode: body.mode });
    } catch (e) {
      console.error('[mac] error:', e.message);
      return sendJSON(res, 200, { ok: false, error: e.message });
    }
  }

  if (url === '/api/voice' || url === '/api/tasks' || url === '/api/test') {
    if (req.headers['x-qhub-token'] !== SECRET) return sendJSON(res, 401, { error: 'Unauthorized' });
    const body = await parseBody(req);
    try {
      const { status, data } = await proxyToVercel(req, body);
      return sendJSON(res, status, data);
    } catch (e) {
      return sendJSON(res, 500, { error: 'Proxy error: ' + e.message });
    }
  }

  sendJSON(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`\n  Q · HUB running at http://localhost:${PORT}`);
  console.log(`  Mac control: ACTIVE`);
  console.log(`  BLKBOX mode: tmux attach -t blackbox via blkbx alias\n`);
});
