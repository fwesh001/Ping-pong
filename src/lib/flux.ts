/**
 * Flux API Wrapper
 *
 * Communicates with the Flux authentication service.
 * Base URL: https://flux.zabdiel.tech/api/v1
 *
 * Endpoints used:
 *   POST /register          – create a new Flux user
 *   POST /login/access-token – OAuth2 password flow (form-urlencoded)
 *   GET  /users/me          – get current user (Bearer token)
 *   GET  /auth/google/login – initiate Google OAuth redirect
 */

const FLUX_API_BASE =
  process.env.FLUX_API_URL || "https://flux.zabdiel.tech/api/v1";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FluxUser {
  id: number | string;
  email: string;
  username: string;
  full_name?: string;
  is_active?: boolean;
}

export interface FluxLoginResponse {
  access_token: string;
  token_type: string;
}

export interface FluxRegisterResponse {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

async function fluxFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${FLUX_API_BASE}${path}`;
  const maxRetries = 3;
  const retryDelay = 500;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (res.ok) {
      return res.json() as Promise<T>;
    }

    let message = `Flux API error ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        message = body.detail
          .map((e: any) => `${e.loc?.join(".")}: ${e.msg}`)
          .join(", ");
      }
    } catch {
      /* ignore parse errors */
    }

    // Retry on server errors (5xx) or intermittent 400s from PgBouncer
    const isRetryable = res.status >= 500 || res.status === 429;
    if (attempt < maxRetries && isRetryable) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
      continue;
    }

    throw new Error(message);
  }

  throw new Error("Flux API error: max retries exceeded");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register a new user on Flux.
 * Payload: { email, username, full_name, password }
 */
export async function fluxSignup(
  email: string,
  username: string,
  fullName: string,
  password: string
): Promise<FluxRegisterResponse> {
  return fluxFetch<FluxRegisterResponse>("/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      username,
      full_name: fullName,
      password,
    }),
  });
}

/**
 * Log in with email/username + password via OAuth2 form-urlencoded flow.
 * Returns { access_token, token_type }.
 *
 * Includes retry logic (up to 3 attempts) to handle intermittent
 * PgBouncer/Supabase connection pooling issues on the Flux backend.
 */
export async function fluxLogin(
  emailOrUsername: string,
  password: string
): Promise<FluxLoginResponse> {
  const body = new URLSearchParams();
  body.append("username", emailOrUsername);
  body.append("password", password);

  const url = `${FLUX_API_BASE}/login/access-token`;
  const maxRetries = 3;
  const retryDelay = 500; // ms

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (res.ok) {
      return res.json() as Promise<FluxLoginResponse>;
    }

    const data = await res.json().catch(() => ({}));
    const message =
      typeof data.detail === "string" ? data.detail : "Invalid credentials";

    // Retry on server errors (5xx) or on 400 from PgBouncer connection issues.
    // PgBouncer issues cause Flux to return 400 "Incorrect email or password"
    // even when credentials are correct, because the DB query fails silently.
    const isRetryable = res.status >= 500 || (res.status === 400 && attempt < maxRetries);
    if (attempt === maxRetries || !isRetryable) {
      throw new Error(message);
    }

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
  }

  throw new Error("Invalid credentials");
}

/**
 * Fetch the currently authenticated Flux user.
 * Requires a valid Bearer access token.
 */
export async function fluxGetMe(accessToken: string): Promise<FluxUser> {
  return fluxFetch<FluxUser>("/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/**
 * Check whether a given email or username already exists on Flux.
 * We attempt a login with a dummy password – Flux returns 401 for valid
 * credentials-wrong-password and 400/422 for missing user.
 *
 * A cleaner approach is to rely on the signup endpoint's duplicate check.
 * This helper is kept for explicit checks if needed elsewhere.
 */
export async function fluxCheckDuplicate(
  email: string,
  username: string
): Promise<{ emailTaken: boolean; usernameTaken: boolean }> {
  // Try signup with a dummy password to see which field conflicts
  let emailTaken = false;
  let usernameTaken = false;

  try {
    await fluxFetch("/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        username,
        full_name: "check",
        password: "dummy_check_password_123",
      }),
    });
  } catch (err: any) {
    const msg = err.message.toLowerCase();
    if (msg.includes("email")) emailTaken = true;
    if (msg.includes("username")) usernameTaken = true;
  }

  return { emailTaken, usernameTaken };
}

/**
 * Return the Google OAuth login redirect URL.
 * @param next - Optional URL to redirect to after OAuth completes (e.g., ping-pong callback)
 */
export function fluxGoogleLoginUrl(next?: string): string {
  let url = `${FLUX_API_BASE}/auth/google/login`;
  if (next) {
    url += `?next=${encodeURIComponent(next)}`;
  }
  return url;
}

/**
 * Return the full callback URL for ping-pong's OAuth callback route.
 */
export function fluxOAuthCallbackUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/api/auth/callback`;
}
