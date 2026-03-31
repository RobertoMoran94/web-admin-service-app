import { useState } from 'react'
import { useMockMetrics } from '../hooks/useMockMetrics'

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']
const DOW    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// Mock: number of bookings per day-of-month for the current month
const MOCK_DAY_COUNTS: Record<number, number> = {
  1:2, 3:4, 5:1, 7:3, 8:5, 10:2, 12:4, 14:6, 15:3, 17:2,
  19:5, 21:1, 22:4, 23:3, 24:2, 26:4, 28:3, 29:5, 30:2,
}

export default function CalendarPage() {
  const today   = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())   // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())

  const { upcomingBookings } = useMockMetrics()

  // Calendar grid
  const firstDow   = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells       = Array.from({ length: firstDow + daysInMonth }, (_, i) =>
    i < firstDow ? null : i - firstDow + 1
  )

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const dayBookings = selectedDay
    ? upcomingBookings.filter((b) => b.date === 'Today' || b.date === 'Tomorrow')
    : []

  return (
    <div className="space-y-6">
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
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />
              const isToday   = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
              const isSelected = day === selectedDay
              const count      = MOCK_DAY_COUNTS[day] ?? 0
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

          {selectedDay && dayBookings.length > 0 ? (
            <div className="space-y-3">
              {dayBookings.map((b) => (
                <div key={b.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-1 h-12 rounded-full bg-brand-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{b.time} — {b.customerName}</p>
                    <p className="text-xs text-gray-500">{b.service} · {b.employee}</p>
                    <p className="text-xs font-semibold text-gray-700 mt-1">${b.price}</p>
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
    </div>
  )
}
