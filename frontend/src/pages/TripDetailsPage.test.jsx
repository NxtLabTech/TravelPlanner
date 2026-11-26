import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TripDetailsPage from "./TripDetailsPage.jsx";
import { deleteTrip, getActivities, getTrip } from "../services/api.js";

vi.mock("../services/api.js");

const mockTrip = {
  id: 1,
  name: "Goa Trip",
  destination: "Goa",
  start_date: "2026-11-10",
  end_date: "2026-11-14",
  budget: 20000,
  status: "upcoming",
  description: "Beach vacation",
};

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/trips/1"]}>
      <Routes>
        <Route path="/trips/:id" element={<TripDetailsPage />} />
        <Route path="/" element={<p>Home Page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TripDetailsPage delete confirmation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getTrip.mockResolvedValue(mockTrip);
    getActivities.mockResolvedValue([]);
  });

  it("shows confirmation modal and keeps trip unchanged when cancelled", async () => {
    renderPage();
    expect(await screen.findByText("Goa Trip")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Delete trip" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Are you sure you want to delete this trip? All activities associated with this trip will also be deleted."
      )
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(deleteTrip).not.toHaveBeenCalled();
    expect(screen.getByText("Goa Trip")).toBeInTheDocument();
  });

  it("deletes trip and redirects to home when confirmed", async () => {
    deleteTrip.mockResolvedValue({});
    renderPage();
    expect(await screen.findByText("Goa Trip")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Delete trip" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteTrip).toHaveBeenCalledWith("1"));
    expect(await screen.findByText("Home Page")).toBeInTheDocument();
  });

  it("shows an error message if deletion fails", async () => {
    deleteTrip.mockRejectedValue(new Error("Delete failed"));
    renderPage();
    expect(await screen.findByText("Goa Trip")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Delete trip" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Delete failed")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
