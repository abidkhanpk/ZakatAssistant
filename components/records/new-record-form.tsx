'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo, useState, type WheelEvent } from 'react';
import {
  defaultCategoryTemplates,
  findTemplateCategoryByNames,
  findTemplateItemByDescription,
  getTemplateItem,
  type CategoryTemplate
} from '@/lib/default-categories';
import { useRouter } from 'next/navigation';

type Item = {
  stableId: string;
  description: string;
  amount: number;
};

type InitialItem = {
  stableId?: string;
  description: string;
  amount: number;
};

type Category = {
  id: string;
  stableId: string;
  nameEn: string;
  nameUr: string;
  type: 'ASSET' | 'LIABILITY';
  items: Item[];
  collapsed: boolean;
  isCustom: boolean;
};

export type RecordFormInitialData = {
  recordId?: string;
  yearLabel: string;
  calendarType: 'ISLAMIC' | 'GREGORIAN';
  categories: {
    stableId?: string;
    nameEn: string;
    nameUr: string;
    type: 'ASSET' | 'LIABILITY';
    items: InitialItem[];
  }[];
};

function localizeDefaultDescription(description: string, isUr: boolean) {
  if (description === 'Amount') return isUr ? 'تفصیل' : 'Description';
  if (description === 'Other') return isUr ? 'دیگر' : 'Other';
  if (description === 'Cash') return isUr ? 'نقدی' : 'Cash';
  if (description === 'Gold') return isUr ? 'سونا' : 'Gold';
  if (description === 'Silver') return isUr ? 'چاندی' : 'Silver';
  if (description === 'Other precious items') return isUr ? 'دیگر قیمتی اشیاء' : 'Other precious items';
  if (description === 'Foreign currency') return isUr ? 'غیر ملکی کرنسی' : 'Foreign currency';
  if (description === 'Prize bonds') return isUr ? 'پرائز بانڈز' : 'Prize bonds';
  if (description === 'Insurance premium') return isUr ? 'انشورنس پریمیم' : 'Insurance premium';
  if (description === 'Hajj deposit') return isUr ? 'حج ڈپازٹ' : 'Hajj deposit';
  if (description === 'Savings certificates') return isUr ? 'سیونگ سرٹیفکیٹس' : 'Savings certificates';
  if (description === 'Provident fund') return isUr ? 'پراویڈنٹ فنڈ' : 'Provident fund';
  if (description === 'Raw materials') return isUr ? 'خام مال' : 'Raw materials';
  if (description === 'Goods sold receivable') return isUr ? 'فروخت شدہ مال کی قابل وصول رقم' : 'Goods sold receivable';
  if (description === 'LC margin deposit') return isUr ? 'ایل سی مارجن ڈپازٹ' : 'LC margin deposit';
  if (description === 'Payment to banks for goods') return isUr ? 'سامان کے لیے بینک کو ادائیگی' : 'Payment to banks for goods';
  if (description === 'Investment as partner') return isUr ? 'بطور پارٹنر سرمایہ کاری' : 'Investment as partner';
  if (description === 'Salaries payable') return isUr ? 'واجب الادا تنخواہیں' : 'Salaries payable';
  if (description === 'Goods bought on credit') return isUr ? 'ادھار خریدا گیا سامان' : 'Goods bought on credit';
  if (description === 'Utility bills payable') return isUr ? 'واجب الادا یوٹیلیٹی بلز' : 'Utility bills payable';
  if (description === 'Taxes payable') return isUr ? 'واجب الادا ٹیکس' : 'Taxes payable';
  if (description === 'Rent payable') return isUr ? 'واجب الادا کرایہ' : 'Rent payable';
  if (description === 'Mehar payable') return isUr ? 'مہر قابل ادائیگی' : 'Mehar payable';
  if (description === 'Other liabilities') return isUr ? 'دیگر واجبات' : 'Other liabilities';
  return description;
}

function normalizeDescription(value: string) {
  return value.trim().toLowerCase();
}

