import { redisService } from './redis'

export interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export class RateLimiter {
  private options: RateLimitOptions

  constructor(options: RateLimitOptions) {
    this.options = options
  }

  async checkLimit(identifier: string): Promise<{
    allowed: boolean
    remaining: number
    resetTime: Date
    total: number
  }> {
    const key = `rate_limit:${identifier}`
    const window = Math.floor(Date.now() / this.options.windowMs)
    const windowKey = `${key}:${window}`

    try {
      // Get current count for this window
      const current = await redis.get(windowKey)
      const count = current ? parseInt(current) : 0

      if (count >= this.options.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date((window + 1) * this.options.windowMs),
          total: this.options.maxRequests,
        }
      }

      // Increment counter
      const newCount = await redis.incr(windowKey)
      
      // Set expiration for the window
      if (newCount === 1) {
        await redis.expire(windowKey, Math.ceil(this.options.windowMs / 1000))
      }

      return {
        allowed: true,
        remaining: this.options.maxRequests - newCount,
        resetTime: new Date((window + 1) * this.options.windowMs),
        total: this.options.maxRequests,
      }
    } catch (error) {
      console.error('Rate limiting error:', error)
      // If Redis is down, allow the request
      return {
        allowed: true,
        remaining: this.options.maxRequests - 1,
        resetTime: new Date(Date.now() + this.options.windowMs),
        total: this.options.maxRequests,
      }
    }
  }
}

// Default rate limiters for different endpoints
export const authRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
})

export const generalApiRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute per IP
})

export const uploadRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 uploads per minute
})

// Helper function to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}