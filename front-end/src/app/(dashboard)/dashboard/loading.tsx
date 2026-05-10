export default function DashboardLoading() {
  return (
    <div className="box-border w-full max-w-[1600px] animate-pulse p-4 sm:p-6 lg:p-8">
      <div className="mb-8 h-20 rounded-2xl bg-slate-100" />
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-slate-100 bg-white shadow-sm"
          >
            <div className="h-full rounded-2xl bg-slate-50/90" />
          </div>
        ))}
      </div>
      <div className="mb-8 h-[min(52vh,520px)] rounded-2xl border border-slate-100 bg-slate-50" />
      <div className="mb-8 h-64 rounded-2xl border border-slate-100 bg-slate-50" />
      <div className="h-64 rounded-2xl border border-slate-100 bg-slate-50" />
    </div>
  );
}
