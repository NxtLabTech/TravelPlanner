import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CalendarView from "./CalendarView.jsx";

const mockActivities = [
  {
    id: 1,
    title: "Beach Volleyball",
    date: "2026-11-10",
    time: "10:00",
    location: "Baga Beach",
    notes: "Bring sunscreen",
  },
  {
    id: 2,
    title: "Seafood Lunch",
    date: "2026-11-10",
    time: "13:00",
    location: "Shack",
    notes: "Reserve table",
  },
  {
    id: 3,
    title: "Sunset Walk",
    date: "2026-11-10",
    time: "18:00",
    location: "Calangute",
    notes: "",
  },
  {
    id: 4,
    title: "Art Museum",
    date: "2026-11-11",
    time: "11:00",
    location: "Panaji",
    notes: "Tickets booked",
  },
];

describe("CalendarView", () => {
  it("displays current month and year", () => {
    render(<CalendarView activities={mockActivities} initialDate="2026-11-01" />);
    expect(screen.getByText("November 2026")).toBeInTheDocument();
  });

  it("renders cleanly with no activities", () => {
    render(<CalendarView activities={[]} initialDate="2026-11-01" />);
    expect(screen.getByText("November 2026")).toBeInTheDocument();
    expect(screen.queryByTestId(/activity-dot-/)).not.toBeInTheDocument();
    expect(
      screen.getByText("Select a date from the calendar to view its scheduled activities.")
    ).toBeInTheDocument();
  });

  it("shows all seven weekdays: Sunday through Saturday", () => {
    render(<CalendarView activities={mockActivities} initialDate="2026-11-01" />);
    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    for (const day of weekdays) {
      expect(screen.getByLabelText(day)).toBeInTheDocument();
    }
  });

  it("aligns dates correctly according to the actual weekday of the month", () => {
    // Nov 1, 2026 is Sunday (index 0), so 0 previous padding cells
    const { rerender } = render(
      <CalendarView activities={mockActivities} initialDate="2026-11-01" />
    );
    expect(screen.queryAllByTestId("padding-prev")).toHaveLength(0);

    // Dec 1, 2026 is Tuesday (index 2), so 2 previous padding cells
    rerender(<CalendarView activities={mockActivities} initialDate="2026-12-01" />);
    expect(screen.getAllByTestId("padding-prev")).toHaveLength(2);
  });

  it("navigates between months using Previous, Next, and Today buttons", () => {
    render(<CalendarView activities={mockActivities} initialDate="2026-11-01" />);
    expect(screen.getByText("November 2026")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next Month" }));
    expect(screen.getByText("December 2026")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Previous Month" }));
    expect(screen.getByText("November 2026")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Previous Month" }));
    expect(screen.getByText("October 2026")).toBeInTheDocument();
  });

  it("navigates correctly across year boundaries between December and January", () => {
    render(<CalendarView activities={mockActivities} initialDate="2026-12-01" />);
    expect(screen.getByText("December 2026")).toBeInTheDocument();

    // Navigate to January next year
    fireEvent.click(screen.getByRole("button", { name: "Next Month" }));
    expect(screen.getByText("January 2027")).toBeInTheDocument();

    // Navigate back to December
    fireEvent.click(screen.getByRole("button", { name: "Previous Month" }));
    expect(screen.getByText("December 2026")).toBeInTheDocument();

    // Navigate from January 2026 to December 2025
    render(<CalendarView activities={mockActivities} initialDate="2026-01-01" />);
    const prevButtons = screen.getAllByRole("button", { name: "Previous Month" });
    fireEvent.click(prevButtons[prevButtons.length - 1]);
    expect(screen.getByText("December 2025")).toBeInTheDocument();
  });

  it("Today button navigates to current month and selects today's date", () => {
    render(<CalendarView activities={mockActivities} initialDate="2020-01-01" />);
    expect(screen.getByText("January 2020")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Today" }));

    const now = new Date();
    const currentMonthName = now.toLocaleDateString("en-US", { month: "long" });
    const currentYear = now.getFullYear();
    expect(screen.getByText(`${currentMonthName} ${currentYear}`)).toBeInTheDocument();

    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const todayKey = `${currentYear}-${m}-${d}`;

    const todayButton = screen.getByTestId(`calendar-day-${todayKey}`);
    expect(todayButton).toHaveAttribute("aria-pressed", "true");
    expect(todayButton).toHaveAttribute("aria-current", "date");

    const detailsSection = screen.getByTestId("selected-date-section");
    expect(detailsSection).toBeInTheDocument();
  });

  it("displays activities on their correct dates in calendar cells", () => {
    render(<CalendarView activities={mockActivities} initialDate="2026-11-01" />);

    const nov10Cell = screen.getByTestId("calendar-day-2026-11-10");
    expect(within(nov10Cell).getByText("Beach Volleyball")).toBeInTheDocument();
    expect(within(nov10Cell).getByText("10:00")).toBeInTheDocument();

    const nov11Cell = screen.getByTestId("calendar-day-2026-11-11");
    expect(within(nov11Cell).getByText("Art Museum")).toBeInTheDocument();
    expect(within(nov11Cell).getByText("11:00")).toBeInTheDocument();
  });

  it("handles multiple activities on the same date with '+N more' indicator", () => {
    render(<CalendarView activities={mockActivities} initialDate="2026-11-01" />);

    const nov10Cell = screen.getByTestId("calendar-day-2026-11-10");
    // Has 3 activities, displays first 2 + '+1 more'
    expect(within(nov10Cell).getByText("Beach Volleyball")).toBeInTheDocument();
    expect(within(nov10Cell).getByText("Seafood Lunch")).toBeInTheDocument();
    expect(within(nov10Cell).getByText("+1 more")).toBeInTheDocument();
  });

  it("visually indicates dates containing scheduled activities", () => {
    render(<CalendarView activities={mockActivities} initialDate="2026-11-01" />);

    expect(screen.getByTestId("activity-dot-2026-11-10")).toBeInTheDocument();
    expect(screen.getByTestId("activity-dot-2026-11-11")).toBeInTheDocument();
    expect(screen.queryByTestId("activity-dot-2026-11-12")).not.toBeInTheDocument();
  });

  it("displays activity details when a date with activities is clicked", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <CalendarView
        activities={mockActivities}
        initialDate="2026-11-01"
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const nov10Cell = screen.getByTestId("calendar-day-2026-11-10");
    await userEvent.click(nov10Cell);

    // Selected cell is highlighted
    expect(nov10Cell).toHaveClass("ring-2");
    expect(nov10Cell).toHaveAttribute("aria-pressed", "true");

    // Details section shows all 3 activities for that date with details
    const detailsSection = screen.getByTestId("selected-date-section");
    expect(within(detailsSection).getByText("Beach Volleyball")).toBeInTheDocument();
    expect(within(detailsSection).getByText("Seafood Lunch")).toBeInTheDocument();
    expect(within(detailsSection).getByText("Sunset Walk")).toBeInTheDocument();
    expect(within(detailsSection).getByText("📍 Baga Beach")).toBeInTheDocument();
    expect(within(detailsSection).getByText("Bring sunscreen")).toBeInTheDocument();

    // Edit and Delete handlers
    const editButtons = within(detailsSection).getAllByText("Edit");
    const deleteButtons = within(detailsSection).getAllByText("Delete");
    await userEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(mockActivities[0]);
    await userEvent.click(deleteButtons[1]);
    expect(onDelete).toHaveBeenCalledWith(mockActivities[1]);
  });

  it("displays 'No activities scheduled for this date.' when clicking a date without activities", async () => {
    render(<CalendarView activities={mockActivities} initialDate="2026-11-01" />);

    const nov15Cell = screen.getByTestId("calendar-day-2026-11-15");
    await userEvent.click(nov15Cell);

    expect(
      screen.getByText("No activities scheduled for this date.")
    ).toBeInTheDocument();
  });

  it("ensures date selection works correctly when navigating between months and provides jump back / clear options", async () => {
    render(<CalendarView activities={mockActivities} initialDate="2026-11-01" />);

    // Select Nov 10
    await userEvent.click(screen.getByTestId("calendar-day-2026-11-10"));
    const detailsSection = screen.getByTestId("selected-date-section");
    expect(within(detailsSection).getByText("Beach Volleyball")).toBeInTheDocument();

    // Navigate to December
    fireEvent.click(screen.getByRole("button", { name: "Next Month" }));
    expect(screen.getByText("December 2026")).toBeInTheDocument();

    // Notice appears indicating date is from another month
    expect(
      screen.getByText(/Selected date is from November 2026/i)
    ).toBeInTheDocument();

    // Click "View month" jumps back to November
    await userEvent.click(screen.getByRole("button", { name: "View month" }));
    expect(screen.getByText("November 2026")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-day-2026-11-10")).toHaveAttribute("aria-pressed", "true");

    // Click "Clear" removes the selection
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByText("Select a date from the calendar to view its scheduled activities.")).toBeInTheDocument();
  });

  it("handles missing or invalid activity dates safely without errors", () => {
    const invalidActivities = [
      { id: 1, title: "No Date Activity", date: null },
      { id: 2, title: "Empty Date Activity", date: "" },
      { id: 3, title: "Bogus Date Activity", date: "not-a-date" },
      { id: 4, title: "Out of range Month", date: "2026-99-99" },
      { id: 5, title: "Valid Activity", date: "2026-11-12", time: "14:00" },
    ];

    render(
      <CalendarView
        activities={invalidActivities}
        initialDate="invalid-initial-date"
        initialSelectedDate="invalid-selected-date"
      />
    );

    // Falls back safely to current month without throwing
    const now = new Date();
    const currentMonthName = now.toLocaleDateString("en-US", { month: "long" });
    const currentYear = now.getFullYear();
    expect(screen.getByText(`${currentMonthName} ${currentYear}`)).toBeInTheDocument();
  });

  it("handles trip start and end dates by marking range without restricting navigation or selection", async () => {
    render(
      <CalendarView
        activities={mockActivities}
        initialDate="2026-11-01"
        tripStartDate="2026-11-08"
        tripEndDate="2026-11-15"
      />
    );

    // Days in range have data-in-trip-range="true"
    const inRangeDay = screen.getByTestId("calendar-day-2026-11-10");
    expect(inRangeDay).toHaveAttribute("data-in-trip-range", "true");

    // Days outside range do not have data-in-trip-range="true"
    const outOfRangeDay = screen.getByTestId("calendar-day-2026-11-02");
    expect(outOfRangeDay).not.toHaveAttribute("data-in-trip-range");

    // Outside range day is still clickable and functional
    await userEvent.click(outOfRangeDay);
    expect(outOfRangeDay).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("No activities scheduled for this date.")).toBeInTheDocument();

    // User can navigate away freely
    fireEvent.click(screen.getByRole("button", { name: "Next Month" }));
    expect(screen.getByText("December 2026")).toBeInTheDocument();
  });

  it("conforms to accessibility standards with proper ARIA attributes and valid HTML structure", () => {
    render(<CalendarView activities={mockActivities} initialDate="2026-11-01" />);

    const dayButtons = screen.getAllByRole("button").filter((btn) =>
      btn.getAttribute("data-testid")?.startsWith("calendar-day-")
    );
    expect(dayButtons.length).toBe(30);

    for (const btn of dayButtons) {
      // Must have aria-label and aria-pressed
      expect(btn).toHaveAttribute("aria-label");
      expect(btn).toHaveAttribute("aria-pressed");
      // Must not contain any block-level <div> tags inside the button
      const innerDivs = btn.querySelectorAll("div");
      expect(innerDivs).toHaveLength(0);
    }
  });

  it("renders responsive weekday headers with short and full names", () => {
    render(<CalendarView activities={mockActivities} initialDate="2026-11-01" />);
    // Check that Sun/Sunday both exist in the DOM with responsive classes
    expect(screen.getByText("Sun")).toHaveClass("sm:hidden");
    expect(screen.getByText("Sunday")).toHaveClass("hidden", "sm:inline");
  });

  describe("asynchronously loaded activities", () => {
    it("updates the calendar to the first activity's month when activities are initially empty and load later", () => {
      const { rerender } = render(<CalendarView activities={[]} />);

      // Initially on current month
      const now = new Date();
      const currentMonthName = now.toLocaleDateString("en-US", { month: "long" });
      const currentYear = now.getFullYear();
      expect(screen.getByText(`${currentMonthName} ${currentYear}`)).toBeInTheDocument();

      // Activities arrive asynchronously with a date in July 2027
      const asyncActivities = [
        { id: 10, title: "Summer Hike", date: "2027-07-20", time: "09:00" },
      ];
      rerender(<CalendarView activities={asyncActivities} />);

      // Calendar moves to the first activity's month (July 2027)
      expect(screen.getByText("July 2027")).toBeInTheDocument();
      expect(screen.getByTestId("calendar-day-2027-07-20")).toBeInTheDocument();
    });

    it("does not override user manual navigation when activities are subsequently loaded", () => {
      const { rerender } = render(<CalendarView activities={[]} />);

      // User manually navigates
      fireEvent.click(screen.getByRole("button", { name: "Next Month" }));

      const now = new Date();
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonthName = nextMonthDate.toLocaleDateString("en-US", { month: "long" });
      const nextMonthYear = nextMonthDate.getFullYear();
      expect(screen.getByText(`${nextMonthName} ${nextMonthYear}`)).toBeInTheDocument();

      // Activities arrive asynchronously later
      const asyncActivities = [
        { id: 10, title: "Summer Hike", date: "2027-07-20", time: "09:00" },
      ];
      rerender(<CalendarView activities={asyncActivities} />);

      // Calendar remains on the month user navigated to
      expect(screen.getByText(`${nextMonthName} ${nextMonthYear}`)).toBeInTheDocument();
    });

    it("preserves priority of a valid initialDate or tripStartDate over asynchronous activities", () => {
      const { rerender } = render(
        <CalendarView activities={[]} tripStartDate="2026-11-01" tripEndDate="2026-11-10" />
      );

      expect(screen.getByText("November 2026")).toBeInTheDocument();

      // Activities arrive asynchronously with a different month
      const asyncActivities = [
        { id: 10, title: "Spring Festival", date: "2027-03-15", time: "10:00" },
      ];
      rerender(
        <CalendarView
          activities={asyncActivities}
          tripStartDate="2026-11-01"
          tripEndDate="2026-11-10"
        />
      );

      // Calendar stays on the tripStartDate month (November 2026)
      expect(screen.getByText("November 2026")).toBeInTheDocument();
    });
  });
});
