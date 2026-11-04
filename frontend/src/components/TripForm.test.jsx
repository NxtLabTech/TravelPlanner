import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import TripForm from "./TripForm.jsx";

function renderForm(onSubmit, initialTrip) {
  render(
    <MemoryRouter>
      <TripForm submitLabel="Create trip" onSubmit={onSubmit} cancelTo="/" initialTrip={initialTrip} />
    </MemoryRouter>
  );
}

const field = {
  name: () => screen.getByRole("textbox", { name: "Trip name" }),
  destination: () => screen.getByRole("textbox", { name: "Destination" }),
  startDate: () => screen.getByLabelText(/^Start date/),
  endDate: () => screen.getByLabelText(/^End date/),
  budget: () => screen.getByRole("textbox", { name: /^Budget/ }),
};

async function fillForm() {
  await userEvent.type(field.name(), "Goa Trip");
  await userEvent.type(field.destination(), "Goa");
  await userEvent.type(field.startDate(), "2026-11-10");
  await userEvent.clear(field.endDate());
  await userEvent.type(field.endDate(), "2026-11-14");
  await userEvent.type(field.budget(), "20000");
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
    const onSubmit = vi.fn().mockRejectedValue(new Error("Something went wrong on the server"));
    renderForm(onSubmit);

    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Create trip" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong on the server");
  });

  it("shows an error under each missing required field and focuses the first", async () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);

    await userEvent.type(field.destination(), "Goa");
    await userEvent.click(screen.getByRole("button", { name: "Create trip" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Trip name is required")).toBeInTheDocument();
    expect(screen.getByText("Start date is required")).toBeInTheDocument();
    expect(screen.getByText("End date is required")).toBeInTheDocument();
    expect(screen.queryByText("Destination is required")).not.toBeInTheDocument();
    expect(field.name()).toHaveFocus();
    expect(field.name()).toHaveAccessibleDescription("Trip name is required");
  });

  it("clears a field's error once it is edited", async () => {
    renderForm(vi.fn());
    await userEvent.click(screen.getByRole("button", { name: "Create trip" }));
    await userEvent.type(field.name(), "G");
    expect(screen.queryByText("Trip name is required")).not.toBeInTheDocument();
    expect(screen.getByText("Destination is required")).toBeInTheDocument();
  });

  it("treats a name of only spaces as missing", async () => {
    renderForm(vi.fn());
    await userEvent.type(field.name(), "   ");
    await userEvent.click(screen.getByRole("button", { name: "Create trip" }));
    expect(screen.getByText("Trip name is required")).toBeInTheDocument();
  });

  it("marks required and optional fields", () => {
    renderForm(vi.fn());
    expect(screen.getByText("Trip name").closest("label")).toHaveTextContent("Trip name *");
    expect(screen.getByText("Description").closest("label")).toHaveTextContent("Description (optional)");
  });

  it("fills in the end date from the start date and shows the trip length", async () => {
    renderForm(vi.fn());
    await userEvent.type(field.startDate(), "2026-11-10");
    expect(field.endDate()).toHaveValue("2026-11-10");
    expect(screen.getByText("1 day")).toBeInTheDocument();

    await userEvent.clear(field.endDate());
    await userEvent.type(field.endDate(), "2026-11-14");
    expect(screen.getByText("5 days")).toBeInTheDocument();
  });

  it("keeps a later end date when the start date changes", async () => {
    renderForm(vi.fn(), {
      name: "Goa Trip",
      destination: "Goa",
      start_date: "2026-11-10",
      end_date: "2026-11-14",
      budget: 0,
      description: "",
    });
    await userEvent.clear(field.startDate());
    await userEvent.type(field.startDate(), "2026-11-12");
    expect(field.endDate()).toHaveValue("2026-11-14");
  });

  it("only accepts numbers in the budget and shows it formatted", async () => {
    renderForm(vi.fn());
    await userEvent.type(field.budget(), "2e0-00.555");
    expect(field.budget()).toHaveValue("2000.55");
    expect(screen.getByText("₹2,000.55")).toBeInTheDocument();
  });

  it("shows an existing budget when editing and treats 0 as empty", () => {
    const trip = { name: "Goa", destination: "Goa", start_date: "2026-11-10", end_date: "2026-11-14", description: "" };
    renderForm(vi.fn(), { ...trip, budget: 20000 });
    expect(field.budget()).toHaveValue("20000");
  });
});
