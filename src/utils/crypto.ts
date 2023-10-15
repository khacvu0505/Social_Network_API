import { createHash } from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

export function hasPassword(password: string): string {
  return sha256(password + process.env.PASSWORD_SECRET);
}
