import { describe, expect, it } from "vitest";
import { formatBudget, formatDate } from "./format.js";

describe("formatDate", () => {
  it("formats an ISO date without shifting the day", () => {
    expect(formatDate("2026-11-10")).toBe("10 Nov 2026");
    expect(formatDate("2026-01-01")).toBe("1 Jan 2026");
  });
});

describe("formatBudget", () => {
  it("adds the currency symbol and digit grouping", () => {
    expect(formatBudget(20000)).toBe("₹20,000");
    expect(formatBudget(0)).toBe("₹0");
  });
});
