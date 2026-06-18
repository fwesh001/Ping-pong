/**
 * Session Management Utilities
 *
 * Uses secure HTTP-only cookies to manage user sessions after Flux
 * authentication. The cookie stores the Flux access token.
 *
 * Cookie: flux_token
 * Flags: HttpOnly; Secure; SameSite=Lax; Path=/
 */

import { cookies } from "next/headers";

const COOKIE_NAME = "flux_token";
const REFRESH_COOKIE_NAME = "flux_refresh";

// Cookie configuration – 7-day expiry
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Set the session cookie with the Flux access token.
 * Called after successful login/signup.
 */
export async function setSession(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS);
}

/**
 * Set an optional refresh token cookie.
 */
export async function setRefreshToken(refreshToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
}

/**
 * Get the current session token from the request cookie.
 * Returns null if no valid session exists.
 */
export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME);
  return token?.value ?? null;
}

/**
 * Clear the session cookies (logout).
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
}
