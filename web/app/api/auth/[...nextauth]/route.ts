import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // Register or login user via our API
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/google`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                googleId: account.providerAccountId,
                avatar: user.image,
              }),
            }
          );
          const data = await res.json();
          if (data.success) {
            user.apiToken = data.token;
            user.apiUser = data.user;
            return true;
          }
          return false;
        } catch {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.apiToken) {
        token.apiToken = user.apiToken;
        token.apiUser = user.apiUser;
      }
      return token;
    },
    async session({ session, token }) {
      session.apiToken = token.apiToken as string;
      session.apiUser = token.apiUser;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };