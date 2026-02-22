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
  { type: 'ASSET', nameEn: 'Property purchased for onward sale', nameUr: 'فروخت کے لیے خریدی گئی جائیداد', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'ASSET', nameEn: 'Cash & bank accounts', nameUr: 'نقدی اور بینک اکاؤنٹس', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'ASSET', nameEn: 'Receivable loans', nameUr: 'قابل وصول قرضے', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'ASSET', nameEn: 'BC deposits not yet received', nameUr: 'بی سی ڈپازٹس جو ابھی وصول نہیں ہوئے', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'ASSET', nameEn: 'Foreign currency', nameUr: 'غیر ملکی کرنسی', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'ASSET', nameEn: 'Prize bonds', nameUr: 'پرائز بانڈز', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'ASSET', nameEn: 'Insurance premium paid', nameUr: 'ادا شدہ انشورنس پریمیم', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'ASSET', nameEn: 'Hajj deposit', nameUr: 'حج ڈپازٹ', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'ASSET', nameEn: 'LC margin deposit', nameUr: 'ایل سی مارجن ڈپازٹ', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'ASSET', nameEn: 'Payment to banks for goods', nameUr: 'سامان کے لیے بینک کو ادائیگی', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'ASSET', nameEn: 'Investment as partner', nameUr: 'بطور پارٹنر سرمایہ کاری', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'ASSET', nameEn: 'Savings certificates', nameUr: 'سیونگ سرٹیفکیٹس', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'ASSET', nameEn: 'Provident fund', nameUr: 'پراویڈنٹ فنڈ', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'ASSET', nameEn: 'Raw materials', nameUr: 'خام مال', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'ASSET', nameEn: 'Goods sold receivable', nameUr: 'فروخت شدہ مال کی قابل وصول رقم', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'LIABILITY', nameEn: 'Payable loans', nameUr: 'واجب الادا قرضے', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'LIABILITY', nameEn: 'BC balance installments received', nameUr: 'موصول شدہ بی سی بقایا اقساط', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'LIABILITY', nameEn: 'Mehar payable', nameUr: 'مہر قابل ادائیگی', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'LIABILITY', nameEn: 'Goods bought on credit', nameUr: 'ادھار خریدا گیا سامان', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'LIABILITY', nameEn: 'Salaries payable', nameUr: 'واجب الادا تنخواہیں', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'LIABILITY', nameEn: 'Rent payable', nameUr: 'واجب الادا کرایہ', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'LIABILITY', nameEn: 'Taxes payable', nameUr: 'واجب الادا ٹیکس', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'LIABILITY', nameEn: 'Utility bills payable', nameUr: 'واجب الادا یوٹیلیٹی بلز', items: [{ description: 'Amount', amount: 0 }] },
  { type: 'LIABILITY', nameEn: 'Other liabilities', nameUr: 'دیگر واجبات', items: [{ description: 'Amount', amount: 0 }] }
];
