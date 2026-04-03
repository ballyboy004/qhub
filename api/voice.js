// api/voice.js — CommonJS format for Vercel compatibility
const SYSTEM_PROMPT = `You are a task intelligence system for Samuel Quinn Gilmore, a 21-year-old entrepreneur in Temecula CA.
He runs Noctive Group (AI automation for contractors), TuneofQ (dark R&B/trap beats), and BLACKBOX (music talent platform).

Take raw voice note text → extract clear, actionable tasks.
Categories: Noctive | Music | Income | Network | Promo | BLACKBOX | Life | General
Priority: 1=today, 2=this week, 3=someday

Return ONLY valid JSON, no markdown, no explanation:
{"tasks":[{"title":"Verb + object","category":"X","priority":1,"note":"one line or empty string"}]}

Max 8 tasks. Title must start with a verb.`;

async function redisGet(url, token) {
  const res  = await fetch(`${url}/get/qhub_tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.result) return [];
  return JSON.parse(data.result);
}

async function redisSet(url, token, tasks) {
  const value = JSON.stringify(tasks);
  // Use the simple REST SET endpoint
  const res = await fetch(`${url}/set/qhub_tasks`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(value),
  });
  return res.ok;
}

module.exports = async function handler(req, res) {
  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth
  if (req.headers['x-qhub-token'] !== process.env.QHUB_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body || {};
  const text = (body.text || '').trim();

  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  const REDIS_URL     = process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN   = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY' });
  if (!REDIS_URL)     return res.status(500).json({ error: 'Missing UPSTASH_REDIS_REST_URL' });
  if (!REDIS_TOKEN)   return res.status(500).json({ error: 'Missing UPSTASH_REDIS_REST_TOKEN' });

  try {
    // Call Claude
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001', // faster/cheaper for task processing
        max_tokens: 600,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: text }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      return res.status(500).json({ error: 'Claude error: ' + err });
    }

    const claudeData = await claudeRes.json();
    const raw        = claudeData.content[0].text.trim().replace(/```json|```/g, '').trim();
    const parsed     = JSON.parse(raw);

    const now     = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const newTasks = (parsed.tasks || []).map((t, i) => ({
      id:       `${Date.now()}-${i}`,
      title:    t.title    || 'Task',
      category: t.category || 'General',
      priority: t.priority || 2,
      note:     t.note     || '',
      done:     false,
      date:     dateStr,
      time:     timeStr,
      source:   'voice',
    }));

    // Save to Redis
    const existing = await redisGet(REDIS_URL, REDIS_TOKEN);
    await redisSet(REDIS_URL, REDIS_TOKEN, [...newTasks, ...existing]);

    return res.status(200).json({ ok: true, tasks_added: newTasks.length, tasks: newTasks });

  } catch (e) {
    console.error('[voice] error:', e);
    return res.status(500).json({ error: e.message || 'Unknown error' });
  }
};
