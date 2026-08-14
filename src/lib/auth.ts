import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const cleanEmail = (credentials.email as string).trim().toLowerCase();
          const rawPassword = (credentials.password as string).trim();

          const user = await prisma.user.findUnique({
            where: { email: cleanEmail },
          });

          if (!user) {
            console.warn("Authorize: User not found for email:", cleanEmail);
            return null;
          }

          // 1. Exact match check
          let passwordMatch = bcrypt.compareSync(rawPassword, user.password);

          // 2. Case-insensitive fallback check (e.g. Batubata22 vs batubata22)
          if (!passwordMatch && rawPassword !== rawPassword.toLowerCase()) {
            passwordMatch = bcrypt.compareSync(rawPassword.toLowerCase(), user.password);
          }

          if (!passwordMatch) {
            console.warn("Authorize: Password mismatch for email:", cleanEmail);
            return null;
          }

          console.log("Authorize Success for user:", cleanEmail);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (err) {
          console.error("Authorize Exception:", err);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "threadinery-dev-secret-change-in-production",
});
