import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { authRateLimit, getClientIP } from '@/lib/rate-limit'

export const runtime = 'nodejs' 

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

export async function POST(request: NextRequest) {
  try {
    // レートリミットチェック
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
          },
        }
      )
    }

    // リクエストバリデーション
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // パスワード検証
    const isValidPassword = await AuthService.verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // トークン生成
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = AuthService.generateAccessToken(payload)
    const refreshToken = AuthService.generateRefreshToken(payload)

    // Refresh TokenをDB保存
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日後
      },
    })

    // レスポンス組立
    const response = NextResponse.json(
      JSON.stringify({
         user: {
           id: user.id,
           email: user.email,
           name: user.name,
           role: user.role,
         },
         accessToken,
       }),
       {
         status: 200,
         headers: {
           'Content-Type': 'application/json',
         },
       }
     )

     AuthService.setAuthCookies(response, { accessToken, refreshToken })

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
      { error: 'ログインに失敗しました。もう一度お試しください。' },
      { status: 500 }
    )
  }
}

