import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DocumentUpload from "./DocumentUpload.jsx";

describe("DocumentUpload", () => {
  it("renders upload form fields", () => {
    render(<DocumentUpload onUpload={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText("Document name")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByLabelText("File")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload document" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("calls onCancel when Cancel button is clicked", async () => {
    const onCancel = vi.fn();
    render(<DocumentUpload onUpload={vi.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("submits the form with the selected file and fields", async () => {
    const onUpload = vi.fn().mockResolvedValue();
    render(<DocumentUpload onUpload={onUpload} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Document name"), "Boarding Pass");
    await userEvent.selectOptions(screen.getByLabelText("Category"), "Flight Ticket");

    const file = new File(["dummy pdf content"], "pass.pdf", { type: "application/pdf" });
    const fileInput = screen.getByLabelText("File");
    await userEvent.upload(fileInput, file);

    await userEvent.click(screen.getByRole("button", { name: "Upload document" }));

    expect(onUpload).toHaveBeenCalledWith({
      name: "Boarding Pass",
      category: "Flight Ticket",
      file,
    });
  });

  it("shows an error when the upload fails", async () => {
    const onUpload = vi.fn().mockRejectedValue(new Error("Upload failed"));
    render(<DocumentUpload onUpload={onUpload} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Document name"), "Some Ticket");
    await userEvent.selectOptions(screen.getByLabelText("Category"), "Flight Ticket");

    const file = new File(["dummy pdf content"], "ticket.pdf", { type: "application/pdf" });
    await userEvent.upload(screen.getByLabelText("File"), file);

    await userEvent.click(screen.getByRole("button", { name: "Upload document" }));

    expect(await screen.findByText("Upload failed")).toBeInTheDocument();
  });
});
