const target = process.env.HEALTH_URL;

if (!target) {
  throw new Error('HEALTH_URL is required');
}

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 15000);

try {
  const response = await fetch(target, {
    method: 'GET',
    headers: { 'User-Agent': 'CodeMeet-KeepAlive/1.0' },
    signal: controller.signal,
  });

  const body = await response.text();
  console.log(JSON.stringify({
    target,
    status: response.status,
    ok: response.ok,
    body: body.slice(0, 500),
    checkedAt: new Date().toISOString(),
  }));

  if (!response.ok) process.exitCode = 1;
} finally {
  clearTimeout(timeout);
}
