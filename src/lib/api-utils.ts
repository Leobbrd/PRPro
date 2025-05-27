import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { AuthService } from './auth'
import { APIResponse, TokenPayload } from '@/types'

// Error classes
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class ValidationError extends APIError {
  constructor(message: string, public fields?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends APIError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

// API wrapper utility
export function withAPI<T = any>(
  handler: (request: NextRequest, user: TokenPayload | null) => Promise<T>
) {
  return async (request: NextRequest): Promise<NextResponse<APIResponse<T>>> => {
    try {
      // Get current user (optional for some endpoints)
      const user = await AuthService.getCurrentUser(request)
      
      // Execute handler
      const result = await handler(request, user)
      
      return NextResponse.json({ data: result })
    } catch (error) {
      return handleAPIError(error)
    }
  }
}

// API wrapper with required auth
export function withAuthAPI<T = any>(
  handler: (request: NextRequest, user: TokenPayload) => Promise<T>,
  requiredRoles?: string[]
) {
  return async (request: NextRequest): Promise<NextResponse<APIResponse<T>>> => {
    try {
      // Get current user (required)
      const user = await AuthService.getCurrentUser(request)
      if (!user) {
        throw new UnauthorizedError()
      }

      // Check role permissions if specified
      if (requiredRoles && !requiredRoles.includes(user.role)) {
        throw new ForbiddenError('Insufficient permissions')
      }
      
      // Execute handler
      const result = await handler(request, user)
      
      return NextResponse.json({ data: result })
    } catch (error) {
      return handleAPIError(error)
    }
  }
}

// Error handler
export function handleAPIError(error: unknown): NextResponse<APIResponse> {
  console.error('API Error:', error)

  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    )
  }

  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {}
    error.errors.forEach((err) => {
      const field = err.path.join('.')
      if (!fieldErrors[field]) fieldErrors[field] = []
      fieldErrors[field].push(err.message)
    })

    return NextResponse.json(
      { 
        error: 'Validation failed',
        fields: fieldErrors 
      },
      { status: 400 }
    )
  }

  // Generic server error
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}

// Validation utilities
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  try {
    return schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Validation failed', 
        error.errors.reduce((acc, err) => {
          const field = err.path.join('.')
          if (!acc[field]) acc[field] = []
          acc[field].push(err.message)
          return acc
        }, {} as Record<string, string[]>)
      )
    }
    throw error
  }
}

export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): T {
  const params = Object.fromEntries(searchParams.entries())
  return validateBody(schema, params)
}

// Rate limiting helper
export function withRateLimit(
  rateLimiter: any,
  identifier: (request: NextRequest) => string
) {
  return async (request: NextRequest) => {
    const id = identifier(request)
    const result = await rateLimiter.checkLimit(id)

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          resetTime: result.resetTime.toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.total.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toISOString(),
          },
        }
      )
    }

    return result
  }
}

// Pagination helper
export interface PaginationOptions {
  page: number
  limit: number
  maxLimit?: number
}

export function normalizePagination(
  page: number = 1,
  limit: number = 20,
  maxLimit: number = 100
): PaginationOptions {
  return {
    page: Math.max(1, page),
    limit: Math.min(Math.max(1, limit), maxLimit),
    maxLimit,
  }
}

export function getPaginationData(
  page: number,
  limit: number,
  total: number
) {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    skip: (page - 1) * limit,
    hasNext: page * limit < total,
    hasPrev: page > 1,
  }
}

// Response helpers
export function successResponse<T>(data: T, message?: string): APIResponse<T> {
  return { data, message }
}

export function errorResponse(error: string, statusCode: number = 500): APIResponse {
  return { error }
}

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export const idSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
})

export const emailSchema = z.string().email('Invalid email address')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')