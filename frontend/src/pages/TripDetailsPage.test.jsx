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

  it("renders trip details and activities in the itinerary section", async () => {
    getTrip.mockResolvedValue(mockTrip);
    getActivities.mockResolvedValue(mockActivities);

    renderPage();

    expect(await screen.findByText("Goa Vacation")).toBeInTheDocument();
    expect(screen.getByText("Beach Volleyball")).toBeInTheDocument();
    expect(screen.getByText("Dinner")).toBeInTheDocument();
    expect(screen.getByText("Historical Museum Tour")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search activities" })).toBeInTheDocument();
  });

  it("filters activities by title or location as the user types in the itinerary search field", async () => {
    getTrip.mockResolvedValue(mockTrip);
    getActivities.mockResolvedValue(mockActivities);

    renderPage();

    expect(await screen.findByText("Goa Vacation")).toBeInTheDocument();

    const searchInput = screen.getByRole("searchbox", { name: "Search activities" });
    await userEvent.type(searchInput, "museum");

    // "Dinner" matches location ("Museum Cafe"), "Historical Museum Tour" matches title
    expect(screen.getByText("Dinner")).toBeInTheDocument();
    expect(screen.getByText("Historical Museum Tour")).toBeInTheDocument();
    expect(screen.queryByText("Beach Volleyball")).not.toBeInTheDocument();
  });

  it('shows "No activities found" when searching with no matching results', async () => {
    getTrip.mockResolvedValue(mockTrip);
    getActivities.mockResolvedValue(mockActivities);

    renderPage();

    expect(await screen.findByText("Goa Vacation")).toBeInTheDocument();

    const searchInput = screen.getByRole("searchbox", { name: "Search activities" });
    await userEvent.type(searchInput, "scuba");

    expect(screen.getByText("No activities found")).toBeInTheDocument();
    expect(screen.queryByText("Beach Volleyball")).not.toBeInTheDocument();
    expect(screen.queryByText("Dinner")).not.toBeInTheDocument();
    expect(screen.queryByText("Historical Museum Tour")).not.toBeInTheDocument();
  });
});

