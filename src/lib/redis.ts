import { createClient } from 'redis'

class RedisService {
  private client: ReturnType<typeof createClient> | null = null
  private isConnecting = false

  async getClient(): Promise<ReturnType<typeof createClient> | null> {
    // Skip Redis in Edge Runtime
    if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge') {
      return null
    }

    // Skip Redis in browser
    if (typeof window !== 'undefined') {
      return null
    }

    // Return existing client if connected
    if (this.client?.isReady) {
      return this.client
    }

    // Prevent multiple connection attempts
    if (this.isConnecting) {
      return null
    }

    this.isConnecting = true

    try {
      this.client = createClient({
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD,
      })

      this.client.on('error', (err) => {
        console.error('Redis Client Error', err)
      })

      await this.client.connect()
      return this.client
    } finally {
      this.isConnecting = false
    }
  }

  async get(key: string): Promise<string | null> {
    const client = await this.getClient()
    if (!client) return null
    return client.get(key)
  }

  async set(key: string, value: string): Promise<void> {
    const client = await this.getClient()
    if (!client) return
    await client.set(key, value)
  }

  async del(key: string): Promise<void> {
    const client = await this.getClient()
    if (!client) return
    await client.del(key)
  }
}

export const redisService = new RedisService()

