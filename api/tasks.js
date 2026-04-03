// api/tasks.js — CommonJS format

async function redisGet(url, token) {
  const res  = await fetch(`${url}/get/qhub_tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.result) return [];
  return JSON.parse(data.result);
}

async function redisSet(url, token, tasks) {
  await fetch(`${url}/set/qhub_tasks`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(JSON.stringify(tasks)),
  });
}

module.exports = async function handler(req, res) {
  if (req.headers['x-qhub-token'] !== process.env.QHUB_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    if (req.method === 'GET') {
      const tasks = await redisGet(REDIS_URL, REDIS_TOKEN);
      return res.status(200).json(tasks);
    }

    if (req.method === 'PATCH') {
      const { id, done } = req.body;
      const tasks   = await redisGet(REDIS_URL, REDIS_TOKEN);
      const updated = tasks.map(t => t.id === id ? { ...t, done } : t);
      await redisSet(REDIS_URL, REDIS_TOKEN, updated);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      let tasks = await redisGet(REDIS_URL, REDIS_TOKEN);
      tasks = id ? tasks.filter(t => t.id !== id) : tasks.filter(t => !t.done);
      await redisSet(REDIS_URL, REDIS_TOKEN, tasks);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (e) {
    console.error('[tasks] error:', e);
    return res.status(500).json({ error: e.message });
  }
};
