import crypto from 'crypto';

const key = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';

export function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(payload: string) {
  const [ivHex, tagHex, dataHex] = payload.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(dataHex, 'hex', 'utf8') + decipher.final('utf8');
}

export function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
