import { jsPDF } from "jspdf";
import { formatBudget, formatDate } from "../format.js";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function sortedActivities(activities) {
  return [...activities].sort(
    (first, second) =>
      first.date.localeCompare(second.date) ||
      (first.time || "").localeCompare(second.time || "") ||
      first.id - second.id,
  );
}

function fileNameForTrip(name) {
  const safeName = name.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-") || "trip";
  return `${safeName}-itinerary.pdf`;
}

function addText(document, text, y, { bold = false, size = 10, gap = 5 } = {}) {
  document.setFont("helvetica", bold ? "bold" : "normal");
  document.setFontSize(size);
  const lines = document.splitTextToSize(text, CONTENT_WIDTH);
  const lineHeight = size * 0.45;

  if (y + lines.length * lineHeight > PAGE_HEIGHT - MARGIN) {
    document.addPage();
    y = MARGIN;
  }

  document.text(lines, MARGIN, y);
  return y + lines.length * lineHeight + gap;
}

export function exportItineraryPdf(trip, activities, PdfDocument = jsPDF) {
  const document = new PdfDocument({ unit: "mm", format: "a4" });
  let y = MARGIN;

  y = addText(document, trip.name, y, { bold: true, size: 20, gap: 7 });
  y = addText(document, `Destination: ${trip.destination}`, y);
  y = addText(document, `Dates: ${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}`, y);
  y = addText(document, `Budget: ${formatBudget(trip.budget)}`, y, { gap: 9 });

  y = addText(document, "Itinerary", y, { bold: true, size: 15, gap: 6 });

  const activitiesByDate = sortedActivities(activities);
  if (activitiesByDate.length === 0) {
    addText(document, "No activities planned.", y);
  } else {
    let currentDate = null;
    for (const activity of activitiesByDate) {
      if (activity.date !== currentDate) {
        currentDate = activity.date;
        y = addText(document, formatDate(currentDate), y, { bold: true, size: 12, gap: 3 });
      }

      const time = activity.time ? `${activity.time} — ` : "";
      y = addText(document, `${time}${activity.title}`, y, { bold: true, gap: 2 });
      if (activity.location) y = addText(document, `Location: ${activity.location}`, y, { gap: 2 });
      if (activity.notes) y = addText(document, `Notes: ${activity.notes}`, y, { gap: 4 });
      else y += 2;
    }
  }

  document.save(fileNameForTrip(trip.name));
}
