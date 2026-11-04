const statusStyles = {
  upcoming: {
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  ongoing: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500 animate-status-pulse",
  },
  completed: {
    badge: "bg-slate-100 text-slate-700 border-slate-300",
    dot: "bg-slate-400",
  },
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || statusStyles.completed;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize border shadow-xs transition-colors ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}
