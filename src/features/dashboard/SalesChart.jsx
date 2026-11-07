import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency, formatDate } from '../../utils/helpers';
function SalesChart({ daily }) {
  return (
    <section className="min-w-0 rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
      <h2 className="text-lg font-semibold">Reservations & collections</h2>
      <p className="mt-1 mb-6 text-xs text-stone-500">
        Booked value by creation date. Verified collections by recording date.
      </p>
      <div className="h-72 w-full" aria-label="Chart of reservation value and recorded collections">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={daily} margin={{ left: 5, right: 10, top: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b6c8ad" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#b6c8ad" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 4"
              vertical={false}
              stroke="#a8a29e"
              strokeOpacity={0.15}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatDate(value).replace(/, \d{4}/, '')}
              tick={{ fontSize: 10, fill: '#78716c' }}
              minTickGap={35}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(value) => `$${value}`}
              tick={{ fontSize: 10, fill: '#78716c' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              labelFormatter={formatDate}
              contentStyle={{ borderRadius: 10, color: '#292524' }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="booked_value"
              name="Reservation value"
              stroke="#a8a29e"
              fill="url(#sales-fill)"
              strokeWidth={2}
            />
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="paid_revenue"
              name="Recorded collections"
              stroke="#059669"
              fill="transparent"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3 text-xs text-stone-500">
        <summary className="cursor-pointer">View chart data</summary>
        <div className="max-h-48 overflow-auto">
          <table className="mt-2 w-full text-left">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reservations</th>
                <th>Collections</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((day) => (
                <tr key={day.date}>
                  <td>{day.date}</td>
                  <td>{formatCurrency(day.booked_value)}</td>
                  <td>{formatCurrency(day.paid_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
export default SalesChart;
