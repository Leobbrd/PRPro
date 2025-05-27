import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie instead of body
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'リフレッシュトークンが必要です' },
        { status: 401 }
      )
    }

    // Verify refresh token format
    const payload = AuthService.verifyToken(refreshToken)
    if (!payload) {
      return NextResponse.json(
        { error: '無効なリフレッシュトークンです' },
        { status: 401 }
      )
    }

    // Check if refresh token exists in database and is not expired
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // Clean up expired token
      if (storedToken) {
        await prisma.refreshToken.delete({
          where: { token: refreshToken },
        })
      }
      
      return NextResponse.json(
        { error: '期限切れまたは無効なリフレッシュトークンです' },
        { status: 401 }
      )
    }

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // Generate new tokens
    const newPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const newAccessToken = AuthService.generateAccessToken(newPayload)
    const newRefreshToken = AuthService.generateRefreshToken(newPayload)

    // Update refresh token in database
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    // Create response with new tokens
    const response = NextResponse.json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

    // Set new cookies
    AuthService.setAuthCookies(response, { 
      accessToken: newAccessToken, 
      refreshToken: newRefreshToken 
    })

    return response
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'トークンの更新に失敗しました' },
      { status: 500 }
    )
  }
}
