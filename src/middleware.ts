import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const protectedRoutes = ['/dashboard', '/projects', '/admin']
const authRoutes = ['/auth/login', '/auth/register']
const publicApiRoutes = ['/api/auth/', '/api/project/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Note: Rate limiting moved to individual API routes due to Edge Runtime limitations
  
  const user = await getTokenFromRequest(request)

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
    // Allow public API routes
    if (publicApiRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

// Edge Runtime compatible JWT verification
async function getTokenFromRequest(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    let token: string | null = null
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    } else {
      // Get token from cookies
      token = request.cookies.get('accessToken')?.value || null
    }
    
    if (!token) return null
    
    // Verify token using jose (Edge Runtime compatible)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    
    return payload
  } catch {
    return null
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
