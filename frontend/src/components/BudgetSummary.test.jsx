import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BudgetSummary from "./BudgetSummary.jsx";

const activities = [{ cost: 300 }, { cost: 150.5 }, { cost: 0 }];

describe("BudgetSummary", () => {
  it("shows spending against the budget", () => {
    render(<BudgetSummary budget={1000} activities={activities} />);
    expect(screen.getByText("₹450.5 of ₹1,000 spent")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "45");
    expect(screen.queryByText(/over budget/)).not.toBeInTheDocument();
  });

  it("warns when spending is over budget", () => {
    render(<BudgetSummary budget={400} activities={activities} />);
    expect(screen.getByText("₹50.5 over budget")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("handles trips without a budget", () => {
    render(<BudgetSummary budget={0} activities={activities} />);
    expect(screen.getByText("₹450.5 spent · no budget set")).toBeInTheDocument();
  });

  it("adds decimal costs without floating point noise", () => {
    render(<BudgetSummary budget={1} activities={[{ cost: 0.1 }, { cost: 0.2 }]} />);
    expect(screen.getByText("₹0.3 of ₹1 spent")).toBeInTheDocument();
  });
});
