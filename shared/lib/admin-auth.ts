import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

const ADMIN_SESSION_COOKIE = "rioanime-admin-session";

export type AdminAccount = {
  id: string;
  email: string;
  username: string;
  role: "admin";
};

type AdminSession = {
  accountId: string;
  expiresAt: number;
};

async function verifyGoogleAdminIdentity(email: string): Promise<AdminAccount | null> {
  const apiUrl = process.env.RIOANIME_API_URL ?? "https://api.rioanime.deze.me";
  const apiKey = process.env.RIOANIME_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch(`${apiUrl}/v1/auth/admin-identity`, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
      headers: {
        Accept: "application/json",
        "X-RioAnime-Key": apiKey,
        "X-RioAnime-User-Email": encodeURIComponent(email)
      }
    });
    if (!response.ok) return null;
    const result = await response.json() as { account?: AdminAccount };
    return result.account ?? null;
  } catch {
    return null;
  }
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret || null;
}

function createSessionValue(session: AdminSession) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured");
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readSessionValue(value: string | undefined): AdminSession | null {
  const secret = getSessionSecret();
  if (!secret || !value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (!safeEqual(signature, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as AdminSession;
    return session.accountId && session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export async function verifyAdminCredentials(email: string, password: string) {
  const apiUrl = process.env.RIOANIME_API_URL ?? "https://api.rioanime.deze.me";
  const apiKey = process.env.RIOANIME_API_KEY;
  if (!apiKey) throw new Error("RIOANIME_API_KEY is not configured");

  const response = await fetch(`${apiUrl}/v1/auth/admin-login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-RioAnime-Key": apiKey
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store"
  });
  if (!response.ok) return null;
  const result = await response.json() as { account: AdminAccount };
  return result.account;
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const passwordSession = readSessionValue(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (passwordSession) return passwordSession;

  const googleSession = await auth();
  const email = googleSession?.user?.email?.trim().toLowerCase();
  if (!email) return null;
  const account = await verifyGoogleAdminIdentity(email);
  return account ? { accountId: account.id, expiresAt: Date.now() + 60_000 } : null;
}

export async function isAdminAuthenticated() {
  return Boolean(await getAdminSession());
}

export async function requireAdminAuthentication() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }
}

async function setAdminSession(account: AdminAccount, persistent: boolean) {
  const lifetime = persistent ? 60 * 60 * 24 * 30 : 60 * 60 * 12;
  const sessionValue = createSessionValue({ accountId: account.id, expiresAt: Date.now() + lifetime * 1000 });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(persistent ? { maxAge: lifetime } : {})
  });
}

export function createAdminSession(account: AdminAccount) {
  return setAdminSession(account, false);
}

export function createPersistentAdminSession(account: AdminAccount) {
  return setAdminSession(account, true);
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
