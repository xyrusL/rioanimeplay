import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const API_URL = process.env.RIOANIME_API_URL ?? "https://api.rioanime.deze.me";

async function syncGoogleMember(name: string, email: string) {
  const apiKey = process.env.RIOANIME_API_KEY;
  if (!apiKey) return;

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
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
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
        await syncGoogleMember(user.name?.trim() || email.split("@")[0], email);
      } catch (cause) {
        console.error("RioAnime Google member sync failed", cause);
      }

      return true;
    }
  },
  trustHost: true
});
