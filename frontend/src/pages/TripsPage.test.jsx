import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TripsPage from "./TripsPage.jsx";
import { getTrips } from "../services/api.js";

vi.mock("../services/api.js");

const goaTrip = {
  id: 1,
  name: "Goa Trip",
  destination: "Goa",
  start_date: "2026-11-10",
  end_date: "2026-11-14",
  budget: 20000,
  status: "upcoming",
};

function paginated(trips, page = 1, total = trips.length, totalPages = 1) {
  return { trips, page, limit: 10, total, total_pages: totalPages };
}

function renderPage() {
  render(
    <MemoryRouter>
      <TripsPage />
    </MemoryRouter>
  );
}

describe("TripsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists trips with their details", async () => {
    getTrips.mockResolvedValue(paginated([goaTrip]));
    renderPage();

    expect(await screen.findByText("Goa Trip")).toBeInTheDocument();
    expect(screen.getByText("₹20,000")).toBeInTheDocument();
    expect(screen.getByText("upcoming")).toBeInTheDocument();
  });

  it("shows a message when no trips are found", async () => {
    getTrips.mockResolvedValue(paginated([]));
    renderPage();
    expect(await screen.findByText("No trips found.")).toBeInTheDocument();
  });

  it("shows the error when loading fails", async () => {
    getTrips.mockRejectedValue(new Error("Database error"));
    renderPage();
    expect(await screen.findByText("Database error")).toBeInTheDocument();

  });

  it("asks the API for matching trips when searching and selecting a filter", async () => {
    getTrips.mockResolvedValue(paginated([]));
    renderPage();

    await userEvent.type(screen.getByLabelText("Search trips"), "goa");
    await userEvent.click(screen.getByRole("tab", { name: "Ongoing" }));

    await waitFor(() =>
      expect(getTrips).toHaveBeenLastCalledWith({ search: "goa", status: "ongoing", page: 1, limit: 10 })
    );
  });

  it("shows and updates the selected trip filter", async () => {
    getTrips.mockResolvedValue(paginated([]));
    renderPage();

    expect(screen.getByRole("tab", { name: "All Trips" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Upcoming" })).toHaveAttribute("aria-selected", "false");

    await userEvent.click(screen.getByRole("tab", { name: "Upcoming" }));

    expect(screen.getByRole("tab", { name: "Upcoming" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("No trips found.")).toBeInTheDocument();
  });

  it("navigates between pages", async () => {
    getTrips
      .mockResolvedValueOnce(paginated([goaTrip], 1, 11, 2))
      .mockResolvedValueOnce(paginated([], 2, 11, 2));
    renderPage();

    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText("Page 2 of 2")).toBeInTheDocument();
    expect(getTrips).toHaveBeenLastCalledWith({ search: "", status: "", page: 2, limit: 10 });
    expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});
