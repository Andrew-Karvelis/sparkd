// next-auth.d.ts or inside this file at the top
import NextAuth, { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    credits?: number
  }
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id?: string
      credits?: number
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    credits?: number
  }
}
