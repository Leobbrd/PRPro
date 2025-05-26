import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { authRateLimit, getClientIP } from '@/lib/rate-limit'

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIP = getClientIP(request)
    const limitResult = await authRateLimit.checkLimit(clientIP)
    
    if (!limitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'ログイン試行回数が上限に達しました。しばらく待ってから再試行してください。',
          resetTime: limitResult.resetTime.toISOString(),
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limitResult.total.toString(),
            'X-RateLimit-Remaining': limitResult.remaining.toString(),
            'X-RateLimit-Reset': limitResult.resetTime.toISOString(),
          }
        }
      )
    }

    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    const isValidPassword = await AuthService.verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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

    // Set cookies directly on the response
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    })

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    )
  }
}