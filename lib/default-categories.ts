export type TemplateItem = {
  description: string;
  amount: number;
};

export type CategoryTemplate = {
  type: 'ASSET' | 'LIABILITY';
  nameEn: string;
  nameUr: string;
  items: TemplateItem[];
};

export const defaultCategoryTemplates: CategoryTemplate[] = [
  {
    type: 'ASSET',
    nameEn: 'Jewelry & precious metals',
    nameUr: 'زیورات اور قیمتی دھاتیں',
    items: [
      { description: 'Gold', amount: 0 },
      { description: 'Silver', amount: 0 },
      { description: 'Other precious items', amount: 0 }
    ]
  },
  { type: 'ASSET', nameEn: 'Cash & bank accounts', nameUr: 'نقدی اور بینک اکاؤنٹس', items: [{ description: 'Cash', amount: 0 }] },
  { type: 'ASSET', nameEn: 'Property purchased for onward sale', nameUr: 'فروخت کے لیے خریدی گئی جائیداد', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'ASSET', nameEn: 'Receivable loans', nameUr: 'قابل وصول قرضے', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'ASSET', nameEn: 'BC deposits not yet received', nameUr: 'بی سی ڈپازٹس جو ابھی وصول نہیں ہوئے', items: [{ description: 'Amount', amount: 0 }] },
  {
    type: 'ASSET',
    nameEn: 'Miscellaneous',
    nameUr: 'متفرق',
    items: [
      { description: 'Foreign currency', amount: 0 },
      { description: 'Prize bonds', amount: 0 },
      { description: 'Insurance premium', amount: 0 },
      { description: 'Hajj deposit', amount: 0 },
      { description: 'Savings certificates', amount: 0 },
      { description: 'Provident fund', amount: 0 }
    ]
  },
  {
    type: 'ASSET',
    nameEn: 'Business/Investment',
    nameUr: 'کاروبار/سرمایہ کاری',
    items: [
      { description: 'Raw materials', amount: 0 },
      { description: 'Goods sold receivable', amount: 0 },
      { description: 'LC margin deposit', amount: 0 },
      { description: 'Payment to banks for goods', amount: 0 },
      { description: 'Investment as partner', amount: 0 }
    ]
  },
  { type: 'LIABILITY', nameEn: 'Payable loans', nameUr: 'واجب الادا قرضے', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'LIABILITY', nameEn: 'BC balance installments received', nameUr: 'موصول شدہ بی سی بقایا اقساط', items: [{ description: 'Amount', amount: 0 }] },
  {
    type: 'LIABILITY',
    nameEn: 'Business',
    nameUr: 'کاروباری',
    items: [
      { description: 'Salaries payable', amount: 0 },
      { description: 'Goods bought on credit', amount: 0 }
    ]
  },
  {
    type: 'LIABILITY',
    nameEn: 'Miscellaneous',
    nameUr: 'متفرق',
    items: [
      { description: 'Utility bills payable', amount: 0 },
      { description: 'Taxes payable', amount: 0 },
      { description: 'Rent payable', amount: 0 },
      { description: 'Mehar payable', amount: 0 }
    ]
  },
  { type: 'LIABILITY', nameEn: 'Other liabilities', nameUr: 'دیگر واجبات', items: [{ description: 'Amount', amount: 0 }] }
];
