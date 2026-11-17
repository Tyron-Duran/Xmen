import { SignJWT, jwtVerify, importSPKI } from 'jose';
import bcrypt from 'bcryptjs';
import type { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.FSM_SESSION_SECRET || 'fsm_default_super_secret_session_key_minimum_64_characters_long_for_security'
);

export interface UserSession {
  userId: string;
  email: string;
  role: 'dispatcher' | 'technician' | 'admin';
  fullName: string;
}

// Clerk JWT Verification Support
export async function verifyClerkToken(token: string): Promise<UserSession | null> {
  try {
    const clerkPublicKey = process.env.CLERK_JWT_KEY;
    if (clerkPublicKey) {
      const pem = clerkPublicKey.includes('BEGIN PUBLIC KEY')
        ? clerkPublicKey
        : `-----BEGIN PUBLIC KEY-----\n${clerkPublicKey}\n-----END PUBLIC KEY-----`;
      const key = await importSPKI(pem, 'RS256');
      const { payload } = await jwtVerify(token, key);
      const email = (payload.email as string) || (payload.primary_email_address as string) || `${payload.sub}@clerk.user`;
      const metadataRole = (payload.public_metadata as any)?.role || (payload.role as string) || 'technician';
      const role = ['dispatcher', 'technician', 'admin'].includes(metadataRole) ? metadataRole as any : 'technician';
      return {
        userId: payload.sub as string,
        email,
        role,
        fullName: (payload.name as string) || (payload.first_name ? `${payload.first_name} ${payload.last_name || ''}`.trim() : email)
      };
    }

    // If no public key set in test/dev, decode payload safely
    const parts = token.split('.');
    if (parts.length === 3) {
      const decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
      if (decoded.iss && decoded.iss.includes('clerk')) {
        const email = decoded.email || `${decoded.sub}@clerk.user`;
        const role = ['dispatcher', 'technician', 'admin'].includes(decoded.role) ? decoded.role : 'technician';
        return {
          userId: decoded.sub || 'clerk_user',
          email,
          role,
          fullName: decoded.name || email
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: UserSession): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  // First check if this is a Clerk JWT
  const clerkUser = await verifyClerkToken(token);
  if (clerkUser) return clerkUser;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}

export async function getSessionUser(req: NextRequest): Promise<UserSession | null> {
  // Support Authorization header with Clerk Bearer token or session cookie
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = await verifySessionToken(token);
    if (user) return user;
  }

  const cookie = req.cookies.get('fsm_session');
  if (!cookie?.value) return null;
  return verifySessionToken(cookie.value);
}

// Service-to-service OAuth token verification (HS256 or Clerk)
export async function verifyServiceToken(authHeader: string | null, requiredScope: string): Promise<{
  valid: boolean;
  errorCategory?: 'AUTHENTICATION_REQUIRED' | 'FORBIDDEN_SCOPE';
  clientId?: string;
}> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, errorCategory: 'AUTHENTICATION_REQUIRED' };
  }

  const token = authHeader.substring(7);

  // Check Clerk JWT first if configured
  const clerkUser = await verifyClerkToken(token);
  if (clerkUser) {
    return { valid: true, clientId: clerkUser.userId };
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const scopes = (payload.scope as string || '').split(' ');
    if (!scopes.includes(requiredScope)) {
      return { valid: false, errorCategory: 'FORBIDDEN_SCOPE' };
    }
    return { valid: true, clientId: payload.sub as string };
  } catch {
    return { valid: false, errorCategory: 'AUTHENTICATION_REQUIRED' };
  }
}

export async function createServiceToken(clientId: string, scopes: string[]): Promise<string> {
  return new SignJWT({ scope: scopes.join(' ') })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(clientId)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET);
}

// PostgreSQL Role Mapping & RBAC Helper
export const RolePermissionsMap: Record<string, string[]> = {
  admin: ['*'],
  dispatcher: [
    'installations:create',
    'installations:read',
    'installations:update',
    'jobs:assign',
    'jobs:reschedule',
    'jobs:cancel',
    'technicians:read'
  ],
  technician: [
    'jobs:read_assigned',
    'jobs:load_items',
    'jobs:start',
    'jobs:complete',
    'jobs:upload_pod',
    'feedback:read_own'
  ]
};

export function hasPermission(role: string, permission: string): boolean {
  const allowed = RolePermissionsMap[role] || [];
  return allowed.includes('*') || allowed.includes(permission);
}
