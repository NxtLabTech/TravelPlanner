import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TripDetailsPage from "./TripDetailsPage.jsx";
import TripsPage from "./TripsPage.jsx";
import {
  createActivity,
  deleteActivity,
  deleteTrip,
  getActivities,
  getTrip,
  getTrips,
} from "../services/api.js";

vi.mock("../services/api.js");

const trip = {
  id: 1,
  name: "Goa Trip",
  destination: "Goa",
  start_date: "2026-11-10",
  end_date: "2026-11-14",
  budget: 20000,
  description: "",
  status: "upcoming",
};

const beach = {
  id: 7,
  trip_id: 1,
  title: "Beach",
  date: "2026-11-10",
  time: "10:00",
  location: "Baga",
  notes: "Bring sunscreen",
  cost: 500,
  category: "sightseeing",
};

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/trips/1"]}>
      <Routes>
        <Route path="/" element={<TripsPage />} />
        <Route path="/trips/:id" element={<TripDetailsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TripDetailsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getTrip.mockResolvedValue(trip);
    getActivities.mockResolvedValue([beach]);
  });

  it("shows the compact dates and trip length", async () => {
    renderPage();
    expect(await screen.findByText("10 – 14 Nov 2026")).toBeInTheDocument();
    expect(screen.getByText("5 days · 1 activity")).toBeInTheDocument();
    expect(screen.getByText("₹500 of ₹20,000 spent")).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe("Goa Trip · TravelPlanner"));
  });

  it("opens the print dialog", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Print" }));
    expect(print).toHaveBeenCalled();
    print.mockRestore();
  });

  it("asks before deleting an activity and does nothing on cancel", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Delete Beach" }));

    const dialog = screen.getByRole("alertdialog", { name: "Delete activity?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(deleteActivity).not.toHaveBeenCalled();
  });

  it("deletes an activity and can undo it", async () => {
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Delete Beach" }));

    getActivities.mockResolvedValue([]);
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteActivity).toHaveBeenCalledWith(7);
    expect(await screen.findByText('Deleted "Beach"')).toBeInTheDocument();

    getActivities.mockResolvedValue([beach]);
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(createActivity).toHaveBeenCalledWith("1", {
      title: "Beach",
      date: "2026-11-10",
      time: "10:00",
      location: "Baga",
      notes: "Bring sunscreen",
      cost: 500,
      category: "sightseeing",
    });
    expect(await screen.findByRole("button", { name: "Delete Beach" })).toBeInTheDocument();
    expect(screen.queryByText('Deleted "Beach"')).not.toBeInTheDocument();
  });

  it("deletes the trip and says so on the trips page", async () => {
    getTrips.mockResolvedValue([]);
    renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Delete trip" }));

    const dialog = screen.getByRole("alertdialog", { name: "Delete trip?" });
    expect(dialog).toHaveTextContent('"Goa Trip" and its 1 activity will be deleted.');
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteTrip).toHaveBeenCalledWith("1"));
    expect(await screen.findByText('Deleted "Goa Trip"')).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Trips" })).toBeInTheDocument();
  });
});