function resolveTemplateCategoryKey(category: {
  stableId?: string;
  nameEn: string;
  nameUr: string;
  type: 'ASSET' | 'LIABILITY';
}) {
  if (category.stableId && defaultCategoryTemplates.some((template) => template.key === category.stableId)) {
    return category.stableId;
  }
  return findTemplateCategoryByNames(category.type, category.nameEn, category.nameUr)?.key;
}

function localizeSeededItemDescription(
  item: { stableId?: string; description: string },
  category: { stableId?: string; nameEn: string; nameUr: string; type: 'ASSET' | 'LIABILITY' },
  isUr: boolean
) {
  const templateItem =
    (item.stableId ? getTemplateItem(item.stableId)?.item : undefined) ||
    (() => {
      const templateCategoryKey = resolveTemplateCategoryKey(category);
      if (!templateCategoryKey) return undefined;
      return findTemplateItemByDescription(templateCategoryKey, item.description);
    })();
  if (!templateItem) return item.description;

  const candidates = new Set(
    [templateItem.description, ...(templateItem.legacyDescriptions || []), localizeDefaultDescription(templateItem.description, false), localizeDefaultDescription(templateItem.description, true)].map(
      normalizeDescription
    )
  );

  if (!candidates.has(normalizeDescription(item.description))) return item.description;
  return localizeDefaultDescription(templateItem.description, isUr);
}

function toCategory(template: CategoryTemplate, idx: number, isUr: boolean): Category {
  return {
    id: `cat-${idx}-${template.type}`,
    stableId: template.key,
    nameEn: template.nameEn,
    nameUr: template.nameUr,
    type: template.type,
    items: template.items.map((item) => ({
      stableId: item.key,
      description: localizeDefaultDescription(item.description, isUr),
      amount: item.amount
    })),
    collapsed: false,
    isCustom: false
  };
}

function isCustomCategoryName(nameEn: string, nameUr: string) {
  return nameEn.toLowerCase().startsWith('custom ') || nameUr.includes('کسٹم');
}

