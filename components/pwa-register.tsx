'use client';
import { useEffect, useState } from 'react';

export function PwaRegister() {
  const [deferred, setDeferred] = useState<any>(null);
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

      if (isLocalhost) {
        // Prevent stale chunk/cache issues during local dev.
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        });
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        });
      } else if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').then((reg) => reg.update());
        let reloaded = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (reloaded) return;
          reloaded = true;
          window.location.reload();
        });
      }
    }
    const handler = (e: any) => { e.preventDefault(); setDeferred(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  if (!deferred) return null;
  return <button className="fixed bottom-20 right-4 rounded-full bg-brand px-4 py-2 text-white" onClick={async () => { deferred.prompt(); await deferred.userChoice; setDeferred(null); }}>Install ZakatAssistant</button>;
}
