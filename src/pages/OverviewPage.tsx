import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar,
} from 'recharts'
import { useMockMetrics } from '../hooks/useMockMetrics'
import { useBusinessContext } from '../hooks/useBusinessContext'

const STATUS_STYLES = {
  confirmed: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function OverviewPage() {
  const { business } = useBusinessContext()
  const {
    revenueData, topServices, upcomingBookings,
    totalRevenue, totalBookings, newCustomers, avgBookingValue,
  } = useMockMetrics()

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {business?.name ?? 'Your business'} — last 30 days
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',     value: `$${totalRevenue.toLocaleString()}`,  sub: '+12% vs last month', color: 'text-green-600' },
          { label: 'Total Bookings',    value: totalBookings,                         sub: '+8% vs last month',  color: 'text-green-600' },
          { label: 'New Customers',     value: newCustomers,                          sub: '+3 vs last month',   color: 'text-green-600' },
          { label: 'Avg. Booking Value',value: `$${avgBookingValue}`,                 sub: 'Per appointment',    color: 'text-gray-500'  },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            <p className={`text-xs mt-1 font-medium ${color}`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue chart — 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenue — last 30 days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval={6}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                formatter={(v) => [`$${v}`, 'Revenue']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#4f63d2"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#4f63d2' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top services — 1/3 width */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Top services</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={topServices}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <Tooltip
                formatter={(v) => [`${v}`, 'Bookings']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Bar dataKey="bookings" fill="#4f63d2" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming bookings */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Upcoming appointments</h2>
          <span className="text-xs text-gray-400">Next 2 days</span>
        </div>
        <div className="divide-y divide-gray-50">
          {upcomingBookings.map((b) => (
            <div
              key={b.id}
              className="px-5 py-3.5 grid grid-cols-[auto_1fr_140px_56px_88px] items-center gap-4 hover:bg-gray-50 transition-colors"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-sm shrink-0">
                {b.customerName.charAt(0)}
              </div>
              {/* Info */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{b.customerName}</p>
                <p className="text-xs text-gray-500 truncate">{b.service} · {b.employee}</p>
              </div>
              {/* Date + time — same line */}
              <p className="text-sm font-medium text-gray-700 text-right">
                {b.date} <span className="text-gray-400 font-normal">{b.time}</span>
              </p>
              {/* Price */}
              <p className="text-sm font-semibold text-gray-900 text-right">${b.price}</p>
              {/* Status */}
              <span className={`inline-flex items-center justify-center text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[b.status]}`}>
                {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
