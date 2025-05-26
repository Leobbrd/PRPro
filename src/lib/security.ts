import { NextResponse } from 'next/server'

export interface SecurityHeaders {
  'Content-Security-Policy'?: string
  'X-Frame-Options'?: string
  'X-Content-Type-Options'?: string
  'Referrer-Policy'?: string
  'Permissions-Policy'?: string
  'Strict-Transport-Security'?: string
  'X-XSS-Protection'?: string
}

export class SecurityService {
  static getSecurityHeaders(): SecurityHeaders {
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    return {
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for React
        "style-src 'self' 'unsafe-inline'", // Allow inline styles for Tailwind
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https:",
        "media-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        isDevelopment ? "upgrade-insecure-requests" : '',
      ].filter(Boolean).join('; '),

      // Prevent clickjacking
      'X-Frame-Options': 'DENY',

      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',

      // Control referrer information
      'Referrer-Policy': 'strict-origin-when-cross-origin',

      // Control browser features
      'Permissions-Policy': [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'interest-cohort=()',
      ].join(', '),

      // Force HTTPS in production
      ...(isDevelopment ? {} : {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      }),

      // XSS Protection (legacy)
      'X-XSS-Protection': '1; mode=block',
    }
  }

  static applySecurityHeaders(response: NextResponse): NextResponse {
    const headers = this.getSecurityHeaders()
    
    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        response.headers.set(key, value)
      }
    })

    return response
  }

  static createSecureResponse(data: any, status = 200): NextResponse {
    const response = NextResponse.json(data, { status })
    return this.applySecurityHeaders(response)
  }

  static sanitizeInput(input: string): string {
    // Basic HTML entity encoding
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static isStrongPassword(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('パスワードは8文字以上である必要があります')
    }

    if (!/[a-zA-Z]/.test(password)) {
      errors.push('パスワードには英字を含める必要があります')
    }

    if (!/\d/.test(password)) {
      errors.push('パスワードには数字を含める必要があります')
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('パスワードには記号を含める必要があります')
    }

    // Check for common patterns
    const commonPatterns = [
      /(.)\1{2,}/, // Same character repeated 3+ times
      /123456/, // Sequential numbers
      /abcdef/, // Sequential letters
      /qwerty/, // Common keyboard patterns
      /password/i, // The word "password"
    ]

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('パスワードに一般的なパターンが含まれています')
        break
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  static generateCSRFToken(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15)
  }

  static validateFileUpload(file: File, allowedTypes: string[], maxSize: number): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Check file size
    if (file.size > maxSize) {
      errors.push(`ファイルサイズが上限（${maxSize / 1024 / 1024}MB）を超えています`)
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`許可されていないファイルタイプです。許可されているタイプ: ${allowedTypes.join(', ')}`)
    }

    // Check for malicious file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js']
    const fileName = file.name.toLowerCase()
    
    for (const ext of dangerousExtensions) {
      if (fileName.endsWith(ext)) {
        errors.push('危険なファイル拡張子が検出されました')
        break
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}