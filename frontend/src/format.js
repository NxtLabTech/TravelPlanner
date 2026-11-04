// Dates come from the API as "YYYY-MM-DD". Build them by parts so the
// browser's timezone doesn't shift the day.
function parseDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// Today in the browser's timezone, as "YYYY-MM-DD".
export function todayIsoDate() {
  return toIsoDate(new Date());
}

// Every date from startDate to endDate, both included.
export function listDates(startDate, endDate) {
  const dates = [];
  const end = parseDate(endDate);
  for (let day = parseDate(startDate); day <= end; day.setDate(day.getDate() + 1)) {
    dates.push(toIsoDate(day));
  }
  return dates;
}

// "Wed, 4 Nov". Built from parts because browsers disagree on whether
// en-GB puts a comma after the weekday.
export function formatDayHeading(isoDate) {
  const date = parseDate(isoDate);
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
  const dayAndMonth = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${weekday}, ${dayAndMonth}`;
}

export function formatDate(isoDate) {
  return parseDate(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// "4 Nov 2026", "10 – 14 Nov 2026", "28 Nov – 3 Dec 2026"
// or "30 Dec 2026 – 2 Jan 2027", depending on what the dates share.
export function formatDateRange(startDate, endDate) {
  if (startDate === endDate) return formatDate(startDate);

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (start.getFullYear() !== end.getFullYear()) {
    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  }
  const startFormat =
    start.getMonth() === end.getMonth() ? { day: "numeric" } : { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("en-GB", startFormat)} – ${formatDate(endDate)}`;
}

// Number of days a trip covers, counting both the first and last day.
export function countDays(startDate, endDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  // Math.round absorbs the hour gained or lost at daylight saving changes.
  return Math.round((parseDate(endDate) - parseDate(startDate)) / millisecondsPerDay) + 1;
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatBudget(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}
