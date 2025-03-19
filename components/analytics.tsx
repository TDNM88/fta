"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

type WebVitalsMetric = {
  id: string
  name: string
  startTime: number
  value: number
  label: "web-vital" | "custom"
}

const reportWebVitals = (metric: WebVitalsMetric) => {
  // Vercel Analytics or Google Analytics
  const url = "https://vitals.vercel-analytics.com/v1/vitals"
  const analyticsId = process.env.NEXT_PUBLIC_ANALYTICS_ID

  if (!analyticsId) {
    console.log("Analytics ID not found, skipping web vitals reporting")
    return
  }

  // Use `navigator.sendBeacon()` if available
  const body = {
    dsn: analyticsId,
    id: metric.id,
    page: window.location.pathname,
    href: window.location.href,
    event_name: metric.name,
    value: metric.value.toString(),
    speed:
      "connection" in navigator && navigator["connection"] && "effectiveType" in navigator["connection"]
        ? navigator["connection"]["effectiveType"]
        : "",
  }

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, JSON.stringify(body))
  } else {
    fetch(url, {
      body: JSON.stringify(body),
      method: "POST",
      keepalive: true,
    })
  }
}

export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Track page views
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")

    // Send to analytics service
    console.log(`Page view: ${url}`)

    // You would typically use something like:
    // window.gtag('config', 'GA-MEASUREMENT-ID', { page_path: url })
  }, [pathname, searchParams])

  useEffect(() => {
    // Report web vitals
    const onWebVitals = (metric: WebVitalsMetric) => {
      reportWebVitals(metric)
    }

    // Load web-vitals library dynamically
    import("web-vitals")
      .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(onWebVitals)
        getFID(onWebVitals)
        getFCP(onWebVitals)
        getLCP(onWebVitals)
        getTTFB(onWebVitals)
      })
      .catch((err) => {
        console.error("Failed to load web-vitals", err)
      })
  }, [])

  return null
}

