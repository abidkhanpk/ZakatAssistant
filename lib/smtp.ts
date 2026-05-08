import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { decrypt } from './crypto';

export type SmtpSecurity = 'tls' | 'ssl';

export type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  security: SmtpSecurity;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  decryptFailed: boolean;
};

function safeDecrypt(value: string) {
  try {
    return { value: decrypt(value), failed: false };
  } catch {
    return { value: '', failed: true };
  }
}

function normalizeSmtpSecurity(value: unknown, secureFallback: unknown): SmtpSecurity {
  if (value === 'ssl' || value === 'tls') return value;
  return Boolean(secureFallback) ? 'ssl' : 'tls';
}

function createTransporter(smtp: Pick<SmtpSettings, 'host' | 'port' | 'secure' | 'security' | 'username' | 'password'>) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    requireTLS: smtp.security === 'tls',
    auth: { user: smtp.username, pass: smtp.password }
  });
}

export async function getSmtpSettings(): Promise<SmtpSettings | null> {
  type SmtpRow = { key: string; value: unknown; encrypted: boolean };
  const keys = [
    'smtp.host',
    'smtp.port',
    'smtp.secure',
    'smtp.security',
    'smtp.username',
    'smtp.password',
    'smtp.fromName',
    'smtp.fromEmail'
  ] as const;
  const rows = await prisma.appSetting.findMany({ where: { key: { in: [...keys] } } });
  const map = new Map<string, SmtpRow>(rows.map((row: SmtpRow) => [row.key, row]));

  // Backward compatibility for existing JSON-based smtp setting
  if (!map.get('smtp.host')) {
    const legacy = await prisma.appSetting.findUnique({ where: { key: 'smtp' } });
    if (legacy) {
      const value = legacy.value as any;
      const decryptedLegacyPassword = legacy.encrypted ? safeDecrypt(String(value.password || '')) : { value: String(value.password || ''), failed: false };
      const security = normalizeSmtpSecurity(value.security, value.secure);
      return {
        host: String(value.host || ''),
        port: Number(value.port || 0),
        secure: security === 'ssl',
        security,
        username: String(value.username || ''),
        password: decryptedLegacyPassword.value,
        fromName: String(value.fromName || ''),
        fromEmail: String(value.fromEmail || ''),
        decryptFailed: decryptedLegacyPassword.failed
      };
    }
  }

  const host = map.get('smtp.host')?.value;
  const port = map.get('smtp.port')?.value;
  const secure = map.get('smtp.secure')?.value;
  const security = map.get('smtp.security')?.value;
  const username = map.get('smtp.username')?.value;
  const passwordRow = map.get('smtp.password');
  const fromName = map.get('smtp.fromName')?.value;
  const fromEmail = map.get('smtp.fromEmail')?.value;

  if (!host || !port || !username || !passwordRow || !fromName || !fromEmail) return null;

  const rawPassword = String(passwordRow.value || '');
  const decryptedPassword = passwordRow.encrypted ? safeDecrypt(rawPassword) : { value: rawPassword, failed: false };
  const normalizedSecurity = normalizeSmtpSecurity(security, secure);
  return {
    host: String(host),
    port: Number(port),
    secure: normalizedSecurity === 'ssl',
    security: normalizedSecurity,
    username: String(username),
    password: decryptedPassword.value,
    fromName: String(fromName),
    fromEmail: String(fromEmail),
    decryptFailed: decryptedPassword.failed
  };
}

export async function sendEmailWithSettings(
  smtp: Pick<SmtpSettings, 'host' | 'port' | 'secure' | 'security' | 'username' | 'password' | 'fromName' | 'fromEmail'>,
  to: string,
  subject: string,
  html: string
) {
  const transporter = createTransporter(smtp);
  await transporter.sendMail({ from: `${smtp.fromName} <${smtp.fromEmail}>`, to, subject, html });
}

export async function sendEmail(to: string, subject: string, html: string) {
  const smtp = await getSmtpSettings();
  if (!smtp) throw new Error('SMTP not configured');
  await sendEmailWithSettings(smtp, to, subject, html);
}
