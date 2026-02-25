ALTER TABLE "Category" ADD COLUMN "stableId" TEXT;
ALTER TABLE "LineItem" ADD COLUMN "stableId" TEXT;

UPDATE "Category"
SET "stableId" = CASE
  WHEN "type" = 'ASSET' AND (lower("nameEn") = lower('Jewelry & precious metals') OR "nameUr" = 'زیورات اور قیمتی دھاتیں') THEN 'asset_jewelry_precious_metals'
  WHEN "type" = 'ASSET' AND (lower("nameEn") = lower('Cash & bank accounts') OR "nameUr" = 'نقدی اور بینک اکاؤنٹس') THEN 'asset_cash_bank_accounts'
  WHEN "type" = 'ASSET' AND (lower("nameEn") = lower('Property purchased for onward sale') OR "nameUr" = 'فروخت کے لیے خریدی گئی جائیداد') THEN 'asset_property_for_sale'
  WHEN "type" = 'ASSET' AND (lower("nameEn") = lower('Receivable loans') OR "nameUr" = 'قابل وصول قرضے') THEN 'asset_receivable_loans'
  WHEN "type" = 'ASSET' AND (lower("nameEn") = lower('BC deposits not yet received') OR "nameUr" = 'بی سی ڈپازٹس جو ابھی وصول نہیں ہوئے') THEN 'asset_bc_deposits_not_received'
  WHEN "type" = 'ASSET' AND (lower("nameEn") = lower('Business/Investment') OR "nameUr" = 'کاروبار/سرمایہ کاری') THEN 'asset_business_investment'
  WHEN "type" = 'ASSET' AND (lower("nameEn") = lower('Miscellaneous') OR "nameUr" = 'متفرق') THEN 'asset_miscellaneous'
  WHEN "type" = 'LIABILITY' AND (lower("nameEn") = lower('Payable loans') OR "nameUr" = 'واجب الادا قرضے') THEN 'liability_payable_loans'
  WHEN "type" = 'LIABILITY' AND (lower("nameEn") = lower('BC balance installments received') OR "nameUr" = 'موصول شدہ بی سی بقایا اقساط') THEN 'liability_bc_balance_installments'
  WHEN "type" = 'LIABILITY' AND (lower("nameEn") = lower('Business') OR "nameUr" = 'کاروباری') THEN 'liability_business'
  WHEN "type" = 'LIABILITY' AND (lower("nameEn") = lower('Miscellaneous') OR "nameUr" = 'متفرق') THEN 'liability_miscellaneous'
  ELSE concat('custom-cat-', "id")
END
WHERE "stableId" IS NULL;

