import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ActivityForm from "./ActivityForm.jsx";

const initialActivity = {
  id: 1,
  title: "Visit Fort",
  date: "2026-11-10",
  time: "10:00",
  location: "Old Goa",
  notes: "Historical tour",
};

describe("ActivityForm", () => {
  it("displays 'Add Activity' initially and 'Adding...' while adding an activity", async () => {
    let resolveSubmit;
    const onSubmit = vi.fn(() => new Promise((resolve) => { resolveSubmit = resolve; }));
    render(
      <ActivityForm
        minDate="2026-11-10"
        maxDate="2026-11-14"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole("button", { name: "Add Activity" });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();

    await userEvent.type(screen.getByLabelText("Activity title"), "Beach Walk");
    await userEvent.type(screen.getByLabelText("Date"), "2026-11-10");

    await userEvent.click(submitBtn);

    // During pending request
    expect(screen.getByRole("button", { name: "Adding..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Adding..." })).toHaveAttribute("aria-busy", "true");
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // Duplicate clicks while pending should be prevented
    await userEvent.click(screen.getByRole("button", { name: "Adding..." }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // After completion
    resolveSubmit();
  });

  it("displays 'Save Changes' initially and 'Saving...' while editing an activity", async () => {
    let resolveSubmit;
    const onSubmit = vi.fn(() => new Promise((resolve) => { resolveSubmit = resolve; }));
    render(
      <ActivityForm
        initialActivity={initialActivity}
        minDate="2026-11-10"
        maxDate="2026-11-14"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    const saveBtn = screen.getByRole("button", { name: "Save Changes" });
    expect(saveBtn).toBeInTheDocument();
    expect(saveBtn).not.toBeDisabled();

    await userEvent.click(saveBtn);

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Saving..." })).toHaveAttribute("aria-busy", "true");
    expect(onSubmit).toHaveBeenCalledTimes(1);

    resolveSubmit();
  });

  it("restores button and preserves form values when submission fails", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Activity date must be within the trip dates"));
    render(
      <ActivityForm
        initialActivity={initialActivity}
        minDate="2026-11-10"
        maxDate="2026-11-14"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    const saveBtn = screen.getByRole("button", { name: "Save Changes" });
    await userEvent.click(saveBtn);

    expect(await screen.findByText("Activity date must be within the trip dates")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Changes" })).not.toBeDisabled();
    expect(screen.getByLabelText("Activity title")).toHaveValue("Visit Fort");
  });

  it("disables Cancel button while request is processing", async () => {
    const onSubmit = vi.fn(() => new Promise(() => {}));
    render(
      <ActivityForm
        initialActivity={initialActivity}
        minDate="2026-11-10"
        maxDate="2026-11-14"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
