export const CSV_HEADERS = ["Activity", "Date", "Time", "Location", "Notes"];

/**
 * Escapes a single CSV field value according to RFC 4180 rules.
 * Values containing commas, double quotes, or line breaks are enclosed in quotes,
 * with any internal quotes escaped by doubling them ("").
 */
export function escapeCsvField(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats a single activity into a CSV row with 5 columns:
 * Activity, Date, Time, Location, Notes
 */
export function formatActivityRow(activity) {
  return [
    escapeCsvField(activity?.title ?? activity?.name ?? activity?.activity ?? ""),
    escapeCsvField(activity?.date ?? ""),
    escapeCsvField(activity?.time ?? ""),
    escapeCsvField(activity?.location ?? ""),
    escapeCsvField(activity?.notes ?? ""),
  ].join(",");
}

/**
 * Generates a full CSV string for the given activities.
 * Preserves the exact array order.
 * If activities is empty, returns the header row only.
 */
export function generateActivitiesCsv(activities = []) {
  const headerRow = CSV_HEADERS.join(",");
  const rows = (Array.isArray(activities) ? activities : []).map(formatActivityRow);
  return [headerRow, ...rows].join("\r\n");
}

/**
 * Generates a safe, lowercase, hyphen-separated filename ending in .csv.
 * Defaults to "travelplanner-trip.csv" if trip name is missing, empty, or invalid.
 */
export function generateTripCsvFilename(tripOrName) {
  const rawName =
    typeof tripOrName === "object" && tripOrName !== null
      ? tripOrName.name
      : tripOrName;

  if (!rawName || typeof rawName !== "string") {
    return "travelplanner-trip.csv";
  }

  const slug = rawName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug ? `travelplanner-${slug}.csv` : "travelplanner-trip.csv";
}

/**
 * Initiates a browser download of a CSV file using Blob and an anchor element.
 * Properly revokes the generated Object URL for cleanup.
 */
export function downloadCsv(filename, csvContent) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
  }
}

/**
 * High-level helper to export a trip's activities to a CSV file.
 */
export function exportTripActivitiesCsv(trip, activities) {
  const csvContent = generateActivitiesCsv(activities);
  const filename = generateTripCsvFilename(trip?.name);
  downloadCsv(filename, csvContent);
}
