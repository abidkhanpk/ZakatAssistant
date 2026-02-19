export function isSameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return true;

  try {
    const requestUrl = new URL(req.url);
    const originUrl = new URL(origin);
    return requestUrl.origin === originUrl.origin;
  } catch {
    return false;
  }
}

export function isAuthorizedCron(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;

  const auth = req.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const headerSecret = req.headers.get('x-cron-secret') || '';
  return expected === bearer || expected === headerSecret;
}
