import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewTripPage from "./NewTripPage.jsx";
import EditTripPage from "./EditTripPage.jsx";
import { getTrip } from "../services/api.js";

vi.mock("../services/api.js");

function renderAt(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/trips/new" element={<NewTripPage />} />
        <Route path="/trips/:id/edit" element={<EditTripPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("trip form pages", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("links back to the trips list from the new trip page", () => {
    renderAt("/trips/new");
    expect(screen.getByRole("link", { name: "← All trips" })).toHaveAttribute("href", "/");
  });

  it("links back to the trip from the edit page and fills in the form", async () => {
    getTrip.mockResolvedValue({
      id: 3,
      name: "Goa Trip",
      destination: "Goa",
      start_date: "2026-11-10",
      end_date: "2026-11-14",
      budget: 20000,
      description: "",
    });
    renderAt("/trips/3/edit");

    expect(await screen.findByRole("link", { name: "← Back to trip" })).toHaveAttribute("href", "/trips/3");
    expect(screen.getByRole("textbox", { name: "Trip name" })).toHaveValue("Goa Trip");
    expect(screen.getByRole("textbox", { name: /^Budget/ })).toHaveValue("20000");
  });
});
