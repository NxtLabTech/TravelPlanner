import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CSV_HEADERS,
  downloadCsv,
  escapeCsvField,
  exportTripActivitiesCsv,
  formatActivityRow,
  generateActivitiesCsv,
  generateTripCsvFilename,
} from "./csv.js";

describe("CSV Generation and Export Utilities", () => {
  describe("1. CSV Headers", () => {
    it("contains the exact required headers in the correct order", () => {
      expect(CSV_HEADERS).toEqual(["Activity", "Date", "Time", "Location", "Notes"]);
    });

    it("starts the generated CSV with the exact required header row", () => {
      const csv = generateActivitiesCsv([]);
      expect(csv).toBe("Activity,Date,Time,Location,Notes");
    });
  });

  describe("2. All activities are exported", () => {
    it("exports every activity passed into the function", () => {
      const activities = [
        { title: "Museum Visit", date: "2026-11-10", time: "10:00", location: "Louvre", notes: "Tickets bought" },
        { title: "Lunch", date: "2026-11-10", time: "13:00", location: "Bistro", notes: "Table booked" },
        { title: "Seine River Cruise", date: "2026-11-11", time: "18:00", location: "Pont Neuf", notes: "Sunset view" },
      ];

      const csv = generateActivitiesCsv(activities);
      const lines = csv.split("\r\n");

      // 1 header row + 3 activity rows = 4 rows
      expect(lines).toHaveLength(4);
      expect(lines[0]).toBe("Activity,Date,Time,Location,Notes");
      expect(lines[1]).toContain("Museum Visit");
      expect(lines[2]).toContain("Lunch");
      expect(lines[3]).toContain("Seine River Cruise");
    });
  });

  describe("3. Activity order is preserved", () => {
    it("preserves the existing activity order exactly without sorting or reordering", () => {
      const activities = [
        { title: "Activity Gamma", date: "2026-11-12", time: "15:00", location: "Loc C", notes: "" },
        { title: "Activity Alpha", date: "2026-11-10", time: "09:00", location: "Loc A", notes: "" },
        { title: "Activity Beta", date: "2026-11-11", time: "12:00", location: "Loc B", notes: "" },
      ];

      const csv = generateActivitiesCsv(activities);
      const lines = csv.split("\r\n");

      expect(lines[1]).toBe("Activity Gamma,2026-11-12,15:00,Loc C,");
      expect(lines[2]).toBe("Activity Alpha,2026-11-10,09:00,Loc A,");
      expect(lines[3]).toBe("Activity Beta,2026-11-11,12:00,Loc B,");
    });
  });

  describe("4. Escaping commas, quotes, and line breaks", () => {
    it("escapes fields containing commas with enclosing quotes", () => {
      expect(escapeCsvField("Paris, France")).toBe('"Paris, France"');
    });

    it("escapes fields containing double quotes by doubling them and enclosing in quotes", () => {
      expect(escapeCsvField('Visit "The Louvre"')).toBe('"Visit ""The Louvre"""');
      expect(escapeCsvField('"Quoted"')).toBe('"""Quoted"""');
    });

    it("escapes fields containing newline characters", () => {
      expect(escapeCsvField("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
      expect(escapeCsvField("Line 1\r\nLine 2")).toBe('"Line 1\r\nLine 2"');
    });

    it("leaves plain fields unquoted", () => {
      expect(escapeCsvField("Plain text")).toBe("Plain text");
      expect(escapeCsvField("2026-11-10")).toBe("2026-11-10");
      expect(escapeCsvField("10:00")).toBe("10:00");
    });

    it("correctly formats a row with complex characters", () => {
      const activity = {
        title: 'Dinner at "Le Bistro", Paris',
        date: "2026-11-10",
        time: "20:00",
        location: "123 Rue de Rivoli, Paris",
        notes: "Dress code: smart casual.\nBring reservation confirmation.",
      };

      const row = formatActivityRow(activity);
      expect(row).toBe(
        '"Dinner at ""Le Bistro"", Paris",2026-11-10,20:00,"123 Rue de Rivoli, Paris","Dress code: smart casual.\nBring reservation confirmation."'
      );
    });
  });

  describe("5. Missing and optional values handled safely", () => {
    it("handles null, undefined, and missing fields safely without printing null or undefined", () => {
      expect(escapeCsvField(null)).toBe("");
      expect(escapeCsvField(undefined)).toBe("");
      expect(escapeCsvField("")).toBe("");

      const activity = {
        title: "Walk around",
        date: "2026-11-10",
        time: null,
        location: undefined,
        notes: "",
      };

      const row = formatActivityRow(activity);
      expect(row).toBe("Walk around,2026-11-10,,,");
      expect(row.split(",")).toHaveLength(5);
      expect(row).not.toContain("undefined");
      expect(row).not.toContain("null");
    });

    it("handles activity objects with missing properties and maintains 5 columns", () => {
      const activity = {
        title: "Sightseeing",
      };

      const row = formatActivityRow(activity);
      expect(row).toBe("Sightseeing,,,,");
      expect(row.split(",")).toHaveLength(5);
    });
  });

  describe("6. Trip with no activities produces header-only CSV", () => {
    it("returns only the header row when activities array is empty", () => {
      const csv = generateActivitiesCsv([]);
      expect(csv).toBe("Activity,Date,Time,Location,Notes");
    });

    it("returns only the header row when activities is null or undefined", () => {
      expect(generateActivitiesCsv(null)).toBe("Activity,Date,Time,Location,Notes");
      expect(generateActivitiesCsv(undefined)).toBe("Activity,Date,Time,Location,Notes");
    });
  });

  describe("7. Filename generated correctly from trip name", () => {
    it("generates lowercase hyphen-separated filename starting with travelplanner- and ending with .csv", () => {
      expect(generateTripCsvFilename("Paris Trip")).toBe("travelplanner-paris-trip.csv");
      expect(generateTripCsvFilename("Weekend Getaway")).toBe("travelplanner-weekend-getaway.csv");
      expect(generateTripCsvFilename("Summer Holiday 2026")).toBe("travelplanner-summer-holiday-2026.csv");
    });

    it("supports trip object as argument", () => {
      expect(generateTripCsvFilename({ name: "Goa Vacation" })).toBe("travelplanner-goa-vacation.csv");
    });

    it("handles accents and diacritics cleanly", () => {
      expect(generateTripCsvFilename("Café & München Trip")).toBe("travelplanner-cafe-munchen-trip.csv");
      expect(generateTripCsvFilename("Zürich Explorer")).toBe("travelplanner-zurich-explorer.csv");
    });
  });

  describe("8. Empty or unusual trip names produce safe fallback filename", () => {
    it("falls back to travelplanner-trip.csv for empty, whitespace, or invalid trip names", () => {
      expect(generateTripCsvFilename("")).toBe("travelplanner-trip.csv");
      expect(generateTripCsvFilename("   ")).toBe("travelplanner-trip.csv");
      expect(generateTripCsvFilename(null)).toBe("travelplanner-trip.csv");
      expect(generateTripCsvFilename(undefined)).toBe("travelplanner-trip.csv");
      expect(generateTripCsvFilename(12345)).toBe("travelplanner-trip.csv");
      expect(generateTripCsvFilename({})).toBe("travelplanner-trip.csv");
      expect(generateTripCsvFilename({ name: "" })).toBe("travelplanner-trip.csv");
    });

    it("removes or replaces unsafe filename characters", () => {
      expect(generateTripCsvFilename("Trip: Paris / London *?<>|")).toBe("travelplanner-trip-paris-london.csv");
      expect(generateTripCsvFilename("Trip #1 @ Beach!")).toBe("travelplanner-trip-1-beach.csv");
      expect(generateTripCsvFilename("---???---")).toBe("travelplanner-trip.csv");
    });
  });

  describe("Browser download mechanism and cleanup", () => {
    let originalCreateObjectURL;
    let originalRevokeObjectURL;

    beforeEach(() => {
      originalCreateObjectURL = window.URL.createObjectURL;
      originalRevokeObjectURL = window.URL.revokeObjectURL;
      window.URL.createObjectURL = vi.fn(() => "blob:http://localhost/mock-uuid");
      window.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      window.URL.createObjectURL = originalCreateObjectURL;
      window.URL.revokeObjectURL = originalRevokeObjectURL;
      vi.restoreAllMocks();
    });

    it("creates a Blob with text/csv;charset=utf-8;, clicks a temporary link, and revokes the URL", () => {
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

      downloadCsv("travelplanner-paris-trip.csv", "Activity,Date,Time,Location,Notes\r\nEiffel Tower,2026-11-10,,,");

      expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
      const createdBlob = window.URL.createObjectURL.mock.calls[0][0];
      expect(createdBlob).toBeInstanceOf(Blob);
      expect(createdBlob.type).toBe("text/csv;charset=utf-8;");

      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/mock-uuid");
    });

    it("exportTripActivitiesCsv combines CSV generation, filename generation, and download", () => {
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

      const trip = { name: "Paris Trip" };
      const activities = [{ title: "Louvre", date: "2026-11-10", time: "10:00", location: "Paris", notes: "Art" }];

      exportTripActivitiesCsv(trip, activities);

      expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/mock-uuid");
    });
  });
});
