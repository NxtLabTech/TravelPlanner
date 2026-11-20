import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TripDetailsPage from "./TripDetailsPage.jsx";
import {
  createActivity,
  deleteActivity,
  getActivities,
  getTrip,
  updateActivity,
} from "../services/api.js";

vi.mock("../services/api.js");

const testTrip = {
  id: 1,
  name: "Goa Vacation",
  destination: "Goa",
  start_date: "2026-11-10",
  end_date: "2026-11-14",
  budget: 20000,
  status: "upcoming",
  description: "Fun trip",
};

const testActivities = [
  { id: 10, trip_id: 1, title: "Beach Volleyball", date: "2026-11-10", time: "10:00", location: "Baga", notes: "" },
  { id: 20, trip_id: 1, title: "Dinner by Sea", date: "2026-11-11", time: "20:00", location: "Anjuna", notes: "" },
];

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/trips/1"]}>
      <Routes>
        <Route path="/trips/:id" element={<TripDetailsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TripDetailsPage Activity Operations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getTrip.mockResolvedValue(testTrip);
    getActivities.mockResolvedValue(testActivities);
  });

  it("handles adding an activity with 'Adding...' loading state", async () => {
    let resolveCreate;
    createActivity.mockImplementation(() => new Promise((resolve) => { resolveCreate = resolve; }));

    renderPage();

    expect(await screen.findByText("Goa Vacation")).toBeInTheDocument();
    expect(screen.getByText("Beach Volleyball")).toBeInTheDocument();

    // Open add activity form
    await userEvent.click(screen.getByRole("button", { name: "Add activity" }));

    // Fill form
    await userEvent.type(screen.getByLabelText("Activity title"), "Sunset Cruise");
    await userEvent.type(screen.getByLabelText("Date"), "2026-11-12");

    const submitBtn = screen.getByRole("button", { name: "Add Activity" });
    await userEvent.click(submitBtn);

    // Verify loading state
    expect(screen.getByRole("button", { name: "Adding..." })).toBeDisabled();
    expect(createActivity).toHaveBeenCalledTimes(1);

    // Resolve create and verify activities reloaded
    const updatedActivities = [
      ...testActivities,
      { id: 30, trip_id: 1, title: "Sunset Cruise", date: "2026-11-12", time: "", location: "", notes: "" },
    ];
    getActivities.mockResolvedValue(updatedActivities);
    resolveCreate({ id: 30 });

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Adding..." })).not.toBeInTheDocument();
    });
  });

  it("handles editing an activity with 'Saving...' loading state", async () => {
    let resolveUpdate;
    updateActivity.mockImplementation(() => new Promise((resolve) => { resolveUpdate = resolve; }));

    renderPage();

    expect(await screen.findByText("Goa Vacation")).toBeInTheDocument();

    // Click Edit on first activity
    const editBtns = screen.getAllByRole("button", { name: "Edit" });
    await userEvent.click(editBtns[0]);

    const saveBtn = screen.getByRole("button", { name: "Save Changes" });
    expect(saveBtn).toBeInTheDocument();

    await userEvent.click(saveBtn);

    // Verify loading state
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(updateActivity).toHaveBeenCalledTimes(1);

    resolveUpdate({});

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Saving..." })).not.toBeInTheDocument();
    });
  });

  it("handles deleting an activity with 'Deleting...' loading state and restores on failure", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    let rejectDelete;
    deleteActivity.mockImplementation(() => new Promise((_, reject) => { rejectDelete = reject; }));

    renderPage();

    expect(await screen.findByText("Goa Vacation")).toBeInTheDocument();

    const deleteBtns = screen.getAllByRole("button", { name: "Delete" });
    await userEvent.click(deleteBtns[0]);

    // Deleting state shown for the clicked activity
    const deletingBtn = screen.getByRole("button", { name: "Deleting..." });
    expect(deletingBtn).toBeDisabled();
    expect(deletingBtn).toHaveAttribute("aria-busy", "true");

    // The other activity's delete button remains enabled
    const remainingDeleteBtn = screen.getByRole("button", { name: "Delete" });
    expect(remainingDeleteBtn).not.toBeDisabled();

    // Reject delete
    rejectDelete(new Error("Failed to delete activity"));

    // Verify error is displayed and button is restored
    expect(await screen.findByText("Failed to delete activity")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Deleting..." })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(2);
  });

  it("does not delete activity if confirmation dialog is canceled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    renderPage();

    expect(await screen.findByText("Goa Vacation")).toBeInTheDocument();

    const deleteBtns = screen.getAllByRole("button", { name: "Delete" });
    await userEvent.click(deleteBtns[0]);

    expect(deleteActivity).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Deleting..." })).not.toBeInTheDocument();
  });
});
