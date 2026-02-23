'use client';

import { useEffect } from 'react';

export function LoginErrorShake() {
  useEffect(() => {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.classList.add('animate-login-shake');
    const handleAnimationEnd = () => {
      form.classList.remove('animate-login-shake');
      form.removeEventListener('animationend', handleAnimationEnd);
    };

    form.addEventListener('animationend', handleAnimationEnd);
    return () => form.removeEventListener('animationend', handleAnimationEnd);
  }, []);

  return null;
}
