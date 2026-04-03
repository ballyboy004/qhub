// api/voice.js
// Receives voice transcript from iPhone Shortcut
// Calls Claude API → processes into prioritized tasks
// Saves to Upstash Redis

const SYSTEM_PROMPT = `You are a task intelligence system for Samuel Quinn Gilmore, a 21-year-old entrepreneur in Temecula CA.
He runs:
- Noctive Group: AI automation agency for contractors (GHL, cold email, follow-up sequences)
- Music career as TuneofQ (dark R&B/trap beats, producer networking, sync placements)
- BLACKBOX: upcoming music industry talent intelligence platform
- Job search: part-time work in Temecula as income bridge

Your job: take raw voice note / brain dump text and extract clear, actionable tasks.

Categories: Noctive | Music | Income | Network | Promo | BLACKBOX | Life | General
Priority: 1 = do today (urgent/high impact), 2 = do this week, 3 = someday/low

Return ONLY valid JSON, no markdown, no explanation:
{
  "tasks": [
    {
      "title": "Short actionable task title starting with a verb",
      "category": "Category",
      "priority": 1,
      "note": "Optional one-line context or next step (empty string if none)"
    }
  ]
}

Rules:
- One task per action, max 8 tasks per dump
- Title always starts with a verb (Call, Build, Send, Research, Follow up, etc.)
- Prioritize ruthlessly — most things are a 2 or 3
- Vague ideas become Research or Plan tasks`;


async function callClaude(text) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-6',
      max_tokens: 800,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: text }],
    }),
  });
  const data  = await res.json();
  const raw   = data.content[0].text.trim();
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}


async function redisPush(tasks) {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Load existing
  const getRes  = await fetch(`${url}/get/qhub_tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getData = await getRes.json();
  const existing = getData.result ? JSON.parse(getData.result) : [];

  // Prepend new tasks
  const merged = [...tasks, ...existing];

  // Save back
  await fetch(`${url}/set/qhub_tasks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: JSON.stringify(merged) }),
  });

  return merged;
}


export default async function handler(req, res) {
  // Auth check
  const token = req.headers['x-qhub-token'];
  if (token !== process.env.QHUB_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;
  if (!text?.trim()) {
    return res.status(400).json({ error: 'Empty text' });
  }

  try {
    const parsed = await callClaude(text);

    const now     = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const newTasks = parsed.tasks.map((t, i) => ({
      id:       `${Date.now()}-${i}`,
      title:    t.title,
      category: t.category || 'General',
      priority: t.priority || 2,
      note:     t.note || '',
      done:     false,
      date:     dateStr,
      time:     timeStr,
      source:   'voice',
    }));

    await redisPush(newTasks);

    return res.status(200).json({ ok: true, tasks_added: newTasks.length, tasks: newTasks });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
