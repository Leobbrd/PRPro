import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      })
    }

    const response = NextResponse.json({ message: 'ログアウトしました' })
    
    // Clear cookies directly on the response
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