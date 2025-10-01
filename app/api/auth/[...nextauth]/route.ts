import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {

        console.log('Login attempt:', credentials?.email);

        if (!credentials) return null

        const email = credentials.email.toLowerCase().trim()
        const user = await prisma.user.findUnique({ where: { email } })
        console.log('User from DB:', user);
        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        console.log('Password valid?', isValid);
        console.log("Credentials.password:", JSON.stringify(credentials.password))
        console.log("Stored hash:", user.password)

        if (!isValid) return null


        const { password: _pwd, ...userWithoutPassword } = user
        return userWithoutPassword
      }
    })
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/login' }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
