// api/tasks.js
// GET    /api/tasks       → return all tasks
// PATCH  /api/tasks       → toggle task done { id, done }
// DELETE /api/tasks       → clear done tasks
// DELETE /api/tasks?id=X  → delete one task

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
  await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', 'qhub_tasks', JSON.stringify(tasks)]),
  });
}


export default async function handler(req, res) {
  // Auth
  const token = req.headers['x-qhub-token'];
  if (token !== process.env.QHUB_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET — return all tasks
  if (req.method === 'GET') {
    const tasks = await redisGet();
    return res.status(200).json(tasks);
  }

  // PATCH — toggle done
  if (req.method === 'PATCH') {
    const { id, done } = req.body;
    const tasks   = await redisGet();
    const updated = tasks.map(t => t.id === id ? { ...t, done } : t);
    await redisSet(updated);
    return res.status(200).json({ ok: true });
  }

  // DELETE — one task or all done tasks
  if (req.method === 'DELETE') {
    const { id } = req.query;
    let tasks = await redisGet();
    tasks = id ? tasks.filter(t => t.id !== id) : tasks.filter(t => !t.done);
    await redisSet(tasks);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
