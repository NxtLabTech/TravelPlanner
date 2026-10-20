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

export function formatActivitiesCsv(activities = []) {
  const headers = ["Activity", "Date", "Time", "Location", "Notes"];
  const headerLine = headers.join(",");

  if (!activities || activities.length === 0) {
    return `${headerLine}\r\n`;
  }

  const rows = activities.map((activity) => {
    return [
      escapeCsvField(activity.title),
      escapeCsvField(activity.date),
      escapeCsvField(activity.time),
      escapeCsvField(activity.location),
      escapeCsvField(activity.notes),
    ].join(",");
  });

  return `${headerLine}\r\n${rows.join("\r\n")}\r\n`;
}

export function getTripCsvFilename(tripName) {
  const slug = (tripName || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug ? `travelplanner-${slug}.csv` : "travelplanner-trip.csv";
}

export function downloadCsv(filename, csvContent) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportActivitiesAsCsv(trip, activities) {
  const filename = getTripCsvFilename(trip?.name);
  const csvContent = formatActivitiesCsv(activities);
  downloadCsv(filename, csvContent);
}
