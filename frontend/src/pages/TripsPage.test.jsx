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
    getTrips.mockResolvedValue([goaTrip]);
    renderPage();

    expect(await screen.findByText("Goa Trip")).toBeInTheDocument();
    expect(screen.getByText("₹20,000")).toBeInTheDocument();
    expect(screen.getByText("upcoming")).toBeInTheDocument();
  });

  it("shows a message when no trips are found", async () => {
    getTrips.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText("No trips found.")).toBeInTheDocument();
  });

  it("shows the error when loading fails", async () => {
    getTrips.mockRejectedValue(new Error("Database error"));
    renderPage();
    expect(await screen.findByText("Database error")).toBeInTheDocument();
  });

  it("asks the API for matching trips when searching and filtering", async () => {
    getTrips.mockResolvedValue([]);
    renderPage();

    await userEvent.type(screen.getByLabelText("Search trips"), "goa");
    await userEvent.selectOptions(screen.getByLabelText("Filter by status"), "ongoing");

    await waitFor(() => expect(getTrips).toHaveBeenLastCalledWith({ search: "goa", status: "ongoing" }));
  });
});
