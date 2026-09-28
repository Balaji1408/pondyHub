import { createHmac, timingSafeEqual } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function secret() {
  return process.env.ADMIN_SECRET || 'pondy-hub-admin-dev-secret';
}

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USER || 'admin',
    password: process.env.ADMIN_PASSWORD || 'pondyhub',
  };
}

export function createAdminToken(username: string) {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ u: username, exp })).toString('base64url');
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string): { username: string } | null {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;

  const expected = createHmac('sha256', secret()).update(payload).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      u?: string;
      exp?: number;
    };
    if (!data.u || !data.exp || Date.now() > data.exp) return null;
    return { username: data.u };
  } catch {
    return null;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Admin login required' });
  }
  const session = verifyAdminToken(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  (req as Request & { admin?: { username: string } }).admin = session;
  next();
}
