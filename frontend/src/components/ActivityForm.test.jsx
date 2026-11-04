import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ActivityForm from "./ActivityForm.jsx";

function renderForm(onSubmit, initialActivity) {
  render(
    <ActivityForm
      initialActivity={initialActivity}
      minDate="2026-11-10"
      maxDate="2026-11-14"
      submitLabel="Save"
      onSubmit={onSubmit}
      onCancel={() => {}}
    />
  );
}

async function fillRequired() {
  await userEvent.type(screen.getByLabelText("Activity title"), "Visit Museum");
  await userEvent.type(screen.getByLabelText("Date"), "2026-11-12");
}

describe("ActivityForm", () => {
  it("submits the duration in minutes", async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    renderForm(onSubmit);

    await fillRequired();
    await userEvent.type(screen.getByLabelText("Start time"), "10:00");
    await userEvent.type(screen.getByLabelText("Duration (hours)"), "2");
    await userEvent.type(screen.getByLabelText("Duration (minutes)"), "15");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Visit Museum",
      date: "2026-11-12",
      time: "10:00",
      duration_minutes: 135,
      location: "",
      notes: "",
    });
  });

  it("submits a null duration when none is entered", async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    renderForm(onSubmit);

    await fillRequired();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit.mock.calls[0][0].duration_minutes).toBeNull();
  });

  it("accepts a duration given only in hours", async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    renderForm(onSubmit);

    await fillRequired();
    await userEvent.type(screen.getByLabelText("Duration (hours)"), "2");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit.mock.calls[0][0].duration_minutes).toBe(120);
  });

  it("splits an existing duration into hours and minutes", () => {
    renderForm(vi.fn(), {
      id: 1, title: "Visit Museum", date: "2026-11-12", time: "10:00",
      duration_minutes: 90, location: "", notes: "",
    });

    expect(screen.getByLabelText("Duration (hours)")).toHaveValue(1);
    expect(screen.getByLabelText("Duration (minutes)")).toHaveValue(30);
  });

  it("shows the error returned by the server", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Overlaps with "Lunch" (12:00)'));
    renderForm(onSubmit);

    await fillRequired();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText('Overlaps with "Lunch" (12:00)')).toBeInTheDocument();
  });
});
