import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Itinerary from "./Itinerary.jsx";

const activities = [
  { id: 1, title: "Beach", date: "2026-11-10", time: "10:00", location: "Baga", notes: "" },
  { id: 2, title: "Dinner", date: "2026-11-10", time: "20:00", location: "", notes: "" },
  { id: 3, title: "Fort visit", date: "2026-11-11", time: "", location: "", notes: "" },
];

describe("Itinerary", () => {
  it("shows a message when there are no activities", () => {
    render(<Itinerary activities={[]} />);
    expect(screen.getByText("No activities yet.")).toBeInTheDocument();
  });

  it("groups activities under one heading per date", () => {
    render(<Itinerary activities={activities} />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "10 Nov 2026" })).toBeInTheDocument();
    expect(screen.getByText("Fort visit")).toBeInTheDocument();
  });

  it("calls onEdit and onDelete with the activity", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<Itinerary activities={activities} onEdit={onEdit} onDelete={onDelete} />);

    await userEvent.click(screen.getAllByText("Edit")[0]);
    await userEvent.click(screen.getAllByText("Delete")[1]);

    expect(onEdit).toHaveBeenCalledWith(activities[0]);
    expect(onDelete).toHaveBeenCalledWith(activities[1]);
  });
});
