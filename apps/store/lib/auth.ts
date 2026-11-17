import { SignJWT, jwtVerify, importSPKI } from 'jose';
import bcrypt from 'bcryptjs';
import type { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.STORE_SESSION_SECRET || 'store_default_super_secret_session_key_minimum_64_characters_long_for_security'
);

// FSM shared secret for service-to-service communication
const FSM_SERVICE_SECRET = new TextEncoder().encode(
  process.env.FSM_SESSION_SECRET || 'fsm_default_super_secret_session_key_minimum_64_characters_long_for_security'
);

export interface UserSession {
  userId: string;
  email: string;
  role: 'customer' | 'store_admin';
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
      const metadataRole = (payload.public_metadata as any)?.role || (payload.role as string) || 'customer';
      const role = ['customer', 'store_admin'].includes(metadataRole) ? metadataRole as any : 'customer';
      return {
        userId: payload.sub as string,
        email,
        role,
        fullName: (payload.name as string) || (payload.first_name ? `${payload.first_name} ${payload.last_name || ''}`.trim() : email)
      };
    }

    // Decode if issued by Clerk
    const parts = token.split('.');
    if (parts.length === 3) {
      const decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
      if (decoded.iss && decoded.iss.includes('clerk')) {
        const email = decoded.email || `${decoded.sub}@clerk.user`;
        const role = ['customer', 'store_admin'].includes(decoded.role) ? decoded.role : 'customer';
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
  // First check if Clerk token
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

  const cookie = req.cookies.get('store_session');
  if (!cookie?.value) return null;
  return verifySessionToken(cookie.value);
}

// Generate service token signed for FSM verification
export async function createStoreToFsmServiceToken(scopes: string[]): Promise<string> {
  return new SignJWT({ scope: scopes.join(' ') })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('store-service')
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(FSM_SERVICE_SECRET);
}
