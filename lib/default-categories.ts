export type TemplateItem = {
  key: string;
  description: string;
  amount: number;
  legacyDescriptions?: string[];
};

export type CategoryTemplate = {
  key: string;
  type: 'ASSET' | 'LIABILITY';
  nameEn: string;
  nameUr: string;
  legacyNamesEn?: string[];
  legacyNamesUr?: string[];
  items: TemplateItem[];
};

export const defaultCategoryTemplates: CategoryTemplate[] = [
  {
    key: 'asset_jewelry_precious_metals',
    type: 'ASSET',
    nameEn: 'Jewelry & precious metals',
    nameUr: 'زیورات اور قیمتی دھاتیں',
    items: [
      { key: 'gold', description: 'Gold', amount: 0, legacyDescriptions: ['سونا'] },
      { key: 'silver', description: 'Silver', amount: 0, legacyDescriptions: ['چاندی'] },
      { key: 'other_precious_items', description: 'Other precious items', amount: 0, legacyDescriptions: ['دیگر قیمتی اشیاء'] }
    ]
  },
  {
    key: 'asset_cash_bank_accounts',
    type: 'ASSET',
    nameEn: 'Cash & bank accounts',
    nameUr: 'نقدی اور بینک اکاؤنٹس',
    items: [{ key: 'cash', description: 'Cash', amount: 0, legacyDescriptions: ['نقدی'] }]
  },
  {
    key: 'asset_property_for_sale',
    type: 'ASSET',
    nameEn: 'Property purchased for onward sale',
    nameUr: 'فروخت کے لیے خریدی گئی جائیداد',
    items: [{ key: 'property_sale_amount', description: 'Amount', amount: 0, legacyDescriptions: ['تفصیل'] }]
  },
  {
    key: 'asset_receivable_loans',
    type: 'ASSET',
    nameEn: 'Receivable loans',
    nameUr: 'قابل وصول قرضے',
    items: [{ key: 'receivable_loans_amount', description: 'Amount', amount: 0, legacyDescriptions: ['تفصیل'] }]
  },
  {
    key: 'asset_bc_deposits_not_received',
    type: 'ASSET',
    nameEn: 'BC deposits not yet received',
    nameUr: 'بی سی ڈپازٹس جو ابھی وصول نہیں ہوئے',
    items: [{ key: 'bc_deposits_amount', description: 'Amount', amount: 0, legacyDescriptions: ['تفصیل'] }]
  },
  {
    key: 'asset_business_investment',
    type: 'ASSET',
    nameEn: 'Business/Investment',
    nameUr: 'کاروبار/سرمایہ کاری',
    items: [
      { key: 'raw_materials', description: 'Raw materials', amount: 0, legacyDescriptions: ['خام مال'] },
      { key: 'goods_sold_receivable', description: 'Goods sold receivable', amount: 0, legacyDescriptions: ['فروخت شدہ مال کی قابل وصول رقم'] },
      { key: 'lc_margin_deposit', description: 'LC margin deposit', amount: 0, legacyDescriptions: ['ایل سی مارجن ڈپازٹ'] },
      { key: 'payment_to_banks_for_goods', description: 'Payment to banks for goods', amount: 0, legacyDescriptions: ['سامان کے لیے بینک کو ادائیگی'] },
      { key: 'investment_as_partner', description: 'Investment as partner', amount: 0, legacyDescriptions: ['بطور پارٹنر سرمایہ کاری'] }
    ]
  },
  {
    key: 'asset_miscellaneous',
    type: 'ASSET',
    nameEn: 'Miscellaneous',
    nameUr: 'متفرق',
    items: [
      { key: 'foreign_currency', description: 'Foreign currency', amount: 0, legacyDescriptions: ['غیر ملکی کرنسی'] },
      { key: 'prize_bonds', description: 'Prize bonds', amount: 0, legacyDescriptions: ['پرائز بانڈز'] },
      { key: 'insurance_premium', description: 'Insurance premium', amount: 0, legacyDescriptions: ['انشورنس پریمیم'] },
      { key: 'hajj_deposit', description: 'Hajj deposit', amount: 0, legacyDescriptions: ['حج ڈپازٹ'] },
      { key: 'savings_certificates', description: 'Savings certificates', amount: 0, legacyDescriptions: ['سیونگ سرٹیفکیٹس'] },
      { key: 'provident_fund', description: 'Provident fund', amount: 0, legacyDescriptions: ['پراویڈنٹ فنڈ'] }
    ]
  },
  {
    key: 'liability_payable_loans',
    type: 'LIABILITY',
    nameEn: 'Payable loans',
    nameUr: 'واجب الادا قرضے',
    items: [{ key: 'payable_loans_amount', description: 'Amount', amount: 0, legacyDescriptions: ['تفصیل'] }]
  },
  {
    key: 'liability_bc_balance_installments',
    type: 'LIABILITY',
    nameEn: 'BC balance installments received',
    nameUr: 'موصول شدہ بی سی بقایا اقساط',
    items: [{ key: 'bc_balance_installments_amount', description: 'Amount', amount: 0, legacyDescriptions: ['تفصیل'] }]
  },
  {
    key: 'liability_business',
    type: 'LIABILITY',
    nameEn: 'Business',
    nameUr: 'کاروباری',
    items: [
      { key: 'salaries_payable', description: 'Salaries payable', amount: 0, legacyDescriptions: ['واجب الادا تنخواہیں'] },
      { key: 'goods_bought_on_credit', description: 'Goods bought on credit', amount: 0, legacyDescriptions: ['ادھار خریدا گیا سامان'] }
    ]
  },
  {
    key: 'liability_miscellaneous',
    type: 'LIABILITY',
    nameEn: 'Miscellaneous',
    nameUr: 'متفرق',
    items: [
      { key: 'utility_bills_payable', description: 'Utility bills payable', amount: 0, legacyDescriptions: ['واجب الادا یوٹیلیٹی بلز'] },
      { key: 'taxes_payable', description: 'Taxes payable', amount: 0, legacyDescriptions: ['واجب الادا ٹیکس'] },
      { key: 'rent_payable', description: 'Rent payable', amount: 0, legacyDescriptions: ['واجب الادا کرایہ'] },
      { key: 'mehar_payable', description: 'Mehar payable', amount: 0, legacyDescriptions: ['مہر قابل ادائیگی'] },
      { key: 'other_liabilities', description: 'Other liabilities', amount: 0, legacyDescriptions: ['دیگر واجبات'] }
    ]
  }
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

const itemTemplateByKey = new Map(defaultCategoryTemplates.flatMap((c) => c.items.map((i) => [i.key, { categoryKey: c.key, item: i }] as const)));

export function findTemplateCategoryByNames(type: 'ASSET' | 'LIABILITY', nameEn: string, nameUr: string) {
  const en = normalize(nameEn);
  const ur = normalize(nameUr);
  return defaultCategoryTemplates.find((template) => {
    if (template.type !== type) return false;
    const enMatches = [template.nameEn, ...(template.legacyNamesEn || [])].map(normalize).includes(en);
    const urMatches = [template.nameUr, ...(template.legacyNamesUr || [])].map(normalize).includes(ur);
    return enMatches || urMatches;
  });
}

export function findTemplateItemByDescription(categoryKey: string, description: string) {
  const normalizedDescription = normalize(description);
  const category = defaultCategoryTemplates.find((entry) => entry.key === categoryKey);
  if (!category) return undefined;

  return category.items.find((item) => [item.description, ...(item.legacyDescriptions || [])].map(normalize).includes(normalizedDescription));
}

export function getTemplateItem(key: string) {
  return itemTemplateByKey.get(key);
}
