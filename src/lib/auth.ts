import jwt, { SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export interface TokenPayload {
  userId: string
  email: string
  role: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export class AuthService {
  private static JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  static generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: '15m' }
    return jwt.sign(payload, this.JWT_SECRET, options)
  }

  static generateRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: '7d' }
    return jwt.sign(payload, this.JWT_SECRET, options)
  }

  static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as TokenPayload
    } catch (error) {
      return null
    }
  }

  static async getCurrentUser(request: Request): Promise<TokenPayload | null> {
    try {
      // Try to get token from Authorization header
      const authHeader = request.headers.get('authorization')
      let token: string | null = null
      
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7)
      } else {
        // Try to get token from cookies
        const cookieStore = cookies()
        token = cookieStore.get('accessToken')?.value || null
      }
      
      if (!token) {
        return null
      }
      
      return this.verifyToken(token)
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  static setAuthCookies(response: NextResponse, tokens: AuthTokens): void {
    // Set access token cookie (15 minutes)
    response.cookies.set('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes in seconds
      path: '/'
    })
    
    // Set refresh token cookie (7 days)
    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/'
    })
  }

  static clearAuthCookies(response: NextResponse): void {
    response.cookies.delete('accessToken')
    response.cookies.delete('refreshToken')
  }
}
