import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth' // your NextAuth config
import { prisma } from '@/lib/prisma' // your Prisma client

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { credits: true, id: true, name: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ credits: user.credits, name: user.name })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
