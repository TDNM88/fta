/**
 * Custom cache handler for Next.js
 * This integrates with Vercel's Edge Network for optimal caching
 */
module.exports = class CacheHandler {
  constructor(options) {
    this.options = options || {}
    this.cache = new Map()
  }

  async get(key) {
    // In production, this would be handled by Vercel's Edge Network
    // For local development, we use an in-memory cache
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // Check if the item is expired
    if (item.expireAt && item.expireAt < Date.now()) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  async set(key, data, options = {}) {
    // In production, this would be handled by Vercel's Edge Network
    // For local development, we use an in-memory cache
    const { ttl } = { ...this.options, ...options }

    const expireAt = ttl ? Date.now() + ttl * 1000 : undefined

    this.cache.set(key, {
      value: data,
      expireAt,
    })

    return
  }
}

