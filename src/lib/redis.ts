import { createClient } from 'redis'

// Create a singleton Redis client
class RedisManager {
  private static instance: RedisManager
  private client: ReturnType<typeof createClient> | null = null
  private isConnecting = false
  
  private constructor() {}
  
  static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager()
    }
    return RedisManager.instance
  }
  
  async getClient(): Promise<ReturnType<typeof createClient> | null> {
    // Skip Redis in Edge Runtime
    if (typeof EdgeRuntime !== 'undefined') {
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
    
    try {
      this.isConnecting = true
      
      if (!this.client) {
        this.client = createClient({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
          socket: {
            connectTimeout: 5000,
            reconnectStrategy: (retries: number) => {
              if (retries > 3) {
                console.warn('Redis connection failed after 3 retries')
                return null
              }
              return Math.min(retries * 100, 500)
            },
          },
        })
        
        this.client.on('error', (err) => {
          console.error('Redis Client Error:', err)
        })
        
        this.client.on('connect', () => {
          console.log('Redis Client Connected')
        })
      }
      
      if (!this.client.isOpen) {
        await this.client.connect()
      }
      
      return this.client
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      return null
    } finally {
      this.isConnecting = false
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.disconnect()
    }
  }
}

// Export a wrapper object that provides Redis-like interface
export const redis = {
  async get(key: string): Promise<string | null> {
    const client = await RedisManager.getInstance().getClient()
    if (!client) return null
    return client.get(key)
  },
  
  async set(key: string, value: string): Promise<void> {
    const client = await RedisManager.getInstance().getClient()
    if (!client) return
    await client.set(key, value)
  },
  
  async setEx(key: string, seconds: number, value: string): Promise<void> {
    const client = await RedisManager.getInstance().getClient()
    if (!client) return
    await client.setEx(key, seconds, value)
  },
  
  async del(key: string): Promise<void> {
    const client = await RedisManager.getInstance().getClient()
    if (!client) return
    await client.del(key)
  },
  
  async incr(key: string): Promise<number> {
    const client = await RedisManager.getInstance().getClient()
    if (!client) return 1
    return client.incr(key)
  },
  
  async expire(key: string, seconds: number): Promise<void> {
    const client = await RedisManager.getInstance().getClient()
    if (!client) return
    await client.expire(key, seconds)
  },
}
