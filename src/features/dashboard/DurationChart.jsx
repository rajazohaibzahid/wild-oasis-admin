import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Empty from '../../ui/Empty';
const colors = ['#173e35', '#38735a', '#7c9c78', '#b9c9a5', '#d6c7a6'];
function DurationChart({ durations }) {
  const total = durations.reduce((sum, item) => sum + item.value, 0);
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
      <h2 className="text-lg font-semibold">Stay duration</h2>
      <p className="mt-1 text-xs text-stone-500">Non-cancelled arrivals in this period</p>
      {!total ? (
        <div className="mt-6">
          <Empty resource="stays" />
        </div>
      ) : (
        <>
          <div className="h-52" aria-label="Stay duration distribution">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={durations}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {durations.map((item, index) => (
                    <Cell key={item.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, color: '#292524' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2">
            {durations.map((item, index) => (
              <li key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  {item.name}
                </span>
                <span className="font-semibold tabular-nums">{item.value}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
export default DurationChart;
