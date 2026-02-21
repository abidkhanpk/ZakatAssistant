import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { decrypt } from './crypto';

export async function getSmtpSettings() {
  const keys = [
    'smtp.host',
    'smtp.port',
    'smtp.secure',
    'smtp.username',
    'smtp.password',
    'smtp.fromName',
    'smtp.fromEmail'
  ] as const;
  const rows = await prisma.appSetting.findMany({ where: { key: { in: [...keys] } } });
  const map = new Map(rows.map((row) => [row.key, row]));

  // Backward compatibility for existing JSON-based smtp setting
  if (!map.get('smtp.host')) {
    const legacy = await prisma.appSetting.findUnique({ where: { key: 'smtp' } });
    if (legacy) {
      const value = legacy.value as any;
      return {
        host: String(value.host || ''),
        port: Number(value.port || 0),
        secure: Boolean(value.secure),
        username: String(value.username || ''),
        password: legacy.encrypted ? decrypt(String(value.password || '')) : String(value.password || ''),
        fromName: String(value.fromName || ''),
        fromEmail: String(value.fromEmail || '')
      };
    }
  }

  const host = map.get('smtp.host')?.value;
  const port = map.get('smtp.port')?.value;
  const secure = map.get('smtp.secure')?.value;
  const username = map.get('smtp.username')?.value;
  const passwordRow = map.get('smtp.password');
  const fromName = map.get('smtp.fromName')?.value;
  const fromEmail = map.get('smtp.fromEmail')?.value;

  if (!host || !port || !username || !passwordRow || !fromName || !fromEmail) return null;

  const rawPassword = String(passwordRow.value || '');
  return {
    host: String(host),
    port: Number(port),
    secure: Boolean(secure),
    username: String(username),
    password: passwordRow.encrypted ? decrypt(rawPassword) : rawPassword,
    fromName: String(fromName),
    fromEmail: String(fromEmail)
  };
}

export async function sendEmail(to: string, subject: string, html: string) {
  const smtp = await getSmtpSettings();
  if (!smtp) throw new Error('SMTP not configured');
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.username, pass: smtp.password }
  });
  await transporter.sendMail({ from: `${smtp.fromName} <${smtp.fromEmail}>`, to, subject, html });
}
