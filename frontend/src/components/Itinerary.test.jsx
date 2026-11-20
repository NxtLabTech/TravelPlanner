import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Itinerary, { sortActivities } from "./Itinerary.jsx";

const activities = [
  { id: 1, title: "Beach", date: "2026-11-10", time: "10:00", location: "Baga", notes: "" },
  { id: 2, title: "Dinner", date: "2026-11-10", time: "20:00", location: "Museum Cafe", notes: "" },
  { id: 3, title: "Art Museum", date: "2026-11-11", time: "11:00", location: "Panaji", notes: "" },
  { id: 4, title: "Fort visit", date: "2026-11-11", time: "16:00", location: "Aguada", notes: "" },
];

describe("Itinerary", () => {
  it("shows a message when there are no activities in List View", () => {
    render(<Itinerary activities={[]} />);
    expect(screen.getByText("No activities yet.")).toBeInTheDocument();
  });

  it("displays List View by default with aria-pressed buttons", () => {
    render(<Itinerary activities={activities} />);
    const listBtn = screen.getByRole("button", { name: "List View" });
    const calBtn = screen.getByRole("button", { name: "Calendar View" });

    expect(listBtn).toHaveAttribute("aria-pressed", "true");
    expect(calBtn).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("searchbox", { name: "Search activities" })).toBeInTheDocument();
    expect(screen.getByText("Beach")).toBeInTheDocument();
  });

  it("allows users to switch to Calendar View and back to List View", async () => {
    render(<Itinerary activities={activities} tripStartDate="2026-11-01" />);

    // Switch to Calendar View
    await userEvent.click(screen.getByRole("button", { name: "Calendar View" }));

    expect(screen.getByRole("button", { name: "Calendar View" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "List View" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("November 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous Month" })).toBeInTheDocument();

    // Switch back to List View
    await userEvent.click(screen.getByRole("button", { name: "List View" }));

    expect(screen.getByRole("button", { name: "List View" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("searchbox", { name: "Search activities" })).toBeInTheDocument();
    expect(screen.getByText("Beach")).toBeInTheDocument();
  });

  it("preserves search input when switching views", async () => {
    render(<Itinerary activities={activities} tripStartDate="2026-11-01" />);

    const searchInput = screen.getByRole("searchbox", { name: "Search activities" });
    await userEvent.type(searchInput, "beach");
    expect(screen.getByText("Beach")).toBeInTheDocument();
    expect(screen.queryByText("Dinner")).not.toBeInTheDocument();

    // Switch to Calendar View
    await userEvent.click(screen.getByRole("button", { name: "Calendar View" }));
    expect(screen.getByText("November 2026")).toBeInTheDocument();

    // Switch back to List View
    await userEvent.click(screen.getByRole("button", { name: "List View" }));
    const restoredInput = screen.getByRole("searchbox", { name: "Search activities" });
    expect(restoredInput).toHaveValue("beach");
    expect(screen.getByText("Beach")).toBeInTheDocument();
    expect(screen.queryByText("Dinner")).not.toBeInTheDocument();
  });

  it("passes tripStartDate and tripEndDate to CalendarView", async () => {
    render(
      <Itinerary
        activities={activities}
        tripStartDate="2026-11-05"
        tripEndDate="2026-11-12"
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Calendar View" }));

    const inRangeDay = screen.getByTestId("calendar-day-2026-11-10");
    expect(inRangeDay).toHaveAttribute("data-in-trip-range", "true");
  });

  it("groups activities under one heading per date in List View", () => {
    render(<Itinerary activities={activities} />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "10 Nov 2026" })).toBeInTheDocument();
    expect(screen.getByText("Fort visit")).toBeInTheDocument();
  });

  it("sorts activities chronologically by date and time even when input is unsorted without mutating input", () => {
    const unsortedActivities = [
      { id: 4, title: "Fort Sunset", date: "2026-11-11", time: "16:00" },
      { id: 2, title: "Evening Dinner", date: "2026-11-10", time: "20:00" },
      { id: 3, title: "Morning Museum", date: "2026-11-11", time: "09:00" },
      { id: 1, title: "Morning Beach", date: "2026-11-10", time: "08:00" },
    ];
    const originalCopy = JSON.parse(JSON.stringify(unsortedActivities));

    render(<Itinerary activities={unsortedActivities} />);

    // Verify input was not mutated
    expect(unsortedActivities).toEqual(originalCopy);

    // Verify dates are rendered chronologically (10 Nov first, then 11 Nov)
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent("10 Nov 2026");
    expect(headings[1]).toHaveTextContent("11 Nov 2026");

    // Verify activities on each date are ordered by time
    const listItems = screen.getAllByRole("listitem");
    expect(listItems[0]).toHaveTextContent("Morning Beach");
    expect(listItems[1]).toHaveTextContent("Evening Dinner");
    expect(listItems[2]).toHaveTextContent("Morning Museum");
    expect(listItems[3]).toHaveTextContent("Fort Sunset");
  });

  it("safely handles null, undefined, and activities with missing or invalid dates", () => {
    const mixedActivities = [
      null,
      undefined,
      { id: 1, title: "Valid Activity", date: "2026-11-10", time: "10:00" },
      { id: 2, title: "No Date Activity", date: null, time: "12:00" },
      { id: 3, title: "Malformed Date Activity", date: "not-a-date", time: "14:00" },
      { id: 4, title: "Earlier Valid Activity", date: "2026-11-09", time: "08:00" },
    ];

    expect(() => render(<Itinerary activities={mixedActivities} />)).not.toThrow();

    // Chronological order: 2026-11-09 appears before 2026-11-10
    expect(screen.getByText("Earlier Valid Activity")).toBeInTheDocument();
    expect(screen.getByText("Valid Activity")).toBeInTheDocument();
    expect(screen.getByText("No Date Activity")).toBeInTheDocument();
    expect(screen.getByText("Malformed Date Activity")).toBeInTheDocument();
  });

  it("sortActivities handles edge cases and never mutates input array", () => {
    expect(sortActivities(null)).toEqual([]);
    expect(sortActivities(undefined)).toEqual([]);

    const arrayWithNulls = [null, { id: 2, date: "2026-12-01" }, undefined, { id: 1, date: "2026-11-01" }];
    const sorted = sortActivities(arrayWithNulls);
    expect(sorted).toHaveLength(2);
    expect(sorted[0].id).toBe(1);
    expect(sorted[1].id).toBe(2);
    expect(arrayWithNulls).toHaveLength(4); // original untouched
  });

  it("calls onEdit and onDelete with the activity in List View", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<Itinerary activities={activities} onEdit={onEdit} onDelete={onDelete} />);

    await userEvent.click(screen.getAllByText("Edit")[0]);
    await userEvent.click(screen.getAllByText("Delete")[1]);

    expect(onEdit).toHaveBeenCalledWith(activities[0]);
    expect(onDelete).toHaveBeenCalledWith(activities[1]);
  });

  it("filters activities by title as the user types", async () => {
    render(<Itinerary activities={activities} />);

    await userEvent.type(screen.getByLabelText("Search activities"), "beach");

    expect(screen.getByText("Beach")).toBeInTheDocument();
    expect(screen.queryByText("Dinner")).not.toBeInTheDocument();
    expect(screen.queryByText("Art Museum")).not.toBeInTheDocument();
    expect(screen.queryByText("Fort visit")).not.toBeInTheDocument();
  });

  it("filters activities by location as the user types", async () => {
    render(<Itinerary activities={activities} />);

    await userEvent.type(screen.getByLabelText("Search activities"), "baga");

    expect(screen.getByText("Beach")).toBeInTheDocument();
    expect(screen.queryByText("Dinner")).not.toBeInTheDocument();
    expect(screen.queryByText("Art Museum")).not.toBeInTheDocument();
  });

  it("matches activities by either title or location (e.g. museum)", async () => {
    render(<Itinerary activities={activities} />);

    await userEvent.type(screen.getByLabelText("Search activities"), "museum");

    expect(screen.getByText("Dinner")).toBeInTheDocument();
    expect(screen.getByText("Art Museum")).toBeInTheDocument();
    expect(screen.queryByText("Beach")).not.toBeInTheDocument();
    expect(screen.queryByText("Fort visit")).not.toBeInTheDocument();
  });

  it("performs case-insensitive search", async () => {
    render(<Itinerary activities={activities} />);

    await userEvent.type(screen.getByLabelText("Search activities"), "FORT");

    expect(screen.getByText("Fort visit")).toBeInTheDocument();
    expect(screen.queryByText("Beach")).not.toBeInTheDocument();
  });

  it('shows "No activities found" when there are no matches', async () => {
    render(<Itinerary activities={activities} />);

    await userEvent.type(screen.getByLabelText("Search activities"), "scuba diving");

    expect(screen.getByText("No activities found")).toBeInTheDocument();
    expect(screen.queryByText("Beach")).not.toBeInTheDocument();
  });

  it("preserves date grouping and sorting when activities are filtered", async () => {
    render(<Itinerary activities={activities} />);

    await userEvent.type(screen.getByLabelText("Search activities"), "museum");

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent("10 Nov 2026");
    expect(headings[1]).toHaveTextContent("11 Nov 2026");
  });

  it("restores all activities when the search input is cleared", async () => {
    render(<Itinerary activities={activities} />);

    const searchInput = screen.getByLabelText("Search activities");
    await userEvent.type(searchInput, "beach");
    expect(screen.queryByText("Dinner")).not.toBeInTheDocument();

    await userEvent.clear(searchInput);
    expect(screen.getByText("Beach")).toBeInTheDocument();
    expect(screen.getByText("Dinner")).toBeInTheDocument();
    expect(screen.getByText("Art Museum")).toBeInTheDocument();
    expect(screen.getByText("Fort visit")).toBeInTheDocument();
  });
});
