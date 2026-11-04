import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TripDetailsPage from "./TripDetailsPage.jsx";
import { getActivities, getTrip } from "../services/api.js";

vi.mock("../services/api.js");

const mockTrip = {
  id: 1,
  name: "Goa Vacation",
  destination: "Goa",
  start_date: "2026-11-10",
  end_date: "2026-11-14",
  budget: 20000,
  status: "upcoming",
  description: "A fun beach vacation",
};

const mockActivities = [
  { id: 1, trip_id: 1, title: "Beach Volleyball", date: "2026-11-10", time: "10:00", location: "Baga Beach", notes: "" },
  { id: 2, trip_id: 1, title: "Dinner", date: "2026-11-10", time: "20:00", location: "Museum Cafe", notes: "" },
  { id: 3, trip_id: 1, title: "Historical Museum Tour", date: "2026-11-11", time: "11:00", location: "Panaji", notes: "" },
];

function renderPage(tripId = "1") {
  render(
    <MemoryRouter initialEntries={[`/trips/${tripId}`]}>
      <Routes>
        <Route path="/trips/:id" element={<TripDetailsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TripDetailsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders trip details, list view, and view switcher", async () => {
    getTrip.mockResolvedValue(mockTrip);
    getActivities.mockResolvedValue(mockActivities);

    renderPage();

    expect(await screen.findByText("Goa Vacation")).toBeInTheDocument();
    expect(await screen.findByText("Beach Volleyball")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "List View" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Calendar View" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search activities" })).toBeInTheDocument();
  });

  it("filters activities by title or location in list view", async () => {
    getTrip.mockResolvedValue(mockTrip);
    getActivities.mockResolvedValue(mockActivities);

    renderPage();

    expect(await screen.findByText("Goa Vacation")).toBeInTheDocument();
    await screen.findByText("Beach Volleyball");

    const searchInput = screen.getByRole("searchbox", { name: "Search activities" });
    await userEvent.type(searchInput, "museum");

    expect(screen.getByText("Dinner")).toBeInTheDocument();
    expect(screen.getByText("Historical Museum Tour")).toBeInTheDocument();
    expect(screen.queryByText("Beach Volleyball")).not.toBeInTheDocument();
  });

  it("switches to Calendar View and displays activities on the calendar", async () => {
    getTrip.mockResolvedValue(mockTrip);
    getActivities.mockResolvedValue(mockActivities);

    renderPage();

    expect(await screen.findByText("Goa Vacation")).toBeInTheDocument();
    await screen.findByText("Beach Volleyball");

    // Switch to Calendar View
    await userEvent.click(screen.getByRole("tab", { name: "Calendar View" }));

    expect(screen.getByText("November 2026")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-day-2026-11-10")).toBeInTheDocument();

    // Click on date 10
    await userEvent.click(screen.getByTestId("calendar-day-2026-11-10"));

    const details = screen.getByTestId("selected-date-section");
    expect(details).toHaveTextContent("Beach Volleyball");
    expect(details).toHaveTextContent("Dinner");
  });
});
