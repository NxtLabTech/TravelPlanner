import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ExpenseForm from "./ExpenseForm.jsx";

describe("ExpenseForm", () => {
  it("submits the entered values with a numeric amount", async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<ExpenseForm submitLabel="Add expense" onSubmit={onSubmit} onCancel={() => {}} />);

    await userEvent.type(screen.getByLabelText("Expense title"), "Dinner");
    await userEvent.type(screen.getByLabelText(/Amount/), "599.50");
    await userEvent.selectOptions(screen.getByLabelText("Category"), "food");
    await userEvent.type(screen.getByLabelText("Date"), "2026-11-11");
    await userEvent.type(screen.getByLabelText("Notes"), "Beach shack");
    await userEvent.click(screen.getByRole("button", { name: "Add expense" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Dinner",
      amount: 599.5,
      category: "food",
      date: "2026-11-11",
      notes: "Beach shack",
    });
  });

  it("offers every expense category", () => {
    render(<ExpenseForm submitLabel="Add expense" onSubmit={vi.fn()} onCancel={() => {}} />);
    const options = screen.getAllByRole("option").map((option) => option.value);
    expect(options).toEqual(["", "accommodation", "transport", "food", "sightseeing", "shopping", "other"]);
  });

  it("calls onCancel", async () => {
    const onCancel = vi.fn();
    render(<ExpenseForm submitLabel="Add expense" onSubmit={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
