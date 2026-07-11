type MetricCardProps = {
  title: string;
  value: string;
  trend: string;
  accent: string;
};

export function MetricCard({ title, value, trend, accent }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-sm font-medium ${accent}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}
