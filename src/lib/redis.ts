import { createClient } from 'redis'

const isEdgeRuntime = typeof EdgeRuntime !== 'undefined'

declare global {
  var __redis: ReturnType<typeof createClient> | undefined
}

let redis: ReturnType<typeof createClient> | null = null

if (!isEdgeRuntime && typeof window === 'undefined') {
  try {
    if (!global.__redis) {
      global.__redis = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 10000,
          reconnectStrategy: (retries: number) => Math.min(retries * 50, 2000),
        },
      })
    }
    redis = global.__redis
  } catch (error) {
    console.warn('Redis connection failed:', error)
    redis = null
  }
}

export { redis }
