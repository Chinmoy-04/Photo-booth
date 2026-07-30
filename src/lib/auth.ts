export const ACCESS_COOKIE_NAME = "site_access";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getCookieSecret(): string {
  const secret = process.env.SITE_COOKIE_SECRET;
  if (!secret) {
    throw new Error("SITE_COOKIE_SECRET is not configured");
  }
  return secret;
}

export function getSitePassphrase(): string | undefined {
  const value = process.env.SITE_PASSPHRASE?.trim();
  if (!value || value === "your-secret-passphrase-here") {
    return undefined;
  }
  return value;
}

async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function signAccessToken(): Promise<string> {
  const secret = getCookieSecret();
  const payload = `granted:${Date.now()}`;
  const signature = await hmacSha256(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifyAccessToken(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;

  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);

  if (!payload.startsWith("granted:")) return false;

  try {
    const secret = getCookieSecret();
    const expected = await hmacSha256(payload, secret);
    return timingSafeEqual(signature, expected);
  } catch {
    return false;
  }
}

export function buildAccessCookieHeader(token: string): string {
  // Secure on HTTPS (production or tunnels); required for phones over cloudflared
  const secure =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1"
      ? "; Secure"
      : "";
  return `${ACCESS_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${secure}`;
}

export function buildClearAccessCookieHeader(): string {
  const secure =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1"
      ? "; Secure"
      : "";
  return `${ACCESS_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function isPassphraseValid(candidate: string): boolean {
  const expected = getSitePassphrase();
  if (!expected) return false;
  return timingSafeEqual(candidate, expected);
}
