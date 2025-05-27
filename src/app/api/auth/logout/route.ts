import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      })
    }

    // Create response
    const response = NextResponse.json({ message: 'ログアウトしました' })

    // Clear auth cookies
    response.cookies.delete('accessToken')
    response.cookies.delete('refreshToken')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'ログアウトに失敗しました' },
      { status: 500 }
    )
  }
}
