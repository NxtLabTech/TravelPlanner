import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DocumentList from "./DocumentList.jsx";

const documents = [
  {
    id: 1,
    name: "Flight to Goa",
    category: "Flight Ticket",
    original_filename: "ticket.pdf",
    mime_type: "application/pdf",
    file_size: 524288,
    uploaded_at: "2026-11-05 10:30:00",
    trip_id: 1,
  },
  {
    id: 2,
    name: "Hotel Confirmation",
    category: "Hotel Booking",
    original_filename: "hotel.pdf",
    mime_type: "application/pdf",
    file_size: 1048576,
    uploaded_at: "2026-11-05 11:00:00",
    trip_id: 1,
  },
];

describe("DocumentList", () => {
  it("shows a message when there are no documents", () => {
    render(<DocumentList documents={[]} onDownload={vi.fn()} onDelete={vi.fn()} deleting={null} />);
    expect(screen.getByText("No documents yet.")).toBeInTheDocument();
  });

  it("renders document names and categories", () => {
    render(<DocumentList documents={documents} onDownload={vi.fn()} onDelete={vi.fn()} deleting={null} />);
    expect(screen.getByText("Flight to Goa")).toBeInTheDocument();
    expect(screen.getByText("Hotel Confirmation")).toBeInTheDocument();
    expect(screen.getByText("Flight Ticket")).toBeInTheDocument();
    expect(screen.getByText("Hotel Booking")).toBeInTheDocument();
  });

  it("shows original filename and file size", () => {
    render(<DocumentList documents={documents} onDownload={vi.fn()} onDelete={vi.fn()} deleting={null} />);
    expect(screen.getByText("ticket.pdf")).toBeInTheDocument();
    expect(screen.getByText("512.0 KB")).toBeInTheDocument();
    expect(screen.getByText("1.0 MB")).toBeInTheDocument();
  });

  it("calls onDownload with the document", async () => {
    const onDownload = vi.fn();
    render(<DocumentList documents={documents} onDownload={onDownload} onDelete={vi.fn()} deleting={null} />);

    await userEvent.click(screen.getAllByText("Download")[0]);
    expect(onDownload).toHaveBeenCalledWith(documents[0]);
  });

  it("calls onDelete with the document", async () => {
    const onDelete = vi.fn();
    render(<DocumentList documents={documents} onDownload={vi.fn()} onDelete={onDelete} deleting={null} />);

    await userEvent.click(screen.getAllByText("Delete")[0]);
    expect(onDelete).toHaveBeenCalledWith(documents[0]);
  });

  it("shows deleting state for the correct document", () => {
    render(<DocumentList documents={documents} onDownload={vi.fn()} onDelete={vi.fn()} deleting={1} />);
    expect(screen.getByText("Deleting…")).toBeInTheDocument();
    // The other delete button should show "Delete"
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("renders upload date", () => {
    render(<DocumentList documents={documents} onDownload={vi.fn()} onDelete={vi.fn()} deleting={null} />);
    const dates = screen.getAllByText("5 Nov 2026");
    expect(dates).toHaveLength(2);
  });
});
