
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import TripDetailsPage from "./TripDetailsPage.jsx";
import { getTrip, getActivities, deleteTrip } from "../services/api.js";

vi.mock("../services/api.js", () => ({
  createActivity: vi.fn(),
  deleteActivity: vi.fn(),
  deleteTrip: vi.fn(),
  getActivities: vi.fn(),
  getTrip: vi.fn(),
  updateActivity: vi.fn(),
}));

const trip = {
  id: 1,
  name: "Goa Trip",
  destination: "Goa",
  start_date: "2026-11-10",
  end_date: "2026-11-14",
  budget: 20000,
  status: "upcoming",
};

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/trips/1"]}>
      <Routes>
        <Route path="/trips/:id" element={<TripDetailsPage />} />
        <Route path="/" element={<p>Trips list</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TripDetailsPage deletion", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.spyOn(window, "confirm").mockReturnValue(true);

    getTrip.mockResolvedValue(trip);
    getActivities.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows an error when deletion fails and allows retrying", async () => {
    const user = userEvent.setup();

    deleteTrip
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(undefined);

    renderPage();

    // Wait for trip details to load
    expect(await screen.findByText("Goa Trip")).toBeInTheDocument();

    // First deletion attempt fails
    await user.click(screen.getByRole("button", { name: "Delete trip" }));

    expect(
      await screen.findByText(
        "Unable to delete the trip. Please try again."
      )
    ).toBeInTheDocument();

    // Trip should still be visible
    expect(screen.getByText("Goa Trip")).toBeInTheDocument();

    // Retry deletion
    await user.click(screen.getByRole("button", { name: "Delete trip" }));

    // Successful retry should navigate to the trips list
    expect(await screen.findByText("Trips list")).toBeInTheDocument();

    await waitFor(() => {
      expect(deleteTrip).toHaveBeenCalledTimes(2);
    });
  });
});
