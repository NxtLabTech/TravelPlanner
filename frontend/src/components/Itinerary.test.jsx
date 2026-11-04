import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Itinerary from "./Itinerary.jsx";

const activities = [
  { id: 1, title: "Beach", date: "2026-11-10", time: "10:00", location: "Baga", notes: "" },
  { id: 2, title: "Dinner", date: "2026-11-10", time: "20:00", location: "Museum Cafe", notes: "" },
  { id: 3, title: "Art Museum", date: "2026-11-11", time: "11:00", location: "Panaji", notes: "" },
  { id: 4, title: "Fort visit", date: "2026-11-11", time: "16:00", location: "Aguada", notes: "" },
];

describe("Itinerary", () => {
  it("shows a message when there are no activities in List View", () => {
    render(<Itinerary activities={[]} />);
    expect(screen.getByText("No activities yet.")).toBeInTheDocument();
  });

  it("displays List View by default", () => {
    render(<Itinerary activities={activities} />);
    const listBtn = screen.getByRole("tab", { name: "List View" });
    const calBtn = screen.getByRole("tab", { name: "Calendar View" });

    expect(listBtn).toHaveAttribute("aria-selected", "true");
    expect(calBtn).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("searchbox", { name: "Search activities" })).toBeInTheDocument();
    expect(screen.getByText("Beach")).toBeInTheDocument();
  });

  it("allows users to switch to Calendar View and back to List View", async () => {
    render(<Itinerary activities={activities} tripStartDate="2026-11-01" />);

    // Switch to Calendar View
    await userEvent.click(screen.getByRole("tab", { name: "Calendar View" }));

    expect(screen.getByRole("tab", { name: "Calendar View" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "List View" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("November 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous Month" })).toBeInTheDocument();

    // Switch back to List View
    await userEvent.click(screen.getByRole("tab", { name: "List View" }));

    expect(screen.getByRole("tab", { name: "List View" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("searchbox", { name: "Search activities" })).toBeInTheDocument();
    expect(screen.getByText("Beach")).toBeInTheDocument();
  });

  it("groups activities under one heading per date in List View", () => {
    render(<Itinerary activities={activities} />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "10 Nov 2026" })).toBeInTheDocument();
    expect(screen.getByText("Fort visit")).toBeInTheDocument();
  });

  it("calls onEdit and onDelete with the activity in List View", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<Itinerary activities={activities} onEdit={onEdit} onDelete={onDelete} />);

    await userEvent.click(screen.getAllByText("Edit")[0]);
    await userEvent.click(screen.getAllByText("Delete")[1]);

    expect(onEdit).toHaveBeenCalledWith(activities[0]);
    expect(onDelete).toHaveBeenCalledWith(activities[1]);
  });

  it("filters activities by title as the user types", async () => {
    render(<Itinerary activities={activities} />);

    await userEvent.type(screen.getByLabelText("Search activities"), "beach");

    expect(screen.getByText("Beach")).toBeInTheDocument();
    expect(screen.queryByText("Dinner")).not.toBeInTheDocument();
    expect(screen.queryByText("Art Museum")).not.toBeInTheDocument();
    expect(screen.queryByText("Fort visit")).not.toBeInTheDocument();
  });

  it("filters activities by location as the user types", async () => {
    render(<Itinerary activities={activities} />);

    await userEvent.type(screen.getByLabelText("Search activities"), "baga");

    expect(screen.getByText("Beach")).toBeInTheDocument();
    expect(screen.queryByText("Dinner")).not.toBeInTheDocument();
    expect(screen.queryByText("Art Museum")).not.toBeInTheDocument();
  });

  it("matches activities by either title or location (e.g. museum)", async () => {
    render(<Itinerary activities={activities} />);

    await userEvent.type(screen.getByLabelText("Search activities"), "museum");

    expect(screen.getByText("Dinner")).toBeInTheDocument();
    expect(screen.getByText("Art Museum")).toBeInTheDocument();
    expect(screen.queryByText("Beach")).not.toBeInTheDocument();
    expect(screen.queryByText("Fort visit")).not.toBeInTheDocument();
  });

  it("performs case-insensitive search", async () => {
    render(<Itinerary activities={activities} />);

    await userEvent.type(screen.getByLabelText("Search activities"), "FORT");

    expect(screen.getByText("Fort visit")).toBeInTheDocument();
    expect(screen.queryByText("Beach")).not.toBeInTheDocument();
  });

  it('shows "No activities found" when there are no matches', async () => {
    render(<Itinerary activities={activities} />);

    await userEvent.type(screen.getByLabelText("Search activities"), "scuba diving");

    expect(screen.getByText("No activities found")).toBeInTheDocument();
    expect(screen.queryByText("Beach")).not.toBeInTheDocument();
  });

  it("preserves date grouping and sorting when activities are filtered", async () => {
    render(<Itinerary activities={activities} />);

    await userEvent.type(screen.getByLabelText("Search activities"), "museum");

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent("10 Nov 2026");
    expect(headings[1]).toHaveTextContent("11 Nov 2026");
  });

  it("restores all activities when the search input is cleared", async () => {
    render(<Itinerary activities={activities} />);

    const searchInput = screen.getByLabelText("Search activities");
    await userEvent.type(searchInput, "beach");
    expect(screen.queryByText("Dinner")).not.toBeInTheDocument();

    await userEvent.clear(searchInput);
    expect(screen.getByText("Beach")).toBeInTheDocument();
    expect(screen.getByText("Dinner")).toBeInTheDocument();
    expect(screen.getByText("Art Museum")).toBeInTheDocument();
    expect(screen.getByText("Fort visit")).toBeInTheDocument();
  });
});
