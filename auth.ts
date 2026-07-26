import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { cookies } from "next/headers";

const API_URL = process.env.RIOANIME_API_URL ?? "https://api.rioanime.dezely.com";

async function syncGoogleMember(name: string, email: string) {
  const apiKey = process.env.RIOANIME_API_KEY;
  if (!apiKey) throw new Error("RIOANIME_API_KEY is not configured");

  const response = await fetch(`${API_URL}/v1/user/sync`, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
    headers: {
      Accept: "application/json",
      "X-RioAnime-Key": apiKey,
      "X-RioAnime-User-Email": encodeURIComponent(email),
      "X-RioAnime-User-Name": encodeURIComponent(name)
    }
  });

  if (!response.ok) {
    throw new Error(`Member sync failed with status ${response.status}`);
  }
  const payload = await response.json() as { created?: boolean };
  return payload.created === true;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google({ authorization: { params: { prompt: "select_account" } } })],
  pages: {
    signIn: "/account",
    error: "/account"
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async signIn({ account, user }) {
      const email = user.email?.trim().toLowerCase();
      if (account?.provider !== "google" || !email) return false;

      try {
        const created = await syncGoogleMember(user.name?.trim() || email.split("@")[0], email);
        if (created) {
          const cookieStore = await cookies();
          cookieStore.set("rioanime-new-member", "1", {
            maxAge: 300,
            path: "/account",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
          });
        }
      } catch (cause) {
        console.error("RioAnime Google member sync failed", cause);
        return false;
      }

      return true;
    }
  },
  trustHost: true
});
