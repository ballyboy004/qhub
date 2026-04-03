// api/voice.js
// POST /api/voice
// Two modes:
//   1. iPhone Shortcut: { text: "raw transcript" } → Claude processes → saves to Redis
//   2. Browser push:   { tasks: [...] }            → saves pre-built tasks directly

const SYSTEM_PROMPT = `You are a task intelligence system for Samuel Quinn Gilmore, a 21-year-old entrepreneur in Temecula CA.
He runs:
- Noctive Group: AI automation agency for contractors (GHL, cold email, follow-up automation)
- Music career as TuneofQ (dark R&B/trap beats, producer networking, sync placements)
- BLACKBOX: upcoming music industry talent intelligence platform
- Job search: part-time work in Temecula as income bridge

Take raw voice note / brain dump text → extract clear, actionable tasks.
Categories: Noctive | Music | Income | Network | Promo | BLACKBOX | Life | General
Priority: 1=today, 2=this week, 3=someday

Return ONLY valid JSON, no markdown:
{"tasks":[{"title":"Verb + object","category":"X","priority":1,"note":"context or empty string"}]}

Rules: max 8 tasks, title starts with verb, one action per task.`;


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


async function redisGet() {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const res   = await fetch(`${url}/get/qhub_tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : [];
}

async function redisSet(tasks) {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  // Upstash REST API: POST to root with command array
  await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', 'qhub_tasks', JSON.stringify(tasks)]),
  });
}


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth
  const token = req.headers['x-qhub-token'];
  if (token !== process.env.QHUB_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { text, tasks: prebuiltTasks } = req.body;

  try {
    const existing = await redisGet();
    let newTasks = [];

    // Mode 1: pre-built tasks from browser (no need to call Claude again)
    if (Array.isArray(prebuiltTasks) && prebuiltTasks.length > 0) {
      newTasks = prebuiltTasks;
    }
    // Mode 2: raw text from iPhone Shortcut → call Claude
    else if (text?.trim()) {
      const now     = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

      const parsed = await callClaude(text.trim());
      newTasks = parsed.tasks.map((t, i) => ({
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
    } else {
      return res.status(400).json({ error: 'Provide text or tasks' });
    }

    await redisSet([...newTasks, ...existing]);
    return res.status(200).json({ ok: true, tasks_added: newTasks.length });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
