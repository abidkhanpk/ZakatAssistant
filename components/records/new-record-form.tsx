'use client';

import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { defaultCategoryTemplates, type CategoryTemplate } from '@/lib/default-categories';

type Item = {
  description: string;
  amount: number;
};

type Category = {
  id: string;
  nameEn: string;
  nameUr: string;
  type: 'ASSET' | 'LIABILITY';
  items: Item[];
  collapsed: boolean;
};

function toCategory(template: CategoryTemplate, idx: number): Category {
  return {
    id: `cat-${idx}-${template.type}`,
    nameEn: template.nameEn,
    nameUr: template.nameUr,
    type: template.type,
    items: template.items.map((item) => ({ ...item })),
    collapsed: false
  };
}

function move<T>(arr: T[], from: number, to: number) {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function NewRecordForm({ locale, csrfToken }: { locale: string; csrfToken: string }) {
  const [mode, setMode] = useState<'WIZARD' | 'ADVANCED'>('WIZARD');
  const [wizardStep, setWizardStep] = useState(0);
  const [yearLabel, setYearLabel] = useState(String(new Date().getFullYear()));
  const [calendarType, setCalendarType] = useState<'ISLAMIC' | 'GREGORIAN'>('ISLAMIC');
  const [categories, setCategories] = useState<Category[]>(() => defaultCategoryTemplates.map(toCategory));

  const isUr = locale === 'ur';

  const categorySteps = useMemo(() => categories.map((category) => category.id), [categories]);
  const visibleCategories = useMemo(() => {
    if (mode === 'ADVANCED') return categories;
    const currentId = categorySteps[wizardStep];
    return categories.filter((category) => category.id === currentId);
  }, [categories, mode, categorySteps, wizardStep]);

  const totals = useMemo(() => {
    const totalAssets = categories.filter((c) => c.type === 'ASSET').flatMap((c) => c.items).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalDeductions = categories.filter((c) => c.type === 'LIABILITY').flatMap((c) => c.items).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const net = totalAssets - totalDeductions;
    const rate = calendarType === 'ISLAMIC' ? 0.025 : 0.0258;
    return { totalAssets, totalDeductions, net, rate, zakatPayable: Math.max(0, net) * rate };
  }, [categories, calendarType]);

  function addCategory(type: 'ASSET' | 'LIABILITY') {
    setCategories((prev) => [
      ...prev,
      {
        id: `cat-${Date.now()}`,
        nameEn: type === 'ASSET' ? 'Custom asset category' : 'Custom liability category',
        nameUr: type === 'ASSET' ? 'کسٹم اثاثہ زمرہ' : 'کسٹم واجبات زمرہ',
        type,
        items: [{ description: isUr ? 'رقم' : 'Amount', amount: 0 }],
        collapsed: false
      }
    ]);
  }

  function updateCategory(index: number, next: Partial<Category>) {
    setCategories((prev) => prev.map((category, i) => (i === index ? { ...category, ...next } : category)));
  }

  function addItem(categoryIndex: number) {
    setCategories((prev) =>
      prev.map((category, i) => (i === categoryIndex ? { ...category, items: [...category.items, { description: isUr ? 'رقم' : 'Amount', amount: 0 }] } : category))
    );
  }

  function updateItem(categoryIndex: number, itemIndex: number, next: Partial<Item>) {
    setCategories((prev) =>
      prev.map((category, i) =>
        i === categoryIndex
          ? { ...category, items: category.items.map((item, ii) => (ii === itemIndex ? { ...item, ...next } : item)) }
          : category
      )
    );
  }

  function removeCategory(categoryIndex: number) {
    setCategories((prev) => prev.filter((_, i) => i !== categoryIndex));
    setWizardStep(0);
  }

  function removeItem(categoryIndex: number, itemIndex: number) {
    setCategories((prev) =>
      prev.map((category, i) => {
        if (i !== categoryIndex) return category;
        const remaining = category.items.filter((_, ii) => ii !== itemIndex);
        return { ...category, items: remaining.length ? remaining : [{ description: isUr ? 'رقم' : 'Amount', amount: 0 }] };
      })
    );
  }

  function moveCategory(categoryIndex: number, direction: 'UP' | 'DOWN') {
    setCategories((prev) => {
      const to = direction === 'UP' ? categoryIndex - 1 : categoryIndex + 1;
      if (to < 0 || to >= prev.length) return prev;
      return move(prev, categoryIndex, to);
    });
  }

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} method="post" action="/api/records" className="space-y-4">
        <input type="hidden" name="csrfToken" value={csrfToken} />
        <input type="hidden" name="locale" value={locale} />
        <input
          type="hidden"
          name="payload"
          value={JSON.stringify({ locale, yearLabel, calendarType, categories: categories.map((category) => ({ nameEn: category.nameEn, nameUr: category.nameUr, type: category.type, items: category.items })) })}
        />

        <div className="card grid gap-3 md:grid-cols-4">
          <div><label className="text-sm font-medium">{isUr ? 'سال' : 'Year'}</label><input className="mt-1 w-full rounded border p-2" value={yearLabel} onChange={(e) => setYearLabel(e.target.value)} /></div>
          <div>
            <label className="text-sm font-medium">{isUr ? 'کیلنڈر' : 'Calendar'}</label>
            <select className="mt-1 w-full rounded border p-2" value={calendarType} onChange={(e) => setCalendarType(e.target.value as 'ISLAMIC' | 'GREGORIAN')}>
              <option value="ISLAMIC">{isUr ? 'اسلامی' : 'Islamic'}</option>
              <option value="GREGORIAN">{isUr ? 'گریگورین' : 'Gregorian'}</option>
            </select>
          </div>
          <div className="md:col-span-2 flex gap-2 items-end">
            <button type="button" className={`rounded border px-3 py-2 ${mode === 'WIZARD' ? 'bg-slate-900 text-white' : ''}`} onClick={() => setMode('WIZARD')}>{isUr ? 'وزرڈ' : 'Wizard'}</button>
            <button type="button" className={`rounded border px-3 py-2 ${mode === 'ADVANCED' ? 'bg-slate-900 text-white' : ''}`} onClick={() => setMode('ADVANCED')}>{isUr ? 'ایڈوانسڈ' : 'Advanced'}</button>
          </div>
        </div>

        <div className="card grid gap-2 text-sm md:grid-cols-5">
          <div><p className="text-slate-500">{isUr ? 'کل اثاثے' : 'Total Assets'}</p><p className="font-semibold">{totals.totalAssets.toFixed(2)}</p></div>
          <div><p className="text-slate-500">{isUr ? 'کل کٹوتیاں' : 'Total Deductions'}</p><p className="font-semibold">{totals.totalDeductions.toFixed(2)}</p></div>
          <div><p className="text-slate-500">{isUr ? 'خالص' : 'Net'}</p><p className="font-semibold">{totals.net.toFixed(2)}</p></div>
          <div><p className="text-slate-500">{isUr ? 'شرح' : 'Rate'}</p><p className="font-semibold">{(totals.rate * 100).toFixed(2)}%</p></div>
          <div><p className="text-slate-500">{isUr ? 'زکوٰۃ قابلِ ادا' : 'Zakat Payable'}</p><p className="font-semibold">{totals.zakatPayable.toFixed(2)}</p></div>
        </div>

        {mode === 'WIZARD' ? (
          <div className="card flex items-center justify-between">
            <button type="button" className="rounded border px-3 py-1" onClick={() => setWizardStep((s) => Math.max(0, s - 1))}>{isUr ? 'پچھلا' : 'Previous'}</button>
            <span>{isUr ? 'مرحلہ' : 'Step'} {wizardStep + 1} / {Math.max(categorySteps.length, 1)}</span>
            <button type="button" className="rounded border px-3 py-1" onClick={() => setWizardStep((s) => Math.min(categorySteps.length - 1, s + 1))}>{isUr ? 'اگلا' : 'Next'}</button>
          </div>
        ) : null}

        {visibleCategories.map((category) => {
          const categoryIndex = categories.findIndex((c) => c.id === category.id);
          return (
            <div key={category.id} className="card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">{isUr ? category.nameUr : category.nameEn} ({category.type})</div>
                <div className="flex gap-2">
                  <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => moveCategory(categoryIndex, 'UP')}>↑</button>
                  <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => moveCategory(categoryIndex, 'DOWN')}>↓</button>
                  <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => removeCategory(categoryIndex)}>{isUr ? 'حذف' : 'Remove'}</button>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <input className="w-full rounded border p-2" value={category.nameEn} onChange={(e) => updateCategory(categoryIndex, { nameEn: e.target.value || 'Category' })} placeholder={isUr ? 'زمرہ نام (انگریزی)' : 'Category name (EN)'} />
                <input className="w-full rounded border p-2" value={category.nameUr} onChange={(e) => updateCategory(categoryIndex, { nameUr: e.target.value || 'زمرہ' })} placeholder={isUr ? 'زمرہ نام (اردو)' : 'Category name (UR)'} dir={isUr ? 'rtl' : 'ltr'} />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-2">{isUr ? 'تفصیل' : 'Description'}</th>
                      <th className="p-2">{isUr ? 'رقم' : 'Amount'}</th>
                      <th className="p-2">{isUr ? 'عمل' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.items.map((item, itemIndex) => (
                      <tr key={`${category.id}-item-${itemIndex}`} className="border-b">
                        <td className="p-2"><input className="w-full rounded border p-2" value={item.description} onChange={(e) => updateItem(categoryIndex, itemIndex, { description: e.target.value })} placeholder={isUr ? 'تفصیل' : 'Description'} /></td>
                        <td className="p-2"><input type="number" step="0.01" className="w-full rounded border p-2" value={item.amount} onChange={(e) => updateItem(categoryIndex, itemIndex, { amount: Number(e.target.value || 0) })} placeholder={isUr ? 'رقم' : 'Amount'} /></td>
                        <td className="p-2"><button type="button" className="rounded border px-2" onClick={() => removeItem(categoryIndex, itemIndex)}>×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button type="button" className="rounded border px-3 py-2" onClick={() => addItem(categoryIndex)}>{isUr ? 'آئٹم شامل کریں' : 'Add item'}</button>
            </div>
          );
        })}

        <div className="sticky bottom-0 flex flex-wrap gap-2 bg-slate-50/95 py-3 backdrop-blur">
          <button type="button" className="rounded border px-3 py-2" onClick={() => addCategory('ASSET')}>{isUr ? 'اثاثہ زمرہ شامل کریں' : 'Add asset category'}</button>
          <button type="button" className="rounded border px-3 py-2" onClick={() => addCategory('LIABILITY')}>{isUr ? 'واجبات زمرہ شامل کریں' : 'Add liability category'}</button>
          <button className="rounded bg-brand px-4 py-2 text-white">{isUr ? 'ریکارڈ محفوظ کریں' : 'Save record'}</button>
        </div>
      </motion.form>
    </main>
  );
}
