import { createHmac, timingSafeEqual } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export type AdminRole = 'super_admin' | 'admin';

export type AdminSession = {
  id: number;
  username: string;
  role: AdminRole;
};

function secret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_SECRET || 'pondy-hub-admin-dev-secret';
}

function signPayload(data: Record<string, unknown>) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyPayload(token: string): Record<string, unknown> | null {
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
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Record<string, unknown>;
    if (typeof data.exp !== 'number' || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export function createAdminToken(admin: AdminSession) {
  return signPayload({
    role: admin.role,
    kind: 'staff',
    id: admin.id,
    u: admin.username,
    exp: Date.now() + TOKEN_TTL_MS,
  });
}

export function verifyAdminToken(token: string): AdminSession | null {
  const data = verifyPayload(token);
  if (!data) return null;
  // Reject customer tokens.
  if (data.kind === 'customer' || data.role === 'customer') return null;
  if (typeof data.u !== 'string') return null;

  let role: AdminRole;
  if (data.role === 'super_admin') role = 'super_admin';
  else if (data.role === 'admin' || data.role == null || data.kind === 'staff') role = 'admin';
  else return null;

  return {
    id: typeof data.id === 'number' ? data.id : 0,
    username: data.u,
    role,
  };
}

export function createCustomerToken(customer: { id: number; mobile: string }) {
  return signPayload({
    role: 'customer',
    kind: 'customer',
    id: customer.id,
    mobile: customer.mobile,
    exp: Date.now() + TOKEN_TTL_MS,
  });
}

export function verifyCustomerToken(token: string): { id: number; mobile: string } | null {
  const data = verifyPayload(token);
  if (!data || data.role !== 'customer') return null;
  if (typeof data.id !== 'number' || typeof data.mobile !== 'string') return null;
  return { id: data.id, mobile: data.mobile };
}

function bearer(req: Request) {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
}

export type AdminRequest = Request & { admin?: AdminSession };
export type CustomerRequest = Request & { customer?: { id: number; mobile: string } };

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = bearer(req);
  if (!token) {
    return res.status(401).json({ error: 'Admin login required' });
  }
  const session = verifyAdminToken(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  (req as AdminRequest).admin = session;
  next();
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const token = bearer(req);
  if (!token) {
    return res.status(401).json({ error: 'Admin login required' });
  }
  const session = verifyAdminToken(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  if (session.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  (req as AdminRequest).admin = session;
  next();
}

export function requireCustomer(req: Request, res: Response, next: NextFunction) {
  const token = bearer(req);
  if (!token) {
    return res.status(401).json({ error: 'Owner login required' });
  }
  const session = verifyCustomerToken(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  (req as CustomerRequest).customer = session;
  next();
}
