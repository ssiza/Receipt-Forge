import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { User } from '@/lib/db/schema';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);

export type TokenPayload = {
  userId: number;
  email: string;
  exp: number;
};

export async function createAuthToken(user: User): Promise<string> {
  const payload: TokenPayload = {
    userId: user.id!,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifyAuthToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value || null;
}

export async function setAuthToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  cookieStore.set('auth_token', token, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: false, // Set to false for development
    sameSite: 'lax',
    path: '/',
  });
}

export async function clearAuthToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
} 