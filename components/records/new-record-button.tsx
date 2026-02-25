'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function NewRecordButton({
  locale,
  importHref,
  startFreshHref,
  hasPreviousRecord
}: {
  locale: string;
  importHref: string;
  startFreshHref: string;
  hasPreviousRecord: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'IMPORT' | 'FRESH' | null>(null);
  const isUr = locale === 'ur';

  function handleNewRecordClick() {
    if (!hasPreviousRecord) {
      router.push(startFreshHref);
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <button type="button" className="inline-block rounded bg-brand p-2 text-white" onClick={handleNewRecordClick}>
        {isUr ? 'نیا ریکارڈ' : 'New Record'}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">{isUr ? 'پچھلے سال کا ڈیٹا' : 'Import Previous Year Data'}</h3>
            <p className="mt-2 text-sm text-slate-600">
              {isUr
                ? 'کیا آپ موجودہ سال کے لیے پچھلے سال کا ڈیٹا امپورٹ کرنا چاہتے ہیں؟'
                : 'Would you like to import previous year data for the current year?'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded bg-brand px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={pendingAction !== null}
                onClick={() => {
                  setPendingAction('IMPORT');
                  setOpen(false);
                  router.push(importHref);
                }}
              >
                {pendingAction === 'IMPORT' ? (isUr ? 'کھل رہا ہے...' : 'Opening...') : isUr ? 'امپورٹ کریں' : 'Import'}
              </button>
              <button
                type="button"
                className="rounded border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={pendingAction !== null}
                onClick={() => {
                  setPendingAction('FRESH');
                  setOpen(false);
                  router.push(startFreshHref);
                }}
              >
                {pendingAction === 'FRESH' ? (isUr ? 'کھل رہا ہے...' : 'Opening...') : isUr ? 'نیا شروع کریں' : 'Start fresh'}
              </button>
              <button type="button" className="rounded border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60" disabled={pendingAction !== null} onClick={() => setOpen(false)}>
                {isUr ? 'منسوخ' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
