import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ActivityForm from "./ActivityForm.jsx";

describe("ActivityForm", () => {
  it("submits the entered values", async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    const onCancel = vi.fn();

    render(
      <ActivityForm
        minDate="2026-11-10"
        maxDate="2026-11-15"
        submitLabel="Add activity"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    await userEvent.type(screen.getByLabelText(/Activity title/i), "Scuba Diving");
    await userEvent.type(screen.getByLabelText(/Date/i), "2026-11-12");
    await userEvent.type(screen.getByLabelText(/Time/i), "09:30");
    await userEvent.type(screen.getByLabelText(/Location/i), "Grand Island");
    await userEvent.type(screen.getByLabelText(/Notes/i), "Bring swimsuit and towel");

    await userEvent.click(screen.getByRole("button", { name: "Add activity" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Scuba Diving",
      date: "2026-11-12",
      time: "09:30",
      location: "Grand Island",
      notes: "Bring swimsuit and towel",
    });
  });

  it("calls onCancel when Cancel button is clicked", async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <ActivityForm
        submitLabel="Add activity"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalled();
  });

  it("shows an error message and re-enables submit button when submission fails", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Failed to save activity"));
    const onCancel = vi.fn();

    render(
      <ActivityForm
        submitLabel="Save activity"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    await userEvent.type(screen.getByLabelText(/Activity title/i), "Museum Tour");
    await userEvent.type(screen.getByLabelText(/Date/i), "2026-11-11");

    await userEvent.click(screen.getByRole("button", { name: "Save activity" }));

    expect(await screen.findByText("Failed to save activity")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save activity" })).not.toBeDisabled();
  });
});
