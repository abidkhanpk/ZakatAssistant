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
  const [yearLabel, setYearLabel] = useState(String(new Date().getFullYear()));
  const [calendarType, setCalendarType] = useState<'ISLAMIC' | 'GREGORIAN'>('ISLAMIC');
  const [categories, setCategories] = useState<Category[]>(() => defaultCategoryTemplates.map(toCategory));

  const isUr = locale === 'ur';

  const visibleCategories = useMemo(() => categories, [categories]);

  const totals = useMemo(() => {
    const totalAssets = categories
      .filter((c) => c.type === 'ASSET')
      .flatMap((c) => c.items)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalDeductions = categories
      .filter((c) => c.type === 'LIABILITY')
      .flatMap((c) => c.items)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const net = totalAssets - totalDeductions;
    const rate = calendarType === 'ISLAMIC' ? 0.025 : 0.0258;
    return {
      totalAssets,
      totalDeductions,
      net,
      rate,
      zakatPayable: Math.max(0, net) * rate
    };
  }, [categories, calendarType]);

  function addCategory(type: 'ASSET' | 'LIABILITY') {
    setCategories((prev) => [
      ...prev,
      {
        id: `cat-${Date.now()}`,
        nameEn: type === 'ASSET' ? 'Custom asset category' : 'Custom liability category',
        nameUr: type === 'ASSET' ? 'کسٹم اثاثہ زمرہ' : 'کسٹم واجبات زمرہ',
        type,
        items: [{ description: 'Amount', amount: 0 }],
        collapsed: false
      }
    ]);
  }

  function updateCategory(index: number, next: Partial<Category>) {
    setCategories((prev) => prev.map((category, i) => (i === index ? { ...category, ...next } : category)));
  }

  function addItem(categoryIndex: number) {
    setCategories((prev) =>
      prev.map((category, i) =>
        i === categoryIndex
          ? { ...category, items: [...category.items, { description: 'Amount', amount: 0 }] }
          : category
      )
    );
  }

  function updateItem(categoryIndex: number, itemIndex: number, next: Partial<Item>) {
    setCategories((prev) =>
      prev.map((category, i) =>
        i === categoryIndex
          ? {
              ...category,
              items: category.items.map((item, ii) => (ii === itemIndex ? { ...item, ...next } : item))
            }
          : category
      )
    );
  }

  function removeCategory(categoryIndex: number) {
    setCategories((prev) => prev.filter((_, i) => i !== categoryIndex));
  }

  function removeItem(categoryIndex: number, itemIndex: number) {
    setCategories((prev) =>
      prev.map((category, i) => {
        if (i !== categoryIndex) return category;
        const remaining = category.items.filter((_, ii) => ii !== itemIndex);
        return { ...category, items: remaining.length ? remaining : [{ description: 'Amount', amount: 0 }] };
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

  function moveItem(categoryIndex: number, itemIndex: number, direction: 'UP' | 'DOWN') {
    setCategories((prev) =>
      prev.map((category, i) => {
        if (i !== categoryIndex) return category;
        const to = direction === 'UP' ? itemIndex - 1 : itemIndex + 1;
        if (to < 0 || to >= category.items.length) return category;
        return { ...category, items: move(category.items, itemIndex, to) };
      })
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-4 space-y-4">
      <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} method="post" action="/api/records" className="space-y-4">
        <input type="hidden" name="csrfToken" value={csrfToken} />
        <input type="hidden" name="locale" value={locale} />
        <input
          type="hidden"
          name="payload"
          value={JSON.stringify({
            locale,
            yearLabel,
            calendarType,
            categories: categories.map((category) => ({
              nameEn: category.nameEn,
              nameUr: category.nameUr,
              type: category.type,
              items: category.items
            }))
          })}
        />

        <div className="card grid gap-3 md:grid-cols-4">
          <div className="md:col-span-1">
            <label className="text-sm font-medium">Year</label>
            <input className="mt-1 w-full rounded border p-2" value={yearLabel} onChange={(e) => setYearLabel(e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <label className="text-sm font-medium">Calendar</label>
            <select className="mt-1 w-full rounded border p-2" value={calendarType} onChange={(e) => setCalendarType(e.target.value as 'ISLAMIC' | 'GREGORIAN')}>
              <option value="ISLAMIC">Islamic (2.5%)</option>
              <option value="GREGORIAN">Gregorian (2.58%)</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-end gap-2">
            <button
              type="button"
              className={`rounded border px-3 py-2 ${mode === 'WIZARD' ? 'bg-slate-900 text-white' : ''}`}
              onClick={() => setMode('WIZARD')}
            >
              Wizard
            </button>
            <button
              type="button"
              className={`rounded border px-3 py-2 ${mode === 'ADVANCED' ? 'bg-slate-900 text-white' : ''}`}
              onClick={() => setMode('ADVANCED')}
            >
              Advanced
            </button>
          </div>
        </div>

        <div className="card grid gap-2 text-sm md:grid-cols-5">
          <div><p className="text-slate-500">Total Assets</p><p className="font-semibold">{totals.totalAssets.toFixed(2)}</p></div>
          <div><p className="text-slate-500">Total Deductions</p><p className="font-semibold">{totals.totalDeductions.toFixed(2)}</p></div>
          <div><p className="text-slate-500">Net</p><p className="font-semibold">{totals.net.toFixed(2)}</p></div>
          <div><p className="text-slate-500">Rate</p><p className="font-semibold">{(totals.rate * 100).toFixed(2)}%</p></div>
          <div><p className="text-slate-500">Zakat Payable</p><p className="font-semibold">{totals.zakatPayable.toFixed(2)}</p></div>
        </div>

        {visibleCategories.map((category) => {
          const categoryIndex = categories.findIndex((c) => c.id === category.id);
          const subtotal = category.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

          return (
            <div key={category.id} className="card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium">{category.type}</span>
                  <span className="text-sm text-slate-500">Subtotal: {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => updateCategory(categoryIndex, { collapsed: !category.collapsed })}>
                    {category.collapsed ? 'Expand' : 'Collapse'}
                  </button>
                  <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => moveCategory(categoryIndex, 'UP')}>Up</button>
                  <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => moveCategory(categoryIndex, 'DOWN')}>Down</button>
                  <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => removeCategory(categoryIndex)}>Remove</button>
                </div>
              </div>

              {!category.collapsed && (
                <>
                  <div className="grid gap-2 md:grid-cols-2">
                    <input
                      className="w-full rounded border p-2"
                      value={category.nameEn}
                      onChange={(e) => updateCategory(categoryIndex, { nameEn: e.target.value || 'Category' })}
                      placeholder="Category name (EN)"
                    />
                    <input
                      className="w-full rounded border p-2"
                      value={category.nameUr}
                      onChange={(e) => updateCategory(categoryIndex, { nameUr: e.target.value || 'زمرہ' })}
                      placeholder="Category name (UR)"
                      dir={isUr ? 'rtl' : 'ltr'}
                    />
                  </div>

                  <div className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <div key={`${category.id}-item-${itemIndex}`} className="grid grid-cols-1 gap-2 md:grid-cols-8">
                        <input
                          className="rounded border p-2 md:col-span-5"
                          value={item.description}
                          onChange={(e) => updateItem(categoryIndex, itemIndex, { description: e.target.value })}
                          placeholder="Description"
                        />
                        <input
                          type="number"
                          step="0.01"
                          className="rounded border p-2 md:col-span-2"
                          value={item.amount}
                          onChange={(e) => updateItem(categoryIndex, itemIndex, { amount: Number(e.target.value || 0) })}
                          placeholder="Amount"
                        />
                        <div className="flex gap-1 md:col-span-1">
                          <button type="button" className="rounded border px-2" onClick={() => moveItem(categoryIndex, itemIndex, 'UP')}>↑</button>
                          <button type="button" className="rounded border px-2" onClick={() => moveItem(categoryIndex, itemIndex, 'DOWN')}>↓</button>
                          <button type="button" className="rounded border px-2" onClick={() => removeItem(categoryIndex, itemIndex)}>×</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button type="button" className="rounded border px-3 py-2" onClick={() => addItem(categoryIndex)}>
                    Add item
                  </button>
                </>
              )}
            </div>
          );
        })}

        <div className="sticky bottom-0 flex flex-wrap gap-2 bg-slate-50/95 py-3 backdrop-blur">
          <button type="button" className="rounded border px-3 py-2" onClick={() => addCategory('ASSET')}>Add asset category</button>
          <button type="button" className="rounded border px-3 py-2" onClick={() => addCategory('LIABILITY')}>Add liability category</button>
          <button className="rounded bg-brand px-4 py-2 text-white">Save record</button>
        </div>
      </motion.form>
    </main>
  );
}
