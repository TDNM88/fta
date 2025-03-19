import { NextResponse } from "next/server"

export async function GET() {
  // Basic health check information
  const healthcheck = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
  }

  // You can add more detailed health checks here
  // For example, checking database connectivity

  return NextResponse.json(healthcheck, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  })
}

