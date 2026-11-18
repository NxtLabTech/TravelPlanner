const colors = {
  upcoming: "bg-blue-100 text-blue-800",
  ongoing: "bg-green-100 text-green-800",
  completed: "bg-gray-200 text-gray-700",
};

export default function StatusBadge({ status }) {
  const colorClass = colors[status] || "bg-gray-100 text-gray-800";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${colorClass}`}>
      {status || "unknown"}
    </span>
  );
}
