import { createClient } from 'redis'

const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createClient> | undefined
}

export const redis =
  globalForRedis.redis ??
  createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      connectTimeout: 10000,
      lazyConnect: true,
    },
    retryStrategy: (times) => Math.min(times * 50, 2000)
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

redis.on('error', (err) => {
  console.error('Redis connection error:', err)
})

redis.on('connect', () => {
  console.log('Redis connected successfully')
})

redis.on('reconnecting', () => {
  console.log('Redis reconnecting...')
})

// Connect only when needed
export const connectRedis = async () => {
  if (!redis.isOpen) {
    try {
      await redis.connect()
      console.log('Redis connection established')
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      throw error
    }
  }
  return redis
}