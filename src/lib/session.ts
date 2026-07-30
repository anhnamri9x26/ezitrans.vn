import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { generateRandomToken } from './auth';
import { User } from '@prisma/client';

const SESSION_COOKIE_NAME = 'lexi_session_token';
const SESSION_EXPIRY_DAYS = 7;

/**
 * Create a new user session in database and set HttpOnly cookie
 */
export async function createSession(
  userId: number,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<string> {
  const token = generateRandomToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await prisma.userSession.create({
    data: {
      userId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
    sameSite: 'lax',
  });

  return token;
}

/**
 * Validate current session and return user or null
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await prisma.userSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) return null;

    // Check expiration
    if (session.expiresAt < new Date()) {
      await prisma.userSession.delete({ where: { token } });
      const cookieStore = await cookies();
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    return session.user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

/**
 * Destroy the current user session (logout)
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await prisma.userSession.deleteMany({
        where: { token },
      });
      cookieStore.delete(SESSION_COOKIE_NAME);
    }
  } catch (error) {
    console.error('Error in destroySession:', error);
  }
}

/**
 * Destroy all sessions for a user (e.g. on password change)
 */
export async function destroyAllSessions(userId: number): Promise<void> {
  try {
    await prisma.userSession.deleteMany({
      where: { userId },
    });
    // Attempt to clear cookie for current request/response if any
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error('Error in destroyAllSessions:', error);
  }
}

/**
 * Clean up expired sessions from database
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Error in cleanupExpiredSessions:', error);
  }
}
