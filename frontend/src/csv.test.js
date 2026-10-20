import { describe, expect, it, vi } from "vitest";
import {
  downloadCsv,
  escapeCsvField,
  exportActivitiesAsCsv,
  formatActivitiesCsv,
  getTripCsvFilename,
} from "./csv.js";

describe("escapeCsvField", () => {
  it("returns an empty string for null and undefined", () => {
    expect(escapeCsvField(null)).toBe("");
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("returns unquoted string when no special characters exist", () => {
    expect(escapeCsvField("Visit Beach")).toBe("Visit Beach");
    expect(escapeCsvField("2026-11-10")).toBe("2026-11-10");
    expect(escapeCsvField(123)).toBe("123");
  });

  it("quotes fields containing commas", () => {
    expect(escapeCsvField("Goa, India")).toBe('"Goa, India"');
  });

  it("quotes and escapes fields containing double quotes", () => {
    expect(escapeCsvField('The "Best" Restaurant')).toBe('"The ""Best"" Restaurant"');
  });

  it("quotes fields containing newlines", () => {
    expect(escapeCsvField("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
    expect(escapeCsvField("Line 1\r\nLine 2")).toBe('"Line 1\r\nLine 2"');
  });
});

describe("getTripCsvFilename", () => {
  it("converts trip name into a lowercase hyphenated filename", () => {
    expect(getTripCsvFilename("Goa Trip")).toBe("travelplanner-goa-trip.csv");
    expect(getTripCsvFilename("Summer Vacation 2026")).toBe(
      "travelplanner-summer-vacation-2026.csv"
    );
  });

  it("strips special characters and trims hyphens", () => {
    expect(getTripCsvFilename("Paris & Rome @ 2026!")).toBe(
      "travelplanner-paris-rome-2026.csv"
    );
    expect(getTripCsvFilename("  --Tokyo Trip--  ")).toBe("travelplanner-tokyo-trip.csv");
  });

  it("falls back to travelplanner-trip.csv for empty or non-alphanumeric names", () => {
    expect(getTripCsvFilename("")).toBe("travelplanner-trip.csv");
    expect(getTripCsvFilename(null)).toBe("travelplanner-trip.csv");
    expect(getTripCsvFilename("   ")).toBe("travelplanner-trip.csv");
    expect(getTripCsvFilename("!@#$%^&*()")).toBe("travelplanner-trip.csv");
  });
});

describe("formatActivitiesCsv", () => {
  it("returns only headers for empty activities list", () => {
    const csv = formatActivitiesCsv([]);
    expect(csv).toBe("Activity,Date,Time,Location,Notes\r\n");
  });

  it("handles undefined or null activities safely", () => {
    expect(formatActivitiesCsv(null)).toBe("Activity,Date,Time,Location,Notes\r\n");
    expect(formatActivitiesCsv(undefined)).toBe("Activity,Date,Time,Location,Notes\r\n");
  });

  it("formats activities and preserves their order", () => {
    const activities = [
      {
        id: 1,
        title: "Visit Baga Beach",
        date: "2026-11-10",
        time: "10:00",
        location: "Baga Beach",
        notes: "Spend the morning at the beach",
      },
      {
        id: 2,
        title: "Dinner at Fisherman's Wharf",
        date: "2026-11-10",
        time: "19:30",
        location: "Panaji, Goa",
        notes: 'Reservation under "John Doe"',
      },
    ];

    const expected =
      "Activity,Date,Time,Location,Notes\r\n" +
      "Visit Baga Beach,2026-11-10,10:00,Baga Beach,Spend the morning at the beach\r\n" +
      'Dinner at Fisherman\'s Wharf,2026-11-10,19:30,"Panaji, Goa","Reservation under ""John Doe"""\r\n';

    expect(formatActivitiesCsv(activities)).toBe(expected);
  });

  it("handles missing or empty fields in activity objects", () => {
    const activities = [
      {
        title: "Check-in Hotel",
        date: "2026-11-10",
        time: "",
        location: "",
        notes: "",
      },
    ];

    expect(formatActivitiesCsv(activities)).toBe(
      "Activity,Date,Time,Location,Notes\r\nCheck-in Hotel,2026-11-10,,,\r\n"
    );
  });
});

describe("downloadCsv and exportActivitiesAsCsv", () => {
  it("creates a blob, triggers anchor download, and revokes object URL", () => {
    const createObjectURLMock = vi.fn().mockReturnValue("blob:http://localhost/test-uuid");
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    exportActivitiesAsCsv(
      { name: "Euro Tour" },
      [
        {
          title: "Visit Eiffel Tower",
          date: "2026-06-15",
          time: "14:00",
          location: "Paris",
          notes: "Tickets booked online",
        },
      ]
    );

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:http://localhost/test-uuid");

    clickSpy.mockRestore();
  });
});
