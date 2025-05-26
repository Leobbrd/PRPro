#!/bin/bash
# Auth修正
cat > src/lib/auth.ts << 'AUTHEOF'
import jwt, { SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export interface TokenPayload {
  userId: string
  email: string
  role: string
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
}
AUTHEOF

# userId修正
find src -name "*.tsx" -exec sed -i '' 's/user?.userId/user?.id/g' {} \;

npm run typecheck


