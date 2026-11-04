// Dates come from the API as "YYYY-MM-DD". Build them by parts so the
// browser's timezone doesn't shift the day.
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function plural(count, unit) {
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

// 120 -> "2 hours", 90 -> "1 hour 30 minutes", 45 -> "45 minutes"
export function formatDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (hours) parts.push(plural(hours, "hour"));
  if (minutes) parts.push(plural(minutes, "minute"));
  return parts.join(" ");
}

export function formatBudget(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}
