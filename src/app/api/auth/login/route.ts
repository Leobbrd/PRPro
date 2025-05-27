import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { authRateLimit, getClientIP } from '@/lib/rate-limit'
import { withAPI, validateBody, UnauthorizedError } from '@/lib/api-utils'
import { LoginCredentials, User } from '@/types'

export const runtime = 'nodejs'

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

export const POST = withAPI<{ user: User; accessToken: string }>(
  async (request: NextRequest) => {
    // Rate limit check
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

    // Validate request body
    const body = await request.json()
    const credentials = validateBody(loginSchema, body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    })

    if (!user) {
      throw new UnauthorizedError('メールアドレスまたはパスワードが正しくありません')
    }

    // Verify password
    const isValidPassword = await AuthService.verifyPassword(
      credentials.password,
      user.passwordHash
    )

    if (!isValidPassword) {
      throw new UnauthorizedError('メールアドレスまたはパスワードが正しくありません')
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const tokens = AuthService.generateTokenPair(tokenPayload)

    // Save refresh token to database
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    // Prepare response data
    const userData: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }

    const response = NextResponse.json({
      data: {
        user: userData,
        accessToken: tokens.accessToken,
      },
    })

    // Set auth cookies
    AuthService.setAuthCookies(response, tokens)

    return response
  }
)

