// api/test.js — checks env vars and Redis connection
module.exports = async function handler(req, res) {
  if (req.headers['x-qhub-token'] !== process.env.QHUB_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const checks = {
    ANTHROPIC_API_KEY:         !!process.env.ANTHROPIC_API_KEY,
    UPSTASH_REDIS_REST_URL:    !!process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN:  !!process.env.UPSTASH_REDIS_REST_TOKEN,
    QHUB_SECRET:               !!process.env.QHUB_SECRET,
  };

  // Test Redis ping
  let redisPing = false;
  try {
    const res2 = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
    });
    const data = await res2.json();
    redisPing = data.result === 'PONG';
  } catch (e) {
    redisPing = false;
  }

  return res.status(200).json({ checks, redisPing, allGood: Object.values(checks).every(Boolean) && redisPing });
};
