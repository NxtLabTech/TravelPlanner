import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ActivityForm from "./ActivityForm.jsx";

describe("ActivityForm", () => {
  it("shows 'Adding...' and disables buttons while adding, then recovers on error", async () => {
    let rejectSubmit;
    const onSubmit = vi.fn(() => new Promise((_, reject) => {
      rejectSubmit = reject;
    }));

    render(
      <ActivityForm
        submitLabel="Add activity"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    await userEvent.type(screen.getByLabelText("Activity title"), "Museum");
    await userEvent.type(screen.getByLabelText("Date"), "2026-11-10");
    await userEvent.click(screen.getByRole("button", { name: "Add activity" }));

    expect(screen.getByRole("button", { name: "Adding..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    rejectSubmit(new Error("Failed to add"));

    expect(await screen.findByText("Failed to add")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add activity" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
  });

  it("shows 'Saving...' and disables buttons while editing an existing activity", async () => {
    const onSubmit = vi.fn(() => new Promise(() => {}));

    render(
      <ActivityForm
        initialActivity={{ id: 5, title: "Beach", date: "2026-11-10", time: "", location: "", notes: "" }}
        submitLabel="Save activity"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Save activity" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    });
  });
});
