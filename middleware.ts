import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// In-memory store for rate limiting
// In production, use Redis or another distributed store
const rateLimit = {
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  store: new Map<string, number>(),
}

export function middleware(request: NextRequest) {
  const ip = request.ip || "anonymous"

  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Skip rate limiting for health check endpoint
    if (request.nextUrl.pathname === "/api/health") {
      return NextResponse.next()
    }

    const now = Date.now()
    const windowStart = now - rateLimit.windowMs

    // Clean up old entries
    rateLimit.store.forEach((timestamp, key) => {
      if (timestamp < windowStart) {
        rateLimit.store.delete(key)
      }
    })

    // Get current count for this IP
    const count = rateLimit.store.get(ip) || 0

    // Check if rate limit exceeded
    if (count >= rateLimit.max) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests, please try again later.",
          retryAfter: 60,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        },
      )
    }

    // Update count
    rateLimit.store.set(ip, count + 1)

    // Add headers to response
    const response = NextResponse.next()
    response.headers.set("X-RateLimit-Limit", rateLimit.max.toString())
    response.headers.set("X-RateLimit-Remaining", (rateLimit.max - count - 1).toString())

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}

