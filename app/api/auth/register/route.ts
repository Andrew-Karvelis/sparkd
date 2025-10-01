import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

interface RegisterRequest {
  name: string
  email: string
  password: string
}

export async function POST(req: Request) {
  try {
    const body: RegisterRequest = await req.json()
    const { name, email, password } = body

    if (!email || !password || !name) {
      console.error('❌ Missing field:', { name, email, password })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      console.error('❌ User already exists:', email)
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log('Hashed password:', hashedPassword)

    let newUser;
    try {

      newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          credits: 3 // starting credits
        }
      })
    } catch (err) {
      console.error('Prisma create error:', err)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    console.log('✅ New user created:', newUser.id, newUser.email)

    return NextResponse.json({ success: true, userId: newUser.id })
  } catch (err: any) {
    console.error('🔥 Registration error:', err.message, err.stack)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
