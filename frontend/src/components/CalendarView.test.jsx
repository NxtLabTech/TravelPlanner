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

    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    const now = new Date();
    const currentMonthName = now.toLocaleDateString("en-US", { month: "long" });
    const currentYear = now.getFullYear();
    expect(screen.getByText(`${currentMonthName} ${currentYear}`)).toBeInTheDocument();
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

  it("ensures date selection works correctly when navigating between months", async () => {
    render(<CalendarView activities={mockActivities} initialDate="2026-11-01" />);

    // Select Nov 10
    await userEvent.click(screen.getByTestId("calendar-day-2026-11-10"));
    const detailsSection = screen.getByTestId("selected-date-section");
    expect(within(detailsSection).getByText("Beach Volleyball")).toBeInTheDocument();

    // Navigate to December
    fireEvent.click(screen.getByRole("button", { name: "Next Month" }));
    expect(screen.getByText("December 2026")).toBeInTheDocument();

    // Select Dec 5 in December
    await userEvent.click(screen.getByTestId("calendar-day-2026-12-05"));
    expect(
      within(detailsSection).getByText("No activities scheduled for this date.")
    ).toBeInTheDocument();

    // Navigate back to November
    fireEvent.click(screen.getByRole("button", { name: "Previous Month" }));
    expect(screen.getByText("November 2026")).toBeInTheDocument();

    // Click Nov 10 again
    await userEvent.click(screen.getByTestId("calendar-day-2026-11-10"));
    expect(within(detailsSection).getByText("Beach Volleyball")).toBeInTheDocument();
  });
});
