import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email'

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'トークンが必要です'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = verifyEmailSchema.parse(body)

    // Verify token and get email
    const email = await emailService.verifyEmailToken(token)
    if (!email) {
      return NextResponse.json(
        { error: '無効または期限切れのトークンです' },
        { status: 400 }
      )
    }

    // Update user's email verification status
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // For now, we'll add an emailVerified field to the user model in the future
    // This is a placeholder implementation
    return NextResponse.json({
      message: 'メールアドレスが正常に認証されました',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'メール認証に失敗しました' },
      { status: 500 }
    )
  }
}