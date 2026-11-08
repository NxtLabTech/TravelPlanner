import { render, screen } from "@testing-library/react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "./App.jsx";
import { getCurrentUser } from "./services/api.js";

vi.mock("./services/api.js", () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  getTrips: vi.fn(),
}));

describe("App authentication", () => {
  it("protects the trip routes when there is no session", async () => {
    getCurrentUser.mockRejectedValue(new Error("Authentication required"));

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(await screen.findByRole("heading", { name: "Log in to TravelPlanner" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "New trip" })).not.toBeInTheDocument();
  });

  it("shows the registration page at the register route", async () => {
    getCurrentUser.mockRejectedValue(new Error("Authentication required"));

    render(
      <MemoryRouter initialEntries={["/register"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Create your TravelPlanner account" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
  });
});
