import { useState, useEffect } from 'react'
import { apiGet } from '../api/client'
import type { AnalyticsOverviewDto } from '../api/contract'

/**
 * Fetches analytics overview data from GET /api/v1/analytics/overview.
 *
 * Currency fields (totalRevenue, avgBookingValue, revenueByDay[].revenue,
 * topServices[].revenue) are pre-formatted strings from the backend —
 * render them directly without adding "$" or calling toFixed().
 *
 * Use revenueByDay[].revenueRaw and topServices[].revenueRaw for
 * Recharts dataKey values (numeric, for axis scaling).
 */
export function useAnalytics(
  businessId: string | null | undefined,
  from?: string,
  to?: string,
) {
  const [data,    setData]    = useState<AnalyticsOverviewDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!businessId) return

    const params = new URLSearchParams({ businessId })
    if (from) params.set('from', from)
    if (to)   params.set('to',   to)

    setLoading(true)
    setError(null)

    apiGet<AnalyticsOverviewDto>(`/analytics/overview?${params}`)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [businessId, from, to])

  return { data, loading, error }
}
