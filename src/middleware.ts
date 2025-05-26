import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { generalApiRateLimit, authRateLimit, getClientIP } from '@/lib/rate-limit'

const protectedRoutes = ['/dashboard', '/projects', '/admin']
const authRoutes = ['/auth/login', '/auth/register']
const authApiRoutes = ['/api/auth/login', '/api/auth/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const clientIP = getClientIP(request)

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    let rateLimiter = generalApiRateLimit
    
    // Use stricter rate limiting for auth endpoints
    if (authApiRoutes.includes(pathname)) {
      rateLimiter = authRateLimit
    }

    const limitResult = await rateLimiter.checkLimit(clientIP)
    
    if (!limitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
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

    // Add rate limit headers to response
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', limitResult.total.toString())
    response.headers.set('X-RateLimit-Remaining', limitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', limitResult.resetTime.toISOString())
  }

  const user = AuthService.getCurrentUser(request)

  // Handle auth routes
  if (authRoutes.includes(pathname)) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Handle protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return NextResponse.next()
  }

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/auth/')) {
      return NextResponse.next()
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}