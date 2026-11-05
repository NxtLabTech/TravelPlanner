import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Expenses from "./Expenses.jsx";
import { createExpense, deleteExpense, getExpenses, updateExpense } from "../services/api.js";

vi.mock("../services/api.js");

const taxi = {
  id: 1,
  trip_id: 7,
  title: "Taxi",
  amount: 800,
  category: "transport",
  date: "2026-11-10",
  notes: "Airport to hotel",
};

describe("Expenses", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists the trip's expenses", async () => {
    getExpenses.mockResolvedValue([taxi]);
    render(<Expenses tripId="7" />);

    expect(await screen.findByText("Taxi")).toBeInTheDocument();
    expect(screen.getByText("₹800")).toBeInTheDocument();
    expect(screen.getByText("transport")).toBeInTheDocument();
    expect(screen.getByText("Airport to hotel")).toBeInTheDocument();
    expect(getExpenses).toHaveBeenCalledWith("7");
  });

  it("shows a message when there are no expenses", async () => {
    getExpenses.mockResolvedValue([]);
    render(<Expenses tripId="7" />);
    expect(await screen.findByText("No expenses yet.")).toBeInTheDocument();
  });

  it("shows the error when loading fails", async () => {
    getExpenses.mockRejectedValue(new Error("Database error"));
    render(<Expenses tripId="7" />);
    expect(await screen.findByText("Database error")).toBeInTheDocument();
    expect(screen.queryByText("No expenses yet.")).not.toBeInTheDocument();
  });

  it("adds an expense and reloads the list", async () => {
    getExpenses.mockResolvedValueOnce([]).mockResolvedValueOnce([taxi]);
    createExpense.mockResolvedValue(taxi);
    render(<Expenses tripId="7" />);

    await userEvent.click(await screen.findByRole("button", { name: "Add expense" }));
    await userEvent.type(screen.getByLabelText("Expense title"), "Taxi");
    await userEvent.type(screen.getByLabelText(/Amount/), "800");
    await userEvent.selectOptions(screen.getByLabelText("Category"), "transport");
    await userEvent.type(screen.getByLabelText("Date"), "2026-11-10");
    await userEvent.click(screen.getByRole("button", { name: "Add expense" }));

    expect(createExpense).toHaveBeenCalledWith("7", {
      title: "Taxi",
      amount: 800,
      category: "transport",
      date: "2026-11-10",
      notes: "",
    });
    expect(await screen.findByText("₹800")).toBeInTheDocument();
    expect(screen.queryByLabelText("Expense title")).not.toBeInTheDocument();
  });

  it("edits an existing expense", async () => {
    getExpenses.mockResolvedValueOnce([taxi]).mockResolvedValueOnce([{ ...taxi, amount: 950 }]);
    updateExpense.mockResolvedValue({ ...taxi, amount: 950 });
    render(<Expenses tripId="7" />);

    await userEvent.click(await screen.findByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Expense title")).toHaveValue("Taxi");

    const amount = screen.getByLabelText(/Amount/);
    await userEvent.clear(amount);
    await userEvent.type(amount, "950");
    await userEvent.click(screen.getByRole("button", { name: "Save expense" }));

    expect(updateExpense).toHaveBeenCalledWith(1, expect.objectContaining({ title: "Taxi", amount: 950 }));
    expect(await screen.findByText("₹950")).toBeInTheDocument();
  });

  it("keeps the form open and shows the server error when saving fails", async () => {
    getExpenses.mockResolvedValue([taxi]);
    updateExpense.mockRejectedValue(new Error("Amount must be greater than zero"));
    render(<Expenses tripId="7" />);

    await userEvent.click(await screen.findByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Save expense" }));

    expect(await screen.findByText("Amount must be greater than zero")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save expense" })).toBeEnabled();
  });

  it("deletes an expense after confirmation", async () => {
    getExpenses.mockResolvedValueOnce([taxi]).mockResolvedValueOnce([]);
    deleteExpense.mockResolvedValue({ message: "Expense deleted" });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Expenses tripId="7" />);

    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));

    expect(window.confirm).toHaveBeenCalledWith('Delete "Taxi"?');
    expect(deleteExpense).toHaveBeenCalledWith(1);
    expect(await screen.findByText("No expenses yet.")).toBeInTheDocument();
  });

  it("does not delete when the confirmation is cancelled", async () => {
    getExpenses.mockResolvedValue([taxi]);
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Expenses tripId="7" />);

    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));

    expect(deleteExpense).not.toHaveBeenCalled();
    expect(screen.getByText("Taxi")).toBeInTheDocument();
  });

  it("keeps the expense and shows the error when deleting fails", async () => {
    getExpenses.mockResolvedValue([taxi]);
    deleteExpense.mockRejectedValue(new Error("Expense not found"));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Expenses tripId="7" />);

    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Expense not found")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Taxi")).toBeInTheDocument());
  });
});
