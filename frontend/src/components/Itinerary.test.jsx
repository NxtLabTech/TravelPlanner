import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Itinerary from "./Itinerary.jsx";

const activities = [
  { id: 1, title: "Beach", date: "2026-11-10", time: "10:00", location: "Baga", notes: "" },
  { id: 2, title: "Dinner", date: "2026-11-10", time: "20:00", location: "", notes: "" },
  { id: 3, title: "Fort visit", date: "2026-11-11", time: "", location: "", notes: "" },
];

// Trip from Tue 10 Nov to Sat 14 Nov 2026, viewed before it starts.
function renderItinerary(props = {}) {
  render(
    <Itinerary
      startDate="2026-11-10"
      endDate="2026-11-14"
      activities={activities}
      today="2026-11-01"
      onEdit={() => {}}
      onDelete={() => {}}
      {...props}
    />
  );
}

function headings() {
  return screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
}

describe("Itinerary", () => {
  it("shows numbered days and merges empty days into one section", () => {
    renderItinerary();
    expect(headings()).toEqual([
      "Day 1 · Tue, 10 Nov",
      "Day 2 · Wed, 11 Nov",
      "Days 3–5 · Thu, 12 Nov – Sat, 14 Nov",
    ]);
    expect(screen.getByText("Fort visit")).toBeInTheDocument();
    expect(screen.getAllByText("Nothing planned")).toHaveLength(1);
  });

  it("shows every day as empty when there are no activities", () => {
    renderItinerary({ startDate: "2026-11-04", endDate: "2026-11-04", activities: [] });
    expect(headings()).toEqual(["Day 1 · Wed, 4 Nov"]);
    expect(screen.getByText("Nothing planned")).toBeInTheDocument();
  });

  it("marks today and keeps it out of the merged empty days", () => {
    renderItinerary({ today: "2026-11-13" });
    expect(headings()).toEqual([
      "Day 1 · Tue, 10 Nov",
      "Day 2 · Wed, 11 Nov",
      "Day 3 · Thu, 12 Nov",
      "Day 4 · Fri, 13 NovToday",
      "Day 5 · Sat, 14 Nov",
    ]);
  });

  it("calls onEdit and onDelete with the activity", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderItinerary({ onEdit, onDelete });

    await userEvent.click(screen.getByRole("button", { name: "Edit Beach" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete Dinner" }));

    expect(onEdit).toHaveBeenCalledWith(activities[0]);
    expect(onDelete).toHaveBeenCalledWith(activities[1]);
  });

  it("links the location to a map search", () => {
    renderItinerary({
      activities: [{ ...activities[0], location: "Hyderabad, Telangana" }],
    });
    const link = screen.getByRole("link", { name: "Hyderabad, Telangana" });
    expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=Hyderabad%2C%20Telangana"
    );
    expect(link).toHaveAttribute("target", "_blank");
  });
});
