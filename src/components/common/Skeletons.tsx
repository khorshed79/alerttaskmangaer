export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading workspace">
      <div className="h-48 rounded-3xl bg-[#ECECF4] dark:bg-[#1E2030]" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636]" />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[68px] rounded-2xl bg-white dark:bg-[#161822] border border-[#ECECF4] dark:border-[#242636]" />
        ))}
      </div>
    </div>
  );
}