UPDATE "LineItem" li
SET "stableId" = CASE
  WHEN c."stableId" = 'asset_jewelry_precious_metals' AND (lower(li."description") = lower('Gold') OR li."description" = 'سونا') THEN 'gold'
  WHEN c."stableId" = 'asset_jewelry_precious_metals' AND (lower(li."description") = lower('Silver') OR li."description" = 'چاندی') THEN 'silver'
  WHEN c."stableId" = 'asset_jewelry_precious_metals' AND (lower(li."description") = lower('Other precious items') OR li."description" = 'دیگر قیمتی اشیاء') THEN 'other_precious_items'
  WHEN c."stableId" = 'asset_cash_bank_accounts' AND (lower(li."description") = lower('Cash') OR li."description" = 'نقدی') THEN 'cash'
  WHEN c."stableId" = 'asset_property_for_sale' AND (lower(li."description") IN (lower('Amount'), lower('Description')) OR li."description" = 'تفصیل') THEN 'property_sale_amount'
  WHEN c."stableId" = 'asset_receivable_loans' AND (lower(li."description") IN (lower('Amount'), lower('Description')) OR li."description" = 'تفصیل') THEN 'receivable_loans_amount'
  WHEN c."stableId" = 'asset_bc_deposits_not_received' AND (lower(li."description") IN (lower('Amount'), lower('Description')) OR li."description" = 'تفصیل') THEN 'bc_deposits_amount'
  WHEN c."stableId" = 'asset_business_investment' AND (lower(li."description") = lower('Raw materials') OR li."description" = 'خام مال') THEN 'raw_materials'
  WHEN c."stableId" = 'asset_business_investment' AND (lower(li."description") = lower('Goods sold receivable') OR li."description" = 'فروخت شدہ مال کی قابل وصول رقم') THEN 'goods_sold_receivable'
  WHEN c."stableId" = 'asset_business_investment' AND (lower(li."description") = lower('LC margin deposit') OR li."description" = 'ایل سی مارجن ڈپازٹ') THEN 'lc_margin_deposit'
  WHEN c."stableId" = 'asset_business_investment' AND (lower(li."description") = lower('Payment to banks for goods') OR li."description" = 'سامان کے لیے بینک کو ادائیگی') THEN 'payment_to_banks_for_goods'
  WHEN c."stableId" = 'asset_business_investment' AND (lower(li."description") = lower('Investment as partner') OR li."description" = 'بطور پارٹنر سرمایہ کاری') THEN 'investment_as_partner'
  WHEN c."stableId" = 'asset_miscellaneous' AND (lower(li."description") = lower('Foreign currency') OR li."description" = 'غیر ملکی کرنسی') THEN 'foreign_currency'
  WHEN c."stableId" = 'asset_miscellaneous' AND (lower(li."description") = lower('Prize bonds') OR li."description" = 'پرائز بانڈز') THEN 'prize_bonds'
  WHEN c."stableId" = 'asset_miscellaneous' AND (lower(li."description") = lower('Insurance premium') OR li."description" = 'انشورنس پریمیم') THEN 'insurance_premium'
  WHEN c."stableId" = 'asset_miscellaneous' AND (lower(li."description") = lower('Hajj deposit') OR li."description" = 'حج ڈپازٹ') THEN 'hajj_deposit'
  WHEN c."stableId" = 'asset_miscellaneous' AND (lower(li."description") = lower('Savings certificates') OR li."description" = 'سیونگ سرٹیفکیٹس') THEN 'savings_certificates'
  WHEN c."stableId" = 'asset_miscellaneous' AND (lower(li."description") = lower('Provident fund') OR li."description" = 'پراویڈنٹ فنڈ') THEN 'provident_fund'
  WHEN c."stableId" = 'liability_payable_loans' AND (lower(li."description") IN (lower('Amount'), lower('Description')) OR li."description" = 'تفصیل') THEN 'payable_loans_amount'
  WHEN c."stableId" = 'liability_bc_balance_installments' AND (lower(li."description") IN (lower('Amount'), lower('Description')) OR li."description" = 'تفصیل') THEN 'bc_balance_installments_amount'
  WHEN c."stableId" = 'liability_business' AND (lower(li."description") = lower('Salaries payable') OR li."description" = 'واجب الادا تنخواہیں') THEN 'salaries_payable'
  WHEN c."stableId" = 'liability_business' AND (lower(li."description") = lower('Goods bought on credit') OR li."description" = 'ادھار خریدا گیا سامان') THEN 'goods_bought_on_credit'
  WHEN c."stableId" = 'liability_miscellaneous' AND (lower(li."description") = lower('Utility bills payable') OR li."description" = 'واجب الادا یوٹیلیٹی بلز') THEN 'utility_bills_payable'
  WHEN c."stableId" = 'liability_miscellaneous' AND (lower(li."description") = lower('Taxes payable') OR li."description" = 'واجب الادا ٹیکس') THEN 'taxes_payable'
  WHEN c."stableId" = 'liability_miscellaneous' AND (lower(li."description") = lower('Rent payable') OR li."description" = 'واجب الادا کرایہ') THEN 'rent_payable'
  WHEN c."stableId" = 'liability_miscellaneous' AND (lower(li."description") = lower('Mehar payable') OR li."description" = 'مہر قابل ادائیگی') THEN 'mehar_payable'
  WHEN c."stableId" = 'liability_miscellaneous' AND (lower(li."description") = lower('Other liabilities') OR li."description" = 'دیگر واجبات') THEN 'other_liabilities'
  ELSE concat('custom-item-', li."id")
END
FROM "Category" c
WHERE li."categoryId" = c."id" AND li."stableId" IS NULL;
