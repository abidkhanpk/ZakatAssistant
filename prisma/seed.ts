import { PrismaClient, Role, CategoryType } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const defaultCategories = [
  { type: CategoryType.ASSET, nameEn: 'Gold', nameUr: 'سونا', sortOrder: 1 },
  { type: CategoryType.ASSET, nameEn: 'Property purchased for onward sale', nameUr: 'فروخت کے لیے خریدی گئی جائیداد', sortOrder: 2 },
  { type: CategoryType.ASSET, nameEn: 'Cash & bank accounts', nameUr: 'نقدی اور بینک اکاؤنٹس', sortOrder: 3 },
  { type: CategoryType.ASSET, nameEn: 'Receivable loans', nameUr: 'قابل وصول قرضے', sortOrder: 4 },
  { type: CategoryType.ASSET, nameEn: 'BC deposits not yet received', nameUr: 'بی سی ڈپازٹس جو ابھی وصول نہیں ہوئے', sortOrder: 5 },
  { type: CategoryType.LIABILITY, nameEn: 'Payable loans', nameUr: 'واجب الادا قرضے', sortOrder: 1 },
  { type: CategoryType.LIABILITY, nameEn: 'BC balance installments received', nameUr: 'موصول شدہ بی سی بقایا اقساط', sortOrder: 2 }
];

async function main() {
  const password = 'admin123';
  const passwordHash = await argon2.hash(password);

  await prisma.user.upsert({
    where: { username: 'admin' },
    create: {
      username: 'admin',
      email: 'admin@zakatassistant.local',
      name: 'Default Admin',
      passwordHash,
      role: Role.ADMIN,
      emailVerifiedAt: new Date()
    },
    update: {
      role: Role.ADMIN,
      emailVerifiedAt: new Date()
    }
  });

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: {
        id: `${category.type}-${category.sortOrder}`
      },
      create: {
        id: `${category.type}-${category.sortOrder}`,
        ...category,
        isDefault: true
      },
      update: {
        ...category,
        isDefault: true
      }
    });
  }

  await prisma.appSetting.upsert({
    where: { key: 'annualReminderTemplate' },
    create: {
      key: 'annualReminderTemplate',
      value: {
        titleEn: 'Annual Zakat reminder',
        bodyEn: 'It is time to review your yearly Zakat calculation in ZakatAssistant.',
        titleUr: 'سالانہ زکوٰۃ یاد دہانی',
        bodyUr: 'ZakatAssistant میں اپنی سالانہ زکوٰۃ کیلکولیشن کا جائزہ لیں۔'
      }
    },
    update: {}
  });

  console.log('-----------------------------------');
  console.log('ZakatAssistant Seed Completed ✅');
  console.log('Admin User Created:');
  console.log('Username: admin');
  console.log('Password: admin123');
  console.log('Login at: /login');
  console.log('-----------------------------------');
}

main().finally(async () => {
  await prisma.$disconnect();
});
