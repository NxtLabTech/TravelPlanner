import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import BudgetSplitter from "./BudgetSplitter.jsx";

describe("BudgetSplitter", () => {
  it("divides the trip budget between named friends, including leftover paise", async () => {
    const user = userEvent.setup();
    render(<BudgetSplitter budget={100} />);

    await user.click(screen.getByRole("button", { name: "Split budget" }));
    await user.type(screen.getByLabelText("Friend 1"), "Asha");
    await user.type(screen.getByLabelText("Friend 2"), "Ravi");
    await user.click(screen.getByRole("button", { name: "+ Add friend" }));
    await user.type(screen.getByLabelText("Friend 3"), "Mina");

    expect(screen.getByText("₹33.34")).toBeInTheDocument();
    expect(screen.getAllByText("₹33.33")).toHaveLength(2);
    expect(screen.getByText("Asha")).toBeInTheDocument();
    expect(screen.getByText("Ravi")).toBeInTheDocument();
    expect(screen.getByText("Mina")).toBeInTheDocument();
  });

  it("ignores empty names and can close the calculator", async () => {
    const user = userEvent.setup();
    render(<BudgetSplitter budget={20000} />);

    await user.click(screen.getByRole("button", { name: "Split budget" }));
    await user.type(screen.getByLabelText("Friend 1"), "Asha");

    expect(screen.getAllByText("₹20,000")).toHaveLength(2);
    expect(screen.queryByText("Enter friend names to calculate their shares.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close splitter" }));
    expect(screen.queryByLabelText("Friend 1")).not.toBeInTheDocument();
  });
});
