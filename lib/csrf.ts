function parseCookie(headerValue: string | null, key: string) {
  if (!headerValue) return '';

  const target = `${key}=`;
  for (const chunk of headerValue.split(';')) {
    const part = chunk.trim();
    if (part.startsWith(target)) {
      return decodeURIComponent(part.slice(target.length));
    }
  }

  return '';
}

export function hasValidCsrfToken(req: Request, formData: FormData) {
  const cookieToken = parseCookie(req.headers.get('cookie'), 'csrf_token');
  const bodyToken = String(formData.get('csrfToken') || '');
  return Boolean(cookieToken) && cookieToken === bodyToken;
}
