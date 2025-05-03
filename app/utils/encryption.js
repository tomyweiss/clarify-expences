import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.CLARIFY_ENCRYPTION_KEY || 'c278c508e351e2bb25d2ee4b1a902783ee513e8c0c7c45c9735866112349db43';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const ENCRYPTION_KEY_BUFFER = Buffer.from(ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex');

export function encrypt(text) {
  if (!text) return null;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY_BUFFER, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV, encrypted data, and auth tag
  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

export function decrypt(encryptedText) {
  if (!encryptedText) return null;
  
  const [ivHex, encryptedData, authTagHex] = encryptedText.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY_BUFFER, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
} 