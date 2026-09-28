import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import TripForm from "./TripForm.jsx";

function renderForm(onSubmit) {
  render(
    <MemoryRouter>
      <TripForm submitLabel="Create trip" onSubmit={onSubmit} cancelTo="/" />
    </MemoryRouter>
  );
}

async function fillForm() {
  await userEvent.type(screen.getByLabelText("Trip name"), "Goa Trip");
  await userEvent.type(screen.getByLabelText("Destination"), "Goa");
  await userEvent.type(screen.getByLabelText("Start date"), "2026-11-10");
  await userEvent.type(screen.getByLabelText("End date"), "2026-11-14");
  await userEvent.type(screen.getByLabelText(/Budget/), "20000");
}

describe("TripForm", () => {
  it("submits the entered values with a numeric budget", async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    renderForm(onSubmit);

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Create trip" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Goa Trip",
      destination: "Goa",
      start_date: "2026-11-10",
      end_date: "2026-11-14",
      budget: 20000,
      description: "",
    });
  });

  it("shows the error returned by the server", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("End date cannot be before start date"));
    renderForm(onSubmit);

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Create trip" }));

    expect(await screen.findByText("End date cannot be before start date")).toBeInTheDocument();
  });
});
