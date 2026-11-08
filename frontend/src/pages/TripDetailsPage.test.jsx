import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TripDetailsPage from "./TripDetailsPage.jsx";
import {
  createExpense,
  deleteActivity,
  deleteExpense,
  deleteDocument,
  downloadDocument,
  deleteTrip,
  getActivities,
  getDocuments,
  getExpenses,
  getTrip,
  getTripLocation,
  getWeather,
  updateExpense,
  uploadDocument,
} from "../services/api.js";

vi.mock("../services/api.js");

const trip = {
  id: 1,
  name: "Goa Trip",
  destination: "Goa",
  start_date: "2026-11-10",
  end_date: "2026-11-14",
  budget: 20000,
  description: "Weekend trip with friends",
  reminder_days: 3,
  timezone: "America/New_York",
  status: "upcoming",
};

const activities = [
  {
    id: 1,
    title: "Visit Museum",
    date: "2026-11-10",
    time: "10:00",
    location: "City Center",
    notes: "",
  },
  {
    id: 2,
    title: "Dinner",
    date: "2026-11-11",
    time: "20:00",
    location: "Beach Road",
    notes: "",
  },
];

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

describe("TripDetailsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getTrip.mockResolvedValue(trip);
    getActivities.mockResolvedValue([]);
    getExpenses.mockResolvedValue([]);
    getDocuments.mockResolvedValue([]);
    getWeather.mockResolvedValue({
      temperature: 28,
      condition: "Clear sky",
      humidity: 60,
      wind_speed: 10,
      units: { temperature: "°C", wind_speed: "km/h" },
    });
    getTripLocation.mockResolvedValue({ latitude: 17.385, longitude: 78.4867 });
    downloadDocument.mockImplementation((documentId) => `/api/documents/${documentId}/download`);
  });

  it("does not delete the trip when confirmation is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Delete trip" }));

    expect(window.confirm).toHaveBeenCalledWith(
      "Are you sure you want to delete this trip? All activities associated with this trip will also be deleted."
    );
    expect(deleteTrip).not.toHaveBeenCalled();
    expect(screen.getByText("Goa Trip")).toBeInTheDocument();
  });

  it("deletes the trip after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    deleteTrip.mockResolvedValue({});
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Delete trip" }));

    await waitFor(() => {
      expect(deleteTrip).toHaveBeenCalledWith("1");
    });
    expect(await screen.findByText("Trips list")).toBeInTheDocument();
  });

  it("shows an error and allows retry when deleting the trip fails", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    deleteTrip.mockRejectedValueOnce(new Error("Server error")).mockResolvedValueOnce({});
    renderPage();

    const deleteButton = await screen.findByRole("button", { name: "Delete trip" });
    await userEvent.click(deleteButton);

    expect(await screen.findByText("Unable to delete the trip. Please try again.")).toBeInTheDocument();
    expect(screen.getByText("Goa Trip")).toBeInTheDocument();

    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(deleteTrip).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText("Trips list")).toBeInTheDocument();
  });

  it("displays a formatted zero budget", async () => {
    getTrip.mockResolvedValue({ ...trip, budget: 0 });
    renderPage();

    expect(await screen.findByRole("heading", { name: "Budget" })).toBeInTheDocument();
    expect(screen.getByText("Total trip budget")).toBeInTheDocument();
    expect(screen.getByText("₹0")).toBeInTheDocument();
  });

  it("offers an itinerary PDF export", async () => {
    renderPage();

    const exportLink = await screen.findByRole("link", { name: "Export PDF" });
    expect(exportLink).toHaveAttribute("href", "/api/trips/1/itinerary.pdf");
  });

  it("offers an activities CSV export", async () => {
    renderPage();

    const exportLink = await screen.findByRole("link", { name: "Export CSV" });
    expect(exportLink).toHaveAttribute("href", "/api/trips/1/activities.csv");
  });

  it("displays the trip reminder setting", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Trip reminder" })).toBeInTheDocument();
    expect(screen.getByText("Remind me 3 days before the trip")).toBeInTheDocument();
  });

  it("displays the trip timezone", async () => {
    renderPage();

    expect(await screen.findByText("America/New_York")).toBeInTheDocument();
  });

  it("displays weather information", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Weather" })).toBeInTheDocument();
    expect(await screen.findByText("Clear sky")).toBeInTheDocument();
    expect(screen.getByText("28°C")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("10 km/h")).toBeInTheDocument();
  });

  it("shows a loading state while weather is being fetched", async () => {
    let resolveWeather;
    getWeather.mockReturnValue(
      new Promise((resolve) => {
        resolveWeather = resolve;
      })
    );
    renderPage();

    expect(await screen.findByText("Loading weather...")).toBeInTheDocument();
    resolveWeather({
      temperature: 28,
      condition: "Clear sky",
      humidity: 60,
      wind_speed: 10,
      units: { temperature: "°C", wind_speed: "km/h" },
    });
    expect(await screen.findByText("Clear sky")).toBeInTheDocument();
  });

  it("shows a useful message when weather is unavailable", async () => {
    getWeather.mockRejectedValue(new Error("Weather unavailable"));
    renderPage();

    expect(await screen.findByText("Weather information is unavailable.")).toBeInTheDocument();
  });

  it("displays an interactive destination map", async () => {
    renderPage();

    const map = await screen.findByTitle("Map showing Goa");
    expect(map).toHaveAttribute("src", expect.stringContaining("marker=17.385%2C78.4867"));
    expect(screen.getAllByText("Goa")).toHaveLength(2);
  });

  it("shows a useful message when the destination cannot be mapped", async () => {
    getTripLocation.mockRejectedValue(new Error("Unknown destination"));
    renderPage();

    expect(await screen.findByText("Map location is unavailable.")).toBeInTheDocument();
  });

  it("filters activities by title or location as the user types", async () => {
    getActivities.mockResolvedValue(activities);
    renderPage();

    expect(await screen.findByText("Visit Museum")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Search activities"), "MUSEUM");

    expect(screen.getByText("Visit Museum")).toBeInTheDocument();
    expect(screen.queryByText("Beach Road")).not.toBeInTheDocument();
    expect(screen.queryByText("Dinner")).not.toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText("Search activities"));
    await userEvent.type(screen.getByLabelText("Search activities"), "BEACH");
    expect(screen.getByText("Dinner")).toBeInTheDocument();
    expect(screen.queryByText("Visit Museum")).not.toBeInTheDocument();
  });

  it("shows a message when the activity search has no matches", async () => {
    getActivities.mockResolvedValue(activities);
    renderPage();

    await screen.findByText("Visit Museum");
    await userEvent.type(screen.getByLabelText("Search activities"), "park");

    expect(screen.getByText("No activities found.")).toBeInTheDocument();
  });

  it("adds, edits, and deletes expenses", async () => {
    const expense = {
      id: 1,
      title: "Hotel",
      amount: 5000,
      category: "Accommodation",
      date: "2026-11-11",
      notes: "Two nights",
    };
    getExpenses
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([expense])
      .mockResolvedValueOnce([expense])
      .mockResolvedValueOnce([]);
    createExpense.mockResolvedValue(expense);
    updateExpense.mockResolvedValue({ ...expense, title: "Resort" });
    deleteExpense.mockResolvedValue({});
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Add expense" }));
    await userEvent.type(screen.getByLabelText("Expense title"), "Hotel");
    await userEvent.type(screen.getByLabelText("Amount (₹)"), "5000");
    await userEvent.type(screen.getByLabelText("Category"), "Accommodation");
    await userEvent.type(screen.getByLabelText("Date"), "2026-11-11");
    await userEvent.click(screen.getByRole("button", { name: "Add expense" }));

    await waitFor(() =>
      expect(createExpense).toHaveBeenCalledWith("1", {
        title: "Hotel",
        amount: 5000,
        category: "Accommodation",
        date: "2026-11-11",
        notes: "",
      })
    );
    expect(await screen.findByText("Hotel")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Save expense" }));
    await waitFor(() => expect(updateExpense).toHaveBeenCalled());

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(deleteExpense).toHaveBeenCalledWith(1));
  });

  it("uploads, downloads, and removes travel documents", async () => {
    const document = {
      id: 1,
      document_name: "flight.pdf",
      document_type: "Flight ticket",
      uploaded_at: "2026-11-09 02:00:00",
    };
    getDocuments.mockResolvedValueOnce([]).mockResolvedValueOnce([document]).mockResolvedValueOnce([]);
    uploadDocument.mockResolvedValue(document);
    deleteDocument.mockResolvedValue({});
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage();

    await screen.findByRole("heading", { name: "Documents" });
    const file = new File(["ticket"], "flight.pdf", { type: "application/pdf" });
    await userEvent.selectOptions(screen.getByLabelText("Document type"), "Flight ticket");
    await userEvent.upload(screen.getByLabelText("File"), file);

    await waitFor(() => expect(uploadDocument).toHaveBeenCalledWith("1", file, "Flight ticket"));
    expect(await screen.findByText("flight.pdf")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download" })).toHaveAttribute(
      "href",
      "/api/documents/1/download"
    );

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(deleteDocument).toHaveBeenCalledWith(1));
  });

  it("shows Deleting and prevents duplicate activity delete requests", async () => {
    const activity = {
      id: 3,
      title: "Visit Fort",
      date: "2026-11-10",
      time: "10:00",
      location: "Old Fort",
      notes: "",
    };
    let resolveDelete;
    getActivities.mockResolvedValue([activity]);
    deleteActivity.mockReturnValue(
      new Promise((resolve) => {
        resolveDelete = resolve;
      })
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage();

    const deleteButton = await screen.findByRole("button", { name: "Delete" });
    await userEvent.click(deleteButton);
    await userEvent.click(screen.getByRole("button", { name: "Deleting..." }));

    expect(deleteActivity).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();
    resolveDelete();
    await waitFor(() => expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled());
  });
});
