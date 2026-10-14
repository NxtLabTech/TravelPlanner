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

  it("sorts trips by start date and name immediately", async () => {
    const tripA = {
      id: 1,
      name: "Bhopal Expedition",
      destination: "Bhopal",
      start_date: "2026-12-01",
      end_date: "2026-12-05",
      budget: 15000,
      status: "upcoming",
    };
    const tripB = {
      id: 2,
      name: "Agra Tour",
      destination: "Agra",
      start_date: "2026-10-01",
      end_date: "2026-10-05",
      budget: 10000,
      status: "completed",
    };
    const tripC = {
      id: 3,
      name: "Chennai Getaway",
      destination: "Chennai",
      start_date: "2026-11-15",
      end_date: "2026-11-20",
      budget: 12000,
      status: "upcoming",
    };

    getTrips.mockResolvedValue([tripA, tripB, tripC]);
    renderPage();

    // Default sort: Start date: Earliest first
    // Expected order: Agra Tour (Oct 1), Chennai Getaway (Nov 15), Bhopal Expedition (Dec 1)
    expect(await screen.findByText("Bhopal Expedition")).toBeInTheDocument();
    let tripHeadings = screen.getAllByRole("listitem").map((item) => item.querySelector("p.font-medium")?.textContent);
    expect(tripHeadings).toEqual(["Agra Tour", "Chennai Getaway", "Bhopal Expedition"]);

    // Sort: Start date: Latest first
    await userEvent.selectOptions(screen.getByLabelText("Sort trips"), "start_date_desc");
    tripHeadings = screen.getAllByRole("listitem").map((item) => item.querySelector("p.font-medium")?.textContent);
    expect(tripHeadings).toEqual(["Bhopal Expedition", "Chennai Getaway", "Agra Tour"]);

    // Sort: Name: A–Z
    await userEvent.selectOptions(screen.getByLabelText("Sort trips"), "name_asc");
    tripHeadings = screen.getAllByRole("listitem").map((item) => item.querySelector("p.font-medium")?.textContent);
    expect(tripHeadings).toEqual(["Agra Tour", "Bhopal Expedition", "Chennai Getaway"]);

    // Sort: Name: Z–A
    await userEvent.selectOptions(screen.getByLabelText("Sort trips"), "name_desc");
    tripHeadings = screen.getAllByRole("listitem").map((item) => item.querySelector("p.font-medium")?.textContent);
    expect(tripHeadings).toEqual(["Chennai Getaway", "Bhopal Expedition", "Agra Tour"]);

    // Verify getTrips was called only once on initial render
    expect(getTrips).toHaveBeenCalledTimes(1);
  });
});
