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

export function formatBudget(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}
