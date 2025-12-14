import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email : undefined;
        const password = typeof credentials?.password === "string" ? credentials.password : undefined;

        if (!email || !password) return null;

        const user = (await prisma.user.findUnique({
          where: { email },
        })) as unknown as {
          id: string;
          email: string;
          name: string;
          passwordHash?: string | null;
        } | null;

        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        const existing = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });

        const dbUserId =
          existing?.id ??
          (
            await prisma.user.create({
              data: {
                email,
                name: user.name ?? "",
                image: user.image ?? null,
                emailVerified: true,
              },
              select: { id: true },
            })
          ).id;

        if (account.providerAccountId) {
          await prisma.account.upsert({
            where: {
              providerId_accountId: {
                providerId: account.provider,
                accountId: account.providerAccountId,
              },
            },
            create: {
              userId: dbUserId,
              providerId: account.provider,
              accountId: account.providerAccountId,
              accessToken: account.access_token ?? null,
              refreshToken: account.refresh_token ?? null,
              scope: account.scope ?? null,
              idToken: account.id_token ?? null,
            },
            update: {
              userId: dbUserId,
              accessToken: account.access_token ?? undefined,
              refreshToken: account.refresh_token ?? undefined,
              scope: account.scope ?? undefined,
              idToken: account.id_token ?? undefined,
            },
          });
        }

        (user as { id?: string }).id = dbUserId;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      if (user?.email) token.email = user.email;
      if (user?.name) token.name = user.name;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub ?? "";
        session.user.email = (token.email as string | null | undefined) ?? session.user.email;
        session.user.name = (token.name as string | null | undefined) ?? session.user.name;
      }
      return session;
    },
  },
});
