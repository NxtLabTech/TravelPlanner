import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ActivityCalendar from "./ActivityCalendar.jsx";

const activities = [
  { id: 1, title: "Visit Museum", date: "2026-11-10", time: "10:00", location: "City Center" },
  { id: 2, title: "Dinner", date: "2026-11-11", time: "20:00", location: "Beach Road" },
];

describe("ActivityCalendar", () => {
  it("shows activities on their dates and lets users select a date", async () => {
    render(
      <ActivityCalendar
        activities={activities}
        startDate="2026-11-10"
        endDate="2026-11-14"
      />
    );

    expect(screen.getByText("Visit Museum")).toBeInTheDocument();
    expect(screen.getAllByText("1 activity")).toHaveLength(2);

    await userEvent.click(screen.getByRole("button", { name: "11 Nov 2026" }));

    expect(screen.getByText("Dinner")).toBeInTheDocument();
    expect(screen.getByText("Activities on 11 Nov 2026")).toBeInTheDocument();
    expect(screen.queryByText("Visit Museum")).not.toBeInTheDocument();
  });

  it("shows an empty state for a selected date without activities", async () => {
    render(
      <ActivityCalendar
        activities={activities}
        startDate="2026-11-10"
        endDate="2026-11-14"
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "12 Nov 2026" }));

    expect(screen.getByText("No activities on this date.")).toBeInTheDocument();
  });
});
