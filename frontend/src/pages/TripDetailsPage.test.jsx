import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TripDetailsPage from "./TripDetailsPage.jsx";
import { getActivities, getTrip } from "../services/api.js";
import * as csvModule from "../csv.js";

vi.mock("../services/api.js");

const mockTrip = {
  id: 1,
  name: "Goa Trip",
  destination: "Goa",
  start_date: "2026-11-10",
  end_date: "2026-11-14",
  budget: 20000,
  description: "A fun weekend trip",
  status: "upcoming",
};

const mockActivities = [
  {
    id: 101,
    trip_id: 1,
    title: "Visit Baga Beach",
    date: "2026-11-10",
    time: "10:00",
    location: "Baga Beach",
    notes: "Morning walk",
  },
];

function renderPage(tripId = "1") {
  return render(
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

  it("renders trip details, activities, and the Export CSV button", async () => {
    getTrip.mockResolvedValue(mockTrip);
    getActivities.mockResolvedValue(mockActivities);

    renderPage();

    expect(await screen.findByText("Goa Trip")).toBeInTheDocument();
    expect(screen.getByText("Visit Baga Beach")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export CSV/i })).toBeInTheDocument();
  });

  it("calls exportActivitiesAsCsv when Export CSV button is clicked", async () => {
    getTrip.mockResolvedValue(mockTrip);
    getActivities.mockResolvedValue(mockActivities);
    const exportSpy = vi.spyOn(csvModule, "exportActivitiesAsCsv").mockImplementation(() => {});

    renderPage();

    const exportBtn = await screen.findByRole("button", { name: /Export CSV/i });
    await userEvent.click(exportBtn);

    expect(exportSpy).toHaveBeenCalledTimes(1);
    expect(exportSpy).toHaveBeenCalledWith(mockTrip, mockActivities);

    exportSpy.mockRestore();
  });

  it("handles trips with no activities when exporting CSV", async () => {
    getTrip.mockResolvedValue(mockTrip);
    getActivities.mockResolvedValue([]);
    const exportSpy = vi.spyOn(csvModule, "exportActivitiesAsCsv").mockImplementation(() => {});

    renderPage();

    const exportBtn = await screen.findByRole("button", { name: /Export CSV/i });
    expect(exportBtn).toBeInTheDocument();
    await userEvent.click(exportBtn);

    expect(exportSpy).toHaveBeenCalledTimes(1);
    expect(exportSpy).toHaveBeenCalledWith(mockTrip, []);

    exportSpy.mockRestore();
  });
});
