import { useState, useMemo } from 'react'
import { useOwnerBookings } from '../hooks/useOwnerBookings'
import { useBusinessContext } from '../hooks/useBusinessContext'

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']
const DOW    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const STATUS_STYLES: Record<string, string> = {
  upcoming:  'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-500',
}
const STATUS_LABELS: Record<string, string> = {
  upcoming:  'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------
function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CalendarPage() {
  const { business } = useBusinessContext()
  const businessId   = business?.id ?? null

  const today = new Date()
  const [year,        setYear]        = useState(today.getFullYear())
  const [month,       setMonth]       = useState(today.getMonth())   // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())
  const [cancelTarget,  setCancelTarget]  = useState<string | null>(null)
  const [toast,         setToast]         = useState<{ msg: string; ok: boolean } | null>(null)

  // Fetch the whole month
  const from = isoDate(new Date(year, month, 1))
  const to   = isoDate(new Date(year, month + 1, 0))

  const { bookings, loading, cancelling, cancelBooking } = useOwnerBookings({
    businessId,
    from,
    to,
  })

  // Day-count dots derived from real bookings
  const dayCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    bookings.forEach((b) => {
      const d = new Date(b.appointmentDate + 'T00:00:00')
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        counts[day] = (counts[day] ?? 0) + 1
      }
    })
    return counts
  }, [bookings, year, month])

  // Bookings for the selected day
  const selectedIso = selectedDay
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null
  const dayBookings = selectedIso
    ? bookings.filter((b) => b.appointmentDate === selectedIso)
    : []

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const confirmCancel = async (id: string) => {
    try {
      await cancelBooking(id)
      setCancelTarget(null)
      showToast('Booking cancelled successfully.')
    } catch {
      showToast('Failed to cancel booking — please try again.', false)
    }
  }

  // Calendar grid
  const firstDow    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells       = Array.from({ length: firstDow + daysInMonth }, (_, i) =>
    i < firstDow ? null : i - firstDow + 1
  )

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 text-white text-sm rounded-xl shadow-lg flex items-center gap-2
          ${toast.ok ? 'bg-gray-900' : 'bg-red-600'}`}>
          {toast.ok
            ? <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            : <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
          }
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Appointment overview</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex-1">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="font-semibold text-gray-900">{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* DOW headers */}
          <div className="grid grid-cols-7 mb-2">
            {DOW.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />
                const isToday    = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                const isSelected = day === selectedDay
                const count      = dayCounts[day] ?? 0
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`relative flex flex-col items-center py-2 rounded-xl transition-colors text-sm font-medium
                      ${isSelected ? 'bg-brand-500 text-white' : isToday ? 'bg-brand-50 text-brand-600' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    {day}
                    {count > 0 && (
                      <span className={`text-xs font-semibold mt-0.5 leading-none ${isSelected ? 'text-brand-100' : 'text-brand-500'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs font-semibold text-brand-500">3</span>
            <span className="text-xs text-gray-400">= number of appointments that day</span>
          </div>
        </div>

        {/* Day detail panel */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 w-full lg:w-80 shrink-0">
          <h3 className="font-semibold text-gray-900 mb-4">
            {selectedDay
              ? `${MONTHS[month]} ${selectedDay}`
              : 'Select a day'}
          </h3>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : selectedDay && dayBookings.length > 0 ? (
            <div className="space-y-3">
              {dayBookings.map((b) => (
                <div key={b.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-1 h-12 rounded-full bg-brand-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{b.appointmentTime} — {b.customerName}</p>
                    <p className="text-xs text-gray-500">{b.serviceNames.join(', ')} · {b.stylistName ?? '—'}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs font-semibold text-gray-700">{b.total}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[b.status] ?? ''}`}>
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </div>
                    {b.status !== 'cancelled' && (
                      <button
                        onClick={() => setCancelTarget(b.id)}
                        className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        Cancel booking
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : selectedDay ? (
            <p className="text-sm text-gray-400">No appointments on this day.</p>
          ) : (
            <p className="text-sm text-gray-400">Click a day to see appointments.</p>
          )}
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">Cancel this booking?</p>
            <p className="text-sm text-gray-500 mb-6">The customer will be notified of the cancellation.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Keep booking
              </button>
              <button
                onClick={() => confirmCancel(cancelTarget)}
                disabled={cancelling}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-70 transition-colors flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <Spinner className="w-4 h-4 text-white" />
                    Cancelling…
                  </>
                ) : (
                  'Yes, cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
