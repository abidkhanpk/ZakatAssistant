'use client';
import { useEffect, useState } from 'react';

export function PwaRegister() {
  const [deferred, setDeferred] = useState<any>(null);
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
    const handler = (e: any) => { e.preventDefault(); setDeferred(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  if (!deferred) return null;
  return <button className="fixed bottom-20 right-4 rounded-full bg-brand px-4 py-2 text-white" onClick={async () => { deferred.prompt(); await deferred.userChoice; setDeferred(null); }}>Install ZakatAssistant</button>;
}
