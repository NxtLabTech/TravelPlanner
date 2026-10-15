import { describe, expect, it, vi } from "vitest";
import { exportItineraryPdf } from "./itineraryPdf.js";

function createPdfDocument() {
  const document = {
    addPage: vi.fn(),
    save: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    splitTextToSize: vi.fn((text) => [text]),
    text: vi.fn(),
  };
  return { document, PdfDocument: class { constructor() { return document; } } };
}

const trip = {
  name: "Goa Trip",
  destination: "Goa",
  start_date: "2026-11-10",
  end_date: "2026-11-14",
  budget: 20000,
};

describe("exportItineraryPdf", () => {
  it("includes trip details and activities sorted by date and time", () => {
    const { document, PdfDocument } = createPdfDocument();
    exportItineraryPdf(
      trip,
      [
        { id: 2, title: "Dinner", date: "2026-11-10", time: "20:00", location: "Panaji", notes: "Book ahead" },
        { id: 3, title: "Fort", date: "2026-11-11", time: "09:00", location: "Aguada", notes: "" },
        { id: 1, title: "Beach", date: "2026-11-10", time: "10:00", location: "Baga", notes: "" },
      ],
      PdfDocument,
    );

    const content = document.text.mock.calls.map(([text]) => text.join(" ")).join("\n");
    expect(content).toContain("Goa Trip");
    expect(content).toContain("Destination: Goa");
    expect(content).toContain("Budget: ₹20,000");
    expect(content.indexOf("10:00 — Beach")).toBeLessThan(content.indexOf("20:00 — Dinner"));
    expect(content.indexOf("20:00 — Dinner")).toBeLessThan(content.indexOf("09:00 — Fort"));
    expect(content).toContain("Location: Panaji");
    expect(content).toContain("Notes: Book ahead");
    expect(document.save).toHaveBeenCalledWith("Goa Trip-itinerary.pdf");
  });

  it("exports a readable empty itinerary", () => {
    const { document, PdfDocument } = createPdfDocument();
    exportItineraryPdf(trip, [], PdfDocument);

    expect(document.text.mock.calls.map(([text]) => text.join(" "))).toContain("No activities planned.");
  });
});
