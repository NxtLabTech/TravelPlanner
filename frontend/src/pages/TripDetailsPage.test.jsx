import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TripDetailsPage from "./TripDetailsPage.jsx";
import {
  createActivity,
  deleteActivity,
  deleteTrip,
  getActivities,
  getTrip,
  updateActivity,
} from "../services/api.js";

vi.mock("../services/api.js");

const mockTrip = {
  id: 1,
  name: "Paris Trip",
  destination: "Paris, France",
  start_date: "2026-11-10",
  end_date: "2026-11-15",
  budget: 50000,
  description: "Autumn visit to museums and cafes",
  status: "upcoming",
};

const mockActivities = [
  { id: 101, title: "Eiffel Tower", date: "2026-11-10", time: "10:00", location: "Champ de Mars", notes: "Pre-booked ticket" },
  { id: 102, title: "Louvre Museum", date: "2026-11-11", time: "14:00", location: "Rue de Rivoli", notes: "See Mona Lisa" },
];

function renderPage(tripId = "1") {
  return render(
    <MemoryRouter initialEntries={[`/trips/${tripId}`]}>
      <Routes>
        <Route path="/trips/:id" element={<TripDetailsPage />} />
        <Route path="/trips/:id/edit" element={<div>Edit Trip Page Mock</div>} />
        <Route path="/" element={<div>Trips List Page Mock</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TripDetailsPage", () => {
  let originalCreateObjectURL;
  let originalRevokeObjectURL;

  beforeEach(() => {
    vi.resetAllMocks();
    originalCreateObjectURL = window.URL.createObjectURL;
    originalRevokeObjectURL = window.URL.revokeObjectURL;
    window.URL.createObjectURL = vi.fn(() => "blob:http://localhost/mock-download-url");
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  describe("9. Export CSV button and download behavior", () => {
    it("renders the Export CSV button alongside other trip actions", async () => {
      getTrip.mockResolvedValue(mockTrip);
      getActivities.mockResolvedValue(mockActivities);

      renderPage();

      expect(await screen.findByRole("button", { name: "Export CSV" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Edit trip" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Delete trip" })).toBeInTheDocument();
    });

    it("triggers CSV download with formatted activities and correct filename when clicked", async () => {
      getTrip.mockResolvedValue(mockTrip);
      getActivities.mockResolvedValue(mockActivities);

      let createdLink = null;
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
        createdLink = this;
      });

      renderPage();

      const exportBtn = await screen.findByRole("button", { name: "Export CSV" });
      await userEvent.click(exportBtn);

      expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
      const createdBlob = window.URL.createObjectURL.mock.calls[0][0];
      expect(createdBlob).toBeInstanceOf(Blob);
      expect(createdBlob.type).toBe("text/csv;charset=utf-8;");

      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(createdLink).not.toBeNull();
      expect(createdLink.getAttribute("download")).toBe("travelplanner-paris-trip.csv");
      expect(createdLink.getAttribute("href")).toBe("blob:http://localhost/mock-download-url");

      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/mock-download-url");
    });

    it("allows exporting a header-only CSV when the trip has no activities", async () => {
      getTrip.mockResolvedValue(mockTrip);
      getActivities.mockResolvedValue([]);

      let createdLink = null;
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
        createdLink = this;
      });

      renderPage();

      const exportBtn = await screen.findByRole("button", { name: "Export CSV" });
      await userEvent.click(exportBtn);

      expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(createdLink.getAttribute("download")).toBe("travelplanner-paris-trip.csv");
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/mock-download-url");
    });
  });

  describe("10. Existing Trip Details functionality remains intact", () => {
    it("displays trip information, status badge, dates, budget, and description", async () => {
      getTrip.mockResolvedValue(mockTrip);
      getActivities.mockResolvedValue(mockActivities);

      renderPage();

      expect(await screen.findByRole("heading", { level: 1, name: "Paris Trip" })).toBeInTheDocument();
      expect(screen.getByText("Paris, France")).toBeInTheDocument();
      expect(screen.getByText("upcoming")).toBeInTheDocument();
      expect(screen.getByText("10 Nov 2026 – 15 Nov 2026")).toBeInTheDocument();
      expect(screen.getByText("₹50,000")).toBeInTheDocument();
      expect(screen.getByText("Autumn visit to museums and cafes")).toBeInTheDocument();
    });

    it("displays activities grouped in the Itinerary component", async () => {
      getTrip.mockResolvedValue(mockTrip);
      getActivities.mockResolvedValue(mockActivities);

      renderPage();

      expect(await screen.findByText("Eiffel Tower")).toBeInTheDocument();
      expect(screen.getByText("Louvre Museum")).toBeInTheDocument();
      expect(screen.getByText("Champ de Mars")).toBeInTheDocument();
      expect(screen.getByText("Rue de Rivoli")).toBeInTheDocument();
    });

    it("displays empty state message when there are no activities", async () => {
      getTrip.mockResolvedValue(mockTrip);
      getActivities.mockResolvedValue([]);

      renderPage();

      expect(await screen.findByText("No activities yet.")).toBeInTheDocument();
    });

    it("allows opening and canceling the Add activity form", async () => {
      getTrip.mockResolvedValue(mockTrip);
      getActivities.mockResolvedValue(mockActivities);

      renderPage();

      const addBtn = await screen.findByRole("button", { name: "Add activity" });
      await userEvent.click(addBtn);

      expect(screen.getByLabelText("Activity title")).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByLabelText("Activity title")).not.toBeInTheDocument();
    });

    it("submits a new activity and reloads activities list", async () => {
      getTrip.mockResolvedValue(mockTrip);
      getActivities.mockResolvedValueOnce(mockActivities);
      createActivity.mockResolvedValue({ id: 103, title: "Montmartre", date: "2026-11-12" });
      getActivities.mockResolvedValueOnce([
        ...mockActivities,
        { id: 103, title: "Montmartre", date: "2026-11-12", time: "", location: "", notes: "" },
      ]);

      renderPage();

      const addBtn = await screen.findByRole("button", { name: "Add activity" });
      await userEvent.click(addBtn);

      await userEvent.type(screen.getByLabelText("Activity title"), "Montmartre");
      await userEvent.type(screen.getByLabelText("Date"), "2026-11-12");

      const submitBtn = screen.getAllByRole("button", { name: "Add activity" }).find(
        (btn) => btn.getAttribute("type") === "submit"
      );
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(createActivity).toHaveBeenCalledWith("1", expect.objectContaining({
          title: "Montmartre",
          date: "2026-11-12",
        }));
      });
    });

    it("deletes an activity after user confirmation", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      getTrip.mockResolvedValue(mockTrip);
      getActivities.mockResolvedValueOnce(mockActivities);
      deleteActivity.mockResolvedValue({ message: "Activity deleted" });
      getActivities.mockResolvedValueOnce([mockActivities[1]]);

      renderPage();

      const deleteButtons = await screen.findAllByRole("button", { name: "Delete" });
      await userEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith('Delete "Eiffel Tower"?');
      expect(deleteActivity).toHaveBeenCalledWith(101);
    });

    it("deletes trip after user confirmation and navigates to trips list", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      getTrip.mockResolvedValue(mockTrip);
      getActivities.mockResolvedValue(mockActivities);
      deleteTrip.mockResolvedValue({ message: "Trip deleted" });

      renderPage();

      const deleteTripBtn = await screen.findByRole("button", { name: "Delete trip" });
      await userEvent.click(deleteTripBtn);

      expect(window.confirm).toHaveBeenCalledWith('Delete "Paris Trip" and all its activities?');
      await waitFor(() => {
        expect(deleteTrip).toHaveBeenCalledWith("1");
        expect(screen.getByText("Trips List Page Mock")).toBeInTheDocument();
      });
    });

    it("displays error message and back link when trip loading fails", async () => {
      getTrip.mockRejectedValue(new Error("Network error loading trip"));
      getActivities.mockResolvedValue([]);

      renderPage();

      expect(await screen.findByText("Network error loading trip")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Back to trips" })).toBeInTheDocument();
    });
  });
});
