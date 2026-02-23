'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';

type LoginFormProps = {
  locale: string;
  csrfToken: string;
  initialError: boolean;
};

type LoginJsonResponse = {
  ok?: boolean;
  redirectTo?: string;
  error?: string;
};

export function LoginForm({ locale, csrfToken, initialError }: LoginFormProps) {
  const router = useRouter();
  const isUr = locale === 'ur';
  const formRef = useRef<HTMLFormElement | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasError, setHasError] = useState(initialError);

  const errorText = isUr ? 'غلط یوزرنیم یا پاس ورڈ۔' : 'Wrong username or password.';

  function triggerShake() {
    if (!formRef.current) return;
    formRef.current.classList.remove('animate-login-shake');
    void formRef.current.offsetWidth;
    formRef.current.classList.add('animate-login-shake');
  }

  useEffect(() => {
    if (!initialError) return;
    triggerShake();
  }, [initialError]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setHasError(false);

    const body = new FormData();
    body.set('csrfToken', csrfToken);
    body.set('locale', locale);
    body.set('identifier', identifier);
    body.set('password', password);
    body.set('responseType', 'json');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body
      });

      const payload: LoginJsonResponse = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok !== true) {
        setHasError(true);
        triggerShake();
        setSubmitting(false);
        return;
      }

      router.replace(payload.redirectTo || `/${locale}/app`);
      router.refresh();
    } catch {
      setHasError(true);
      triggerShake();
      setSubmitting(false);
    }
  }

  return (
    <form
      id="login-form"
      ref={formRef}
      className={`card mx-auto max-w-md space-y-3 ${hasError ? 'border-red-300' : ''}`}
      onSubmit={onSubmit}
      data-skip-submit-pending="true"
    >
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="locale" value={locale} />
      <h1 className="text-2xl font-semibold text-center">{isUr ? 'زکوٰۃ اسسٹنٹ لاگ اِن' : 'Login'}</h1>
      {hasError ? <p className="text-sm text-red-600">{errorText}</p> : null}
      <input
        className="w-full rounded border p-2"
        name="identifier"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder={isUr ? 'ای میل یا یوزر آئی ڈی' : 'Email or User ID'}
        required
      />
      <input
        className="w-full rounded border p-2"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={isUr ? 'پاس ورڈ' : 'Password'}
        required
      />
      <button className="w-full rounded bg-brand p-2 text-white disabled:opacity-60" disabled={submitting}>
        {submitting ? (isUr ? 'پروسیسنگ...' : 'Processing...') : isUr ? 'لاگ اِن' : 'Login'}
      </button>
      <Link className="block text-sm text-brand" href={`/${locale}/forgot-password`}>
        {isUr ? 'پاس ورڈ بھول گئے؟' : 'Forgot password?'}
      </Link>
      <Link className="block text-sm text-brand" href={`/${locale}/signup`}>
        {isUr ? 'نیا اکاؤنٹ بنائیں' : 'Create account'}
      </Link>
    </form>
  );
}
