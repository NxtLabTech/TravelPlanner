import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ActivityForm from "./ActivityForm.jsx";

function renderForm(submitLabel, onSubmit) {
  render(
    <ActivityForm
      minDate="2026-11-10"
      maxDate="2026-11-14"
      submitLabel={submitLabel}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
    />
  );
}

describe("ActivityForm", () => {
  it("shows Adding and disables actions while creating", async () => {
    let resolveSubmit;
    const onSubmit = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        })
    );
    renderForm("Add activity", onSubmit);

    await userEvent.type(screen.getByLabelText("Activity title"), "Museum");
    await userEvent.type(screen.getByLabelText("Date"), "2026-11-10");
    await userEvent.click(screen.getByRole("button", { name: "Add activity" }));

    expect(screen.getByRole("button", { name: "Adding..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    resolveSubmit();
    await waitFor(() => expect(screen.getByRole("button", { name: "Add activity" })).toBeEnabled());
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
  });

  it("shows Saving while editing and restores the button after failure", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Save failed"));
    renderForm("Save activity", onSubmit);

    await userEvent.type(screen.getByLabelText("Activity title"), "Museum");
    await userEvent.type(screen.getByLabelText("Date"), "2026-11-10");
    await userEvent.click(screen.getByRole("button", { name: "Save activity" }));

    expect(await screen.findByText("Save failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save activity" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
  });

  it("submits duration in minutes", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm("Add activity", onSubmit);

    await userEvent.type(screen.getByLabelText("Activity title"), "Museum");
    await userEvent.type(screen.getByLabelText("Date"), "2026-11-10");
    await userEvent.type(screen.getByLabelText("Time"), "10:00");
    await userEvent.type(screen.getByLabelText("Duration (minutes)"), "120");
    await userEvent.click(screen.getByRole("button", { name: "Add activity" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 120 })
    ));
  });
});
