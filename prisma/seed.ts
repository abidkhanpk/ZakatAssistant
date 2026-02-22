import { PrismaClient, Role } from '@prisma/client';
import { randomBytes, scrypt as scryptCallback } from 'crypto';
import { promisify } from 'util';
import { defaultCategoryTemplates } from '../lib/default-categories';

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);

function toSeedId(name: string, type: 'ASSET' | 'LIABILITY') {
  return `default-${type.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

async function main() {
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  await prisma.user.upsert({
    where: { username: 'admin' },
    create: {
      username: 'admin',
      email: 'abid@gmx.com',
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

  for (const category of defaultCategoryTemplates) {
    await prisma.category.upsert({
      where: { id: toSeedId(category.nameEn, category.type) },
      create: {
        id: toSeedId(category.nameEn, category.type),
        type: category.type,
        nameEn: category.nameEn,
        nameUr: category.nameUr,
        isDefault: true,
        sortOrder: defaultCategoryTemplates.indexOf(category)
      },
      update: {
        type: category.type,
        nameEn: category.nameEn,
        nameUr: category.nameUr,
        isDefault: true,
        sortOrder: defaultCategoryTemplates.indexOf(category)
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
