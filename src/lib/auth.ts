import jwt, { SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { TokenPayload, AuthTokens } from '@/types'

export class AuthService {
  private static JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
  private static ACCESS_TOKEN_EXPIRES_IN = '15m'
  private static REFRESH_TOKEN_EXPIRES_IN = '7d'

  // Password utilities
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10
    return bcrypt.hash(password, saltRounds)
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  // Token generation
  static generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    const options: SignOptions = { expiresIn: this.ACCESS_TOKEN_EXPIRES_IN }
    return jwt.sign(payload, this.JWT_SECRET, options)
  }

  static generateRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    const options: SignOptions = { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
    return jwt.sign(payload, this.JWT_SECRET, options)
  }

  // Token verification
  static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as TokenPayload
    } catch (error) {
      console.error('Token verification failed:', error)
      return null
    }
  }

  // Get current user from request
  static async getCurrentUser(request: Request): Promise<TokenPayload | null> {
    try {
      const token = this.extractTokenFromRequest(request)
      if (!token) return null

      return this.verifyToken(token)
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  // Extract token from request headers or cookies
  private static extractTokenFromRequest(request: Request): string | null {
    // Try Authorization header first
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7)
    }

    // Fallback to cookies
    const cookieHeader = request.headers.get('cookie') || ''
    const match = cookieHeader.match(/accessToken=([^;]+)/)
    return match ? decodeURIComponent(match[1]) : null
  }

  // Cookie management
  static setAuthCookies(response: NextResponse, tokens: AuthTokens): void {
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' as const : 'lax' as const,
      path: '/',
    }

    // Set access token cookie (15 minutes)
    response.cookies.set('accessToken', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 minutes
    })
    
    // Set refresh token cookie (7 days)
    response.cookies.set('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })
  }

  static clearAuthCookies(response: NextResponse): void {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
      path: '/',
    }

    response.cookies.set('accessToken', '', { ...cookieOptions, maxAge: 0 })
    response.cookies.set('refreshToken', '', { ...cookieOptions, maxAge: 0 })
  }

  // Permission checks
  static hasRole(user: TokenPayload | null, roles: string[]): boolean {
    return user ? roles.includes(user.role) : false
  }

  static isAdmin(user: TokenPayload | null): boolean {
    return this.hasRole(user, ['ADMIN', 'SUPER_ADMIN'])
  }

  static isSuperAdmin(user: TokenPayload | null): boolean {
    return this.hasRole(user, ['SUPER_ADMIN'])
  }

  // Generate new token pair
  static generateTokenPair(payload: Omit<TokenPayload, 'iat' | 'exp'>): AuthTokens {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    }
  }
}
