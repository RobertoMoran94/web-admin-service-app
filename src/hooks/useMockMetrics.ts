/**
 * Returns realistic-looking mock metrics.
 * Replace the body of this hook with real API calls once the
 * Spring Boot backend is deployed to Cloud Run.
 */
import { useMemo } from 'react'
import type { DailyRevenue, ServiceStat, UpcomingBooking } from '../types'

export function useMockMetrics() {
  const revenueData: DailyRevenue[] = useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec']
    const today  = new Date()
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (29 - i))
      const label = `${months[d.getMonth()]} ${d.getDate()}`
      // Gentle upward trend with weekend dips
      const base    = 60 + i * 2.5
      const weekend = d.getDay() === 0 || d.getDay() === 6 ? 0.55 : 1
      const noise   = (Math.sin(i * 1.7) + 1) * 18
      return { date: label, revenue: Math.round(base * weekend + noise) }
    })
  }, [])

  const topServices: ServiceStat[] = [
    { name: 'Premium Haircut', bookings: 38 },
    { name: 'Beard Trim',      bookings: 27 },
    { name: 'Hair Color',      bookings: 19 },
    { name: 'Shave',           bookings: 14 },
    { name: 'Kids Cut',        bookings: 9  },
  ]

  const upcomingBookings: UpcomingBooking[] = [
    { id: '1', customerName: 'James Wilson',  service: 'Premium Haircut', employee: 'Mike',  date: 'Today',    time: '10:30', price: 25, status: 'confirmed' },
    { id: '2', customerName: 'Sofia García',  service: 'Hair Color',      employee: 'Alex',  date: 'Today',    time: '14:00', price: 65, status: 'confirmed' },
    { id: '3', customerName: 'Lucas Chen',    service: 'Beard Trim',      employee: 'David', date: 'Today',    time: '17:00', price: 15, status: 'pending'   },
    { id: '4', customerName: 'Emma Johnson',  service: 'Premium Haircut', employee: 'Tom',   date: 'Tomorrow', time: '09:00', price: 25, status: 'confirmed' },
    { id: '5', customerName: 'Noah Williams', service: 'Shave',           employee: 'Mike',  date: 'Tomorrow', time: '11:30', price: 20, status: 'confirmed' },
    { id: '6', customerName: 'Olivia Brown',  service: 'Kids Cut',        employee: 'Alex',  date: 'Tomorrow', time: '15:00', price: 18, status: 'pending'   },
  ]

  const totalRevenue    = revenueData.reduce((s, d) => s + d.revenue, 0)
  const totalBookings   = 48
  const newCustomers    = 12
  const avgBookingValue = Math.round(totalRevenue / totalBookings)

  return {
    revenueData,
    topServices,
    upcomingBookings,
    totalRevenue,
    totalBookings,
    newCustomers,
    avgBookingValue,
  }
}