function move<T>(arr: T[], from: number, to: number) {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function createCustomStableId(prefix: 'cat' | 'item') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `custom-${prefix}-${crypto.randomUUID()}`;
  }
  return `custom-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function NewRecordForm({
  locale,
  currentUserId,
  csrfToken,
  initialData,
  formAction,
  submitLabel,
  promptImportFromId
}: {
  locale: string;
  currentUserId: string;
  csrfToken: string;
  initialData?: RecordFormInitialData;
  formAction?: string;
  submitLabel?: string;
  promptImportFromId?: string;
}) {
  const router = useRouter();
  const isUr = locale === 'ur';
  const [showImportPrompt, setShowImportPrompt] = useState(Boolean(promptImportFromId));
  const [mode, setMode] = useState<'WIZARD' | 'ADVANCED'>('WIZARD');
  const [wizardStep, setWizardStep] = useState(0);
  const [showClosePrompt, setShowClosePrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [yearLabel, setYearLabel] = useState(initialData?.yearLabel || String(new Date().getFullYear()));
  const [calendarType, setCalendarType] = useState<'ISLAMIC' | 'GREGORIAN'>(initialData?.calendarType || 'ISLAMIC');
  const [saveWhenChangingSection, setSaveWhenChangingSection] = useState(true);
  const [categories, setCategories] = useState<Category[]>(() => {
    if (initialData?.categories?.length) {
      return initialData.categories.map((category, idx) => ({
        id: `cat-${idx}-${category.type}`,
        stableId: category.stableId || createCustomStableId('cat'),
        nameEn: category.nameEn,
        nameUr: category.nameUr,
        type: category.type,
        items: category.items.map((item) => {
          const stableId = item.stableId || createCustomStableId('item');
          return {
            ...item,
            stableId,
            description: localizeSeededItemDescription(item, category, isUr)
          };
        }),
        collapsed: false,
        isCustom: isCustomCategoryName(category.nameEn, category.nameUr)
      }));
    }
    return defaultCategoryTemplates.map((template, idx) => toCategory(template, idx, isUr));
  });

  const categorySteps = useMemo(() => categories.map((category) => category.id), [categories]);
  const yearOptions = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const options = Array.from({ length: 16 }, (_, index) => String(thisYear - index));
    if (yearLabel && !options.includes(yearLabel)) {
      options.push(yearLabel);
    }
    return options.sort((a, b) => {
      const aNum = Number(a);
      const bNum = Number(b);
      if (Number.isFinite(aNum) && Number.isFinite(bNum)) return bNum - aNum;
      return b.localeCompare(a);
    });
  }, [yearLabel]);
  const visibleCategories = useMemo(() => {
    if (mode === 'ADVANCED') return categories;
    const currentId = categorySteps[wizardStep];
    return categories.filter((category) => category.id === currentId);
  }, [categories, mode, categorySteps, wizardStep]);
  const isEditMode = Boolean(initialData?.recordId && formAction);
  const savePreferenceKey = `za-save-on-section-change:${currentUserId}`;
  const payloadJson = JSON.stringify({
    locale,
    yearLabel,
    calendarType,
    categories: categories.map((category) => ({
      stableId: category.stableId,
      nameEn: category.nameEn,
      nameUr: category.nameUr,
      type: category.type,
      items: category.items.map((item) => ({ stableId: item.stableId, description: item.description, amount: item.amount }))
    }))
  });
  const [lastSavedPayloadJson, setLastSavedPayloadJson] = useState(payloadJson);
  const hasUnsavedChanges = payloadJson !== lastSavedPayloadJson;

  const totals = useMemo(() => {
    const totalAssets = categories.filter((c) => c.type === 'ASSET').flatMap((c) => c.items).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalDeductions = categories.filter((c) => c.type === 'LIABILITY').flatMap((c) => c.items).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const net = totalAssets - totalDeductions;
    const rate = calendarType === 'ISLAMIC' ? 0.025 : 0.0258;
    return { totalAssets, totalDeductions, net, rate, zakatPayable: Math.max(0, net) * rate };
  }, [categories, calendarType]);

  function addCategory(type: 'ASSET' | 'LIABILITY') {
    setCategories((prev) => {
      const next = [
        ...prev,
        {
          id: `cat-${Date.now()}`,
          stableId: createCustomStableId('cat'),
          nameEn: type === 'ASSET' ? 'Custom asset category' : 'Custom liability category',
          nameUr: type === 'ASSET' ? 'کسٹم اثاثہ زمرہ' : 'کسٹم واجبات زمرہ',
          type,
          items: [{ stableId: createCustomStableId('item'), description: isUr ? 'تفصیل' : 'Description', amount: 0 }],
          collapsed: false,
          isCustom: true
        }
      ];
      if (mode === 'WIZARD') {
        setWizardStep(next.length - 1);
      }
      return next;
    });
  }

  function addItem(categoryIndex: number) {
    setCategories((prev) =>
      prev.map((category, i) =>
        i === categoryIndex
          ? { ...category, items: [...category.items, { stableId: createCustomStableId('item'), description: isUr ? 'تفصیل' : 'Description', amount: 0 }] }
          : category
      )
    );
  }

  function updateCategoryTitle(categoryIndex: number, value: string) {
    setCategories((prev) =>
      prev.map((category, i) => {
        if (i !== categoryIndex) return category;
        return isUr ? { ...category, nameUr: value || 'زمرہ' } : { ...category, nameEn: value || 'Category' };
      })
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
        return {
          ...category,
          items: remaining.length ? remaining : [{ stableId: createCustomStableId('item'), description: isUr ? 'تفصیل' : 'Description', amount: 0 }]
        };
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

  function typeLabel(type: 'ASSET' | 'LIABILITY') {
    if (type === 'ASSET') return isUr ? 'اثاثہ' : 'Asset';
    return isUr ? 'واجبات' : 'Liability';
  }

  async function persistRecord(stayOnPage: boolean) {
    if (!isEditMode || !formAction || isSaving) return false;
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const body = new FormData();
      body.set('csrfToken', csrfToken);
      body.set('locale', locale);
      body.set('intent', stayOnPage ? 'save' : 'update');
      body.set('payload', payloadJson);

      const response = await fetch(formAction, { method: 'POST', body });
      if (!response.ok) throw new Error(`Save failed (${response.status})`);

      if (stayOnPage) {
        setLastSavedPayloadJson(payloadJson);
        setSaveFeedback(isUr ? 'تبدیلیاں محفوظ ہو گئیں۔' : 'Changes saved.');
      }
      return true;
    } catch {
      setSaveFeedback(isUr ? 'محفوظ نہیں ہو سکا، دوبارہ کوشش کریں۔' : 'Could not save. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleManualSave() {
    await persistRecord(true);
  }

  async function handleCloseAction() {
    if (!isEditMode || !initialData?.recordId) return;
    if (!hasUnsavedChanges) {
      router.push(`/${locale}/app/records/${initialData.recordId}?year=${encodeURIComponent(yearLabel)}`);
      return;
    }
    setShowClosePrompt(true);
  }

  async function handleSaveAndClose() {
    if (!isEditMode || !initialData?.recordId) return;
    const ok = await persistRecord(true);
    if (!ok) return;
    setShowClosePrompt(false);
    router.push(`/${locale}/app/records/${initialData.recordId}?year=${encodeURIComponent(yearLabel)}`);
  }

  function handleDiscardAndClose() {
    if (!isEditMode || !initialData?.recordId) return;
    setShowClosePrompt(false);
    router.push(`/${locale}/app/records/${initialData.recordId}?year=${encodeURIComponent(yearLabel)}`);
  }

  async function handleStepNavigation(direction: 'PREV' | 'NEXT') {
    const nextStep = direction === 'PREV' ? Math.max(0, wizardStep - 1) : Math.min(categorySteps.length - 1, wizardStep + 1);
    if (nextStep === wizardStep) return;

    if (saveWhenChangingSection && isEditMode && hasUnsavedChanges) {
      const ok = await persistRecord(true);
      if (!ok) return;
    }
    setWizardStep(nextStep);
  }

  function preventWheelChange(e: WheelEvent<HTMLInputElement>) {
    e.preventDefault();
    e.currentTarget.blur();
  }

  useEffect(() => {
    if (!isEditMode) return;
    try {
      const saved = localStorage.getItem(savePreferenceKey);
      if (saved === '0') setSaveWhenChangingSection(false);
      if (saved === '1') setSaveWhenChangingSection(true);
    } catch {
      // ignore storage access issues
    }
  }, [isEditMode, savePreferenceKey]);

  useEffect(() => {
    if (!isEditMode) return;
    try {
      localStorage.setItem(savePreferenceKey, saveWhenChangingSection ? '1' : '0');
    } catch {
      // ignore storage access issues
    }
  }, [isEditMode, savePreferenceKey, saveWhenChangingSection]);

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      {showImportPrompt ? (
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
                className="rounded bg-brand px-3 py-2 text-white"
                onClick={() => router.replace(`/${locale}/app/records/new?importFrom=${promptImportFromId}`)}
              >
                {isUr ? 'امپورٹ کریں' : 'Import'}
              </button>
              <button className="rounded border px-3 py-2" onClick={() => setShowImportPrompt(false)}>
                {isUr ? 'نیا شروع کریں' : 'Start fresh'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {showClosePrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">{isUr ? 'تبدیلیاں محفوظ کریں؟' : 'Save changes?'}</h3>
            <p className="mt-2 text-sm text-slate-600">
              {isUr ? 'آپ کے پاس غیر محفوظ تبدیلیاں ہیں۔' : 'You have unsaved changes.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded bg-brand px-3 py-2 text-white disabled:opacity-60" onClick={handleSaveAndClose} disabled={isSaving}>
                {isUr ? 'محفوظ کریں اور بند کریں' : 'Save and close'}
              </button>
              <button className="rounded border px-3 py-2" onClick={handleDiscardAndClose}>
                {isUr ? 'تبدیلیاں چھوڑیں' : 'Discard'}
              </button>
              <button className="rounded border px-3 py-2" onClick={() => setShowClosePrompt(false)}>
                {isUr ? 'منسوخ' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} method="post" action={formAction || '/api/records'} className="space-y-4">
        <input type="hidden" name="csrfToken" value={csrfToken} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="payload" value={payloadJson} />

        <div className="card grid gap-3 md:grid-cols-4">
          <div>
            <label className="text-sm font-medium">{isUr ? 'سال' : 'Year'}</label>
            <select className="mt-1 w-full rounded border p-2" value={yearLabel} onChange={(e) => setYearLabel(e.target.value)}>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
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
        {saveFeedback ? (
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{saveFeedback}</div>
        ) : null}

        {mode === 'WIZARD' ? (
          <div className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 shadow-sm">
            <div className="grid grid-cols-2 items-center gap-3 md:grid-cols-3">
              <button
                type="button"
                className="justify-self-start rounded border border-brand/40 bg-white px-3 py-1 font-medium text-brand hover:bg-brand/5 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => handleStepNavigation('PREV')}
                disabled={isSaving}
              >
                {isUr ? 'پچھلا' : 'Previous'}
              </button>
              <span className="justify-self-center font-semibold text-brand md:col-start-2">{isUr ? 'مرحلہ' : 'Step'} {wizardStep + 1} / {Math.max(categorySteps.length, 1)}</span>
              <div className="col-span-2 flex items-center justify-end gap-3 md:col-span-1">
                {isEditMode ? (
                  <label className="flex items-center gap-2 text-xs text-slate-700 md:text-sm">
                    <span>{isUr ? 'سیکشن تبدیل کرتے وقت محفوظ کریں' : 'Save when changing section'}</span>
                    <input
                      type="checkbox"
                      checked={saveWhenChangingSection}
                      onChange={(e) => setSaveWhenChangingSection(e.target.checked)}
                    />
                  </label>
                ) : null}
                <button
                  type="button"
                  className="rounded border border-brand/40 bg-white px-3 py-1 font-medium text-brand hover:bg-brand/5 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => handleStepNavigation('NEXT')}
                  disabled={isSaving}
                >
                  {isUr ? 'اگلا' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {mode === 'ADVANCED' ? (
          <div className="card overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">{isUr ? 'قسم' : 'Type'}</th>
                  <th className="p-2">{isUr ? 'زمرہ' : 'Category'}</th>
                  <th className="p-2">{isUr ? 'تفصیل' : 'Description'}</th>
                  <th className="p-2">{isUr ? 'رقم' : 'Amount'}</th>
                  <th className="p-2">{isUr ? 'عمل' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td className="p-2 text-slate-500" colSpan={5}>{isUr ? 'کوئی زمرہ موجود نہیں' : 'No categories yet'}</td>
                  </tr>
                ) : null}
                {categories.map((category, categoryIndex) =>
                  category.items.map((item, itemIndex) => (
                    <tr key={`${category.id}-item-${itemIndex}`} className="border-b align-top">
                      <td className="p-2">{typeLabel(category.type)}</td>
                      <td className="p-2">
                        {category.isCustom ? (
                          <input
                            className="w-full rounded border p-2"
                            value={isUr ? category.nameUr : category.nameEn}
                            onChange={(e) => updateCategoryTitle(categoryIndex, e.target.value)}
                            placeholder={isUr ? 'زمرہ عنوان' : 'Category title'}
                            dir={isUr ? 'rtl' : 'ltr'}
                          />
                        ) : (
                          isUr ? category.nameUr : category.nameEn
                        )}
                      </td>
                      <td className="p-2">
                        <input
                          className="w-full rounded border p-2"
                          value={item.description}
                          onChange={(e) => updateItem(categoryIndex, itemIndex, { description: e.target.value })}
                          placeholder={isUr ? 'تفصیل' : 'Description'}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full rounded border p-2"
                          value={item.amount}
                          onWheel={preventWheelChange}
                          onChange={(e) => updateItem(categoryIndex, itemIndex, { amount: Number(e.target.value || 0) })}
                          placeholder={isUr ? 'رقم' : 'Amount'}
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded border px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => moveItem(categoryIndex, itemIndex, 'UP')}
                            disabled={itemIndex === 0}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="rounded border px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => moveItem(categoryIndex, itemIndex, 'DOWN')}
                            disabled={itemIndex === category.items.length - 1}
                          >
                            ↓
                          </button>
                          <button type="button" className="rounded border px-2 py-1" onClick={() => removeItem(categoryIndex, itemIndex)}>
                            {isUr ? 'آئٹم حذف' : 'Remove item'}
                          </button>
                          {itemIndex === 0 ? (
                            <>
                              <button type="button" className="rounded border px-2 py-1" onClick={() => addItem(categoryIndex)}>
                                {isUr ? 'آئٹم شامل کریں' : 'Add item'}
                              </button>
                              <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => moveCategory(categoryIndex, 'UP')}>↑</button>
                              <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => moveCategory(categoryIndex, 'DOWN')}>↓</button>
                              <button type="button" className="rounded border px-2 py-1" onClick={() => removeCategory(categoryIndex)}>
                                {isUr ? 'زمرہ حذف' : 'Remove category'}
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {mode === 'WIZARD' ? visibleCategories.map((category) => {
          const categoryIndex = categories.findIndex((c) => c.id === category.id);
          return (
            <div key={category.id} className="card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">{isUr ? category.nameUr : category.nameEn} ({typeLabel(category.type)})</div>
                <div className="flex gap-2">
                  <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => moveCategory(categoryIndex, 'UP')}>↑</button>
                  <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => moveCategory(categoryIndex, 'DOWN')}>↓</button>
                  <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => removeCategory(categoryIndex)}>{isUr ? 'حذف' : 'Remove'}</button>
                </div>
              </div>
              {category.isCustom ? (
                <div>
                  <input
                    className="w-full rounded border p-2"
                    value={isUr ? category.nameUr : category.nameEn}
                    onChange={(e) => updateCategoryTitle(categoryIndex, e.target.value)}
                    placeholder={isUr ? 'زمرہ عنوان' : 'Category title'}
                    dir={isUr ? 'rtl' : 'ltr'}
                  />
                </div>
              ) : null}
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
                        <td className="p-2"><input type="number" step="0.01" className="w-full rounded border p-2" value={item.amount} onWheel={preventWheelChange} onChange={(e) => updateItem(categoryIndex, itemIndex, { amount: Number(e.target.value || 0) })} placeholder={isUr ? 'رقم' : 'Amount'} /></td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded border px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => moveItem(categoryIndex, itemIndex, 'UP')}
                              disabled={itemIndex === 0}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="rounded border px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => moveItem(categoryIndex, itemIndex, 'DOWN')}
                              disabled={itemIndex === category.items.length - 1}
                            >
                              ↓
                            </button>
                            <button type="button" className="rounded border px-2" onClick={() => removeItem(categoryIndex, itemIndex)}>×</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button type="button" className="rounded border px-3 py-2" onClick={() => addItem(categoryIndex)}>{isUr ? 'آئٹم شامل کریں' : 'Add item'}</button>
            </div>
          );
        }) : null}

        <div className="sticky bottom-0 flex flex-wrap gap-2 bg-slate-50/95 py-3 backdrop-blur">
          <button type="button" className="rounded border px-3 py-2" onClick={() => addCategory('ASSET')}>{isUr ? 'اثاثہ زمرہ شامل کریں' : 'Add asset category'}</button>
          <button type="button" className="rounded border px-3 py-2" onClick={() => addCategory('LIABILITY')}>{isUr ? 'واجبات زمرہ شامل کریں' : 'Add liability category'}</button>
          {isEditMode ? (
            <>
              <button type="button" className="h-10 rounded border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50" onClick={handleManualSave} disabled={isSaving}>
                {isSaving ? (isUr ? 'محفوظ ہو رہا ہے...' : 'Saving...') : isUr ? 'محفوظ کریں' : 'Save'}
              </button>
              <button type="button" className="h-10 rounded bg-brand px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50" onClick={handleCloseAction} disabled={isSaving}>
                {submitLabel || (isUr ? 'بند کریں' : 'Close')}
              </button>
            </>
          ) : (
            <button className="rounded bg-brand px-4 py-2 text-white">{submitLabel || (isUr ? 'ریکارڈ محفوظ کریں' : 'Save record')}</button>
          )}
        </div>
      </motion.form>
    </main>
  );
}
