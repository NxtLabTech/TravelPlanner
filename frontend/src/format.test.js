import { describe, expect, it } from "vitest";
import {
  countDays,
  formatBudget,
  formatDate,
  formatDateRange,
  formatDayHeading,
  listDates,
  pluralize,
} from "./format.js";

describe("listDates", () => {
  it("lists every day of the range, across month ends", () => {
    expect(listDates("2026-11-04", "2026-11-04")).toEqual(["2026-11-04"]);
    expect(listDates("2026-11-29", "2026-12-02")).toEqual([
      "2026-11-29",
      "2026-11-30",
      "2026-12-01",
      "2026-12-02",
    ]);
  });
});

describe("formatDayHeading", () => {
  it("shows the weekday, day and month", () => {
    expect(formatDayHeading("2026-11-04")).toBe("Wed, 4 Nov");
  });
});

describe("formatDate", () => {
  it("formats an ISO date without shifting the day", () => {
    expect(formatDate("2026-11-10")).toBe("10 Nov 2026");
    expect(formatDate("2026-01-01")).toBe("1 Jan 2026");
  });
});

describe("formatDateRange", () => {
  it("shows a single-day trip once", () => {
    expect(formatDateRange("2026-11-04", "2026-11-04")).toBe("4 Nov 2026");
  });

  it("only repeats the parts that differ", () => {
    expect(formatDateRange("2026-11-10", "2026-11-14")).toBe("10 – 14 Nov 2026");
    expect(formatDateRange("2026-11-28", "2026-12-03")).toBe("28 Nov – 3 Dec 2026");
    expect(formatDateRange("2026-12-30", "2027-01-02")).toBe("30 Dec 2026 – 2 Jan 2027");
  });
});

describe("countDays", () => {
  it("counts the first and last day", () => {
    expect(countDays("2026-11-04", "2026-11-04")).toBe(1);
    expect(countDays("2026-11-10", "2026-11-14")).toBe(5);
    expect(countDays("2026-02-27", "2026-03-02")).toBe(4);
  });
});

describe("pluralize", () => {
  it("uses the plural form for anything but one", () => {
    expect(pluralize(1, "day")).toBe("1 day");
    expect(pluralize(5, "day")).toBe("5 days");
    expect(pluralize(0, "activity", "activities")).toBe("0 activities");
  });
});

describe("formatBudget", () => {
  it("adds the currency symbol and digit grouping", () => {
    expect(formatBudget(20000)).toBe("₹20,000");
    expect(formatBudget(0)).toBe("₹0");
  });
});
