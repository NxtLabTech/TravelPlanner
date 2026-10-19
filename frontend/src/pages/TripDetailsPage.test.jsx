
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TripDetailsPage from "./TripDetailsPage.jsx";
import {
  getTrip,
  getActivities,
  getTripWeather,
} from "../services/api.js";

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

const weatherData = {
  destination: "Goa",
  temperature: 29,
  condition: "Partly cloudy",
  humidity: 75,
  wind_speed: 12,
  units: {
    temperature: "°C",
    wind_speed: "km/h",
  },
};

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/trips/1"]}>
      <Routes>
        <Route path="/trips/:id" element={<TripDetailsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TripDetailsPage weather", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    getTrip.mockResolvedValue(goaTrip);
    getActivities.mockResolvedValue([]);
    getTripWeather.mockResolvedValue(weatherData);
  });

  
it("shows a loading message while weather is being fetched", async () => {
  getTripWeather.mockReturnValue(new Promise(() => {}));

  renderPage();

  expect(await screen.findByText("Weather in Goa")).toBeInTheDocument();
  expect(screen.getByText("Loading weather...")).toBeInTheDocument();
});


  it("displays weather details when the API succeeds", async () => {
    renderPage();

    expect(await screen.findByText("29°C")).toBeInTheDocument();
    expect(screen.getByText("Partly cloudy")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("12 km/h")).toBeInTheDocument();
  });

  it("shows a friendly message when weather cannot be loaded", async () => {
    getTripWeather.mockRejectedValue(
      new Error("Weather service unavailable")
    );

    renderPage();

    expect(
      await screen.findByText(
        "Weather information is currently unavailable."
      )
    ).toBeInTheDocument();
  });
});
