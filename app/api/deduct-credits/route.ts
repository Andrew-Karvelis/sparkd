import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface DeductRequestBody {
  amount: number
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    const body: DeductRequestBody = await req.json()
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { credits: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.credits < body.amount) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { credits: user.credits - body.amount }
    })

    return NextResponse.json({ credits: updatedUser.credits })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 })
  }
}
