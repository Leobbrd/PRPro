import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { authRateLimit, getClientIP } from '@/lib/rate-limit'

const registerSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  name: z.string().min(1, '名前を入力してください'),
})

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const limitResult = await authRateLimit.checkLimit(clientIP)

    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          error: '登録試行回数が上限に達しました。しばらく待ってから再試行してください。',
          resetTime: limitResult.resetTime.toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limitResult.total.toString(),
            'X-RateLimit-Remaining': limitResult.remaining.toString(),
            'X-RateLimit-Reset': limitResult.resetTime.toISOString(),
          },
        }
      )
    }

    const body = await request.json()
    const { email, password, name } = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 409 }
      )
    }

    const passwordHash = await AuthService.hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'USER',
      },
    })

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = AuthService.generateAccessToken(payload)
    const refreshToken = AuthService.generateRefreshToken(payload)

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
    })

    AuthService.setAuthCookies(response, { accessToken, refreshToken })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'ユーザー登録に失敗しました。' },
      { status: 500 }
    )
  }
}

