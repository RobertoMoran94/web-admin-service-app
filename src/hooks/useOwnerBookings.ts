import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiPatch } from '../api/client'
import type { OwnerBookingsPageDto, OwnerBookingItemDto, CancelBookingResponseDto } from '../api/contract'

interface Options {
  businessId: string | null | undefined
  from?: string
  to?: string
  status?: string
}

interface UseOwnerBookingsResult {
  bookings:      OwnerBookingItemDto[]
  totalItems:    number
  loading:       boolean
  error:         string | null
  cancelling:    boolean
  cancelBooking: (id: string) => Promise<void>
  refetch:       () => void
}

/**
 * Fetches bookings for the business owner's calendar/upcoming list.
 *
 * GET  /api/v1/owner/bookings?businessId=&from=&to=&status=
 * PATCH /api/v1/owner/bookings/{id}/cancel
 *
 * Status values from BE: "upcoming" | "completed" | "cancelled"
 * ("upcoming" = confirmed appointment not yet served)
 */
export function useOwnerBookings({
  businessId, from, to, status,
}: Options): UseOwnerBookingsResult {
  const [data,       setData]       = useState<OwnerBookingsPageDto | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [tick,       setTick]       = useState(0)

  const refetch = useCallback(() => setTick((n) => n + 1), [])

  useEffect(() => {
    if (!businessId) return

    const params = new URLSearchParams({ businessId, pageSize: '100' })
    if (from)   params.set('from',   from)
    if (to)     params.set('to',     to)
    if (status) params.set('status', status)

    setLoading(true)
    setError(null)

    apiGet<OwnerBookingsPageDto>(`/owner/bookings?${params}`)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [businessId, from, to, status, tick])

  const cancelBooking = useCallback(async (id: string): Promise<void> => {
    setCancelling(true)
    try {
      const result = await apiPatch<CancelBookingResponseDto>(
        `/owner/bookings/${id}/cancel`, {}
      )
      // Optimistic update — reflect cancellation immediately in local state
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          items: prev.items.map((b) =>
            b.id === id ? { ...b, status: result.status } : b
          ),
        }
      })
    } finally {
      setCancelling(false)
    }
  }, [])

  return {
    bookings:   data?.items      ?? [],
    totalItems: data?.totalItems ?? 0,
    loading,
    error,
    cancelling,
    cancelBooking,
    refetch,
  }
}
