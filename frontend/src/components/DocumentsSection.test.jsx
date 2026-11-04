import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DocumentsSection from "./DocumentsSection.jsx";
import {
  deleteDocument,
  downloadDocument,
  getDocuments,
  uploadDocument,
} from "../services/api.js";

vi.mock("../services/api.js");

const TRIP_ID = "1";

const docs = [
  {
    id: 10,
    trip_id: 1,
    name: "boarding_pass.pdf",
    doc_type: "flight_ticket",
    upload_date: "2026-11-10 08:00:00",
  },
  {
    id: 11,
    trip_id: 1,
    name: "hotel_receipt.jpg",
    doc_type: "hotel_booking",
    upload_date: "2026-11-11 09:30:00",
  },
];

function renderSection() {
  render(<DocumentsSection tripId={TRIP_ID} />);
}

describe("DocumentsSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ── Listing ────────────────────────────────────────────────────────────────

  it("shows a placeholder when there are no documents", async () => {
    getDocuments.mockResolvedValue([]);
    renderSection();
    expect(await screen.findByText("No documents yet.")).toBeInTheDocument();
  });

  it("renders document names, category labels and upload dates", async () => {
    getDocuments.mockResolvedValue(docs);
    renderSection();

    expect(await screen.findByText("boarding_pass.pdf")).toBeInTheDocument();
    expect(screen.getByText("hotel_receipt.jpg")).toBeInTheDocument();
    // readable category labels displayed
    expect(screen.getByText(/Flight Ticket/)).toBeInTheDocument();
    expect(screen.getByText(/Hotel Booking/)).toBeInTheDocument();
    // upload_date parsed without timezone shift
    expect(screen.getByText(/10 Nov 2026/)).toBeInTheDocument();
    expect(screen.getByText(/11 Nov 2026/)).toBeInTheDocument();
  });

  it("shows an error when loading documents fails", async () => {
    getDocuments.mockRejectedValue(new Error("Network error"));
    renderSection();
    expect(
      await screen.findByText(/Could not load documents: Network error/)
    ).toBeInTheDocument();
  });

  it("does not show the placeholder while a load error is displayed", async () => {
    getDocuments.mockRejectedValue(new Error("Network error"));
    renderSection();
    await screen.findByText(/Could not load documents/);
    expect(screen.queryByText("No documents yet.")).not.toBeInTheDocument();
  });

  // ── Upload Form & Uploading ────────────────────────────────────────────────

  it("opens the upload form when 'Upload document' is clicked and closes on cancel", async () => {
    getDocuments.mockResolvedValue([]);
    renderSection();
    await screen.findByText("No documents yet.");

    const openBtn = screen.getByRole("button", { name: "Upload document" });
    await userEvent.click(openBtn);

    expect(screen.getByLabelText(/Document name \(optional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose file" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Document file/i)).toBeInTheDocument();

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    await userEvent.click(cancelBtn);

    expect(screen.queryByLabelText(/Category/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload document" })).toBeInTheDocument();
  });

  it("renders the optional document-name input without a placeholder", async () => {
    getDocuments.mockResolvedValue([]);
    renderSection();
    await screen.findByText("No documents yet.");

    await userEvent.click(screen.getByRole("button", { name: "Upload document" }));
    const nameInput = screen.getByLabelText(/Document name \(optional\)/i);
    expect(nameInput).not.toHaveAttribute("placeholder");
  });

  it("triggers native file picker on 'Choose file' click and displays the selected filename", async () => {
    getDocuments.mockResolvedValue([]);
    renderSection();
    await screen.findByText("No documents yet.");

    await userEvent.click(screen.getByRole("button", { name: "Upload document" }));

    const chooseBtn = screen.getByRole("button", { name: "Choose file" });
    const fileInput = screen.getByLabelText(/Document file/i);

    // Initial state before selection
    expect(screen.getByText("No file chosen")).toBeInTheDocument();

    // Clicking "Choose file" button opens the native file dialog
    const clickSpy = vi.spyOn(fileInput, "click");
    await userEvent.click(chooseBtn);
    expect(clickSpy).toHaveBeenCalled();

    // Selecting a file displays its name next to the button and changes button label to 'Change file'
    const file = new File(["%PDF1234"], "boarding_pass.pdf", { type: "application/pdf" });
    await userEvent.upload(fileInput, file);

    expect(screen.getByRole("button", { name: "Change file" })).toBeInTheDocument();
    expect(screen.queryByText("Choose file")).not.toBeInTheDocument();
    expect(screen.getByText("boarding_pass.pdf")).toBeInTheDocument();
    expect(screen.queryByText("No file chosen")).not.toBeInTheDocument();

    // Canceling resets the selected filename and button label
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await userEvent.click(screen.getByRole("button", { name: "Upload document" }));
    expect(screen.getByRole("button", { name: "Choose file" })).toBeInTheDocument();
    expect(screen.getByText("No file chosen")).toBeInTheDocument();
    expect(screen.queryByText("boarding_pass.pdf")).not.toBeInTheDocument();
  });

  it("shows a success state after uploading a document with category and custom name", async () => {
    getDocuments.mockResolvedValue([]);
    const newDoc = {
      id: 20,
      trip_id: 1,
      name: "My Custom Ticket",
      doc_type: "flight_ticket",
      upload_date: "2026-10-24 10:00:00",
    };
    uploadDocument.mockResolvedValue(newDoc);
    renderSection();
    await screen.findByText("No documents yet.");

    // Open form
    await userEvent.click(screen.getByRole("button", { name: "Upload document" }));

    // Fill form
    await userEvent.type(screen.getByLabelText(/Document name \(optional\)/i), "My Custom Ticket");
    await userEvent.selectOptions(screen.getByLabelText(/Category/i), "flight_ticket");

    const file = new File(["%PDF1234"], "ticket.pdf", { type: "application/pdf" });
    const fileInput = screen.getByLabelText(/Document file/i);
    await userEvent.upload(fileInput, file);

    // Submit
    await userEvent.click(screen.getByRole("button", { name: "Upload" }));

    expect(uploadDocument).toHaveBeenCalledWith(TRIP_ID, {
      file,
      docType: "flight_ticket",
      name: "My Custom Ticket",
    });
    expect(await screen.findByText("My Custom Ticket")).toBeInTheDocument();
    expect(screen.getByText(/Flight Ticket/)).toBeInTheDocument();
    // Form should close after successful upload
    expect(screen.queryByLabelText(/Category/i)).not.toBeInTheDocument();
  });

  it("uploads a document with omitted name defaulting on backend", async () => {
    getDocuments.mockResolvedValue([]);
    const newDoc = {
      id: 21,
      trip_id: 1,
      name: "hotel.pdf",
      doc_type: "hotel_booking",
      upload_date: "2026-10-24 10:00:00",
    };
    uploadDocument.mockResolvedValue(newDoc);
    renderSection();
    await screen.findByText("No documents yet.");

    await userEvent.click(screen.getByRole("button", { name: "Upload document" }));
    await userEvent.selectOptions(screen.getByLabelText(/Category/i), "hotel_booking");

    const file = new File(["%PDF1234"], "hotel.pdf", { type: "application/pdf" });
    await userEvent.upload(screen.getByLabelText(/Document file/i), file);

    await userEvent.click(screen.getByRole("button", { name: "Upload" }));

    expect(uploadDocument).toHaveBeenCalledWith(TRIP_ID, {
      file,
      docType: "hotel_booking",
      name: "",
    });
    expect(await screen.findByText("hotel.pdf")).toBeInTheDocument();
  });

  it("rejects a file with an unsupported extension without calling the API", async () => {
    getDocuments.mockResolvedValue([]);
    renderSection();
    await screen.findByText("No documents yet.");

    await userEvent.click(screen.getByRole("button", { name: "Upload document" }));
    await userEvent.selectOptions(screen.getByLabelText(/Category/i), "other");

    const file = new File(["data"], "malware.exe", {
      type: "application/octet-stream",
    });
    const input = screen.getByLabelText(/Document file/i);
    await userEvent.upload(input, file, { applyAccept: false });

    await userEvent.click(screen.getByRole("button", { name: "Upload" }));

    expect(uploadDocument).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/not a supported file type/)
    ).toBeInTheDocument();
  });

  it("shows an upload error returned by the backend", async () => {
    getDocuments.mockResolvedValue([]);
    uploadDocument.mockRejectedValue(
      new Error("File content does not match its extension")
    );
    renderSection();
    await screen.findByText("No documents yet.");

    await userEvent.click(screen.getByRole("button", { name: "Upload document" }));
    await userEvent.selectOptions(screen.getByLabelText(/Category/i), "insurance");

    const file = new File(["notapdf"], "fake.pdf", { type: "application/pdf" });
    const input = screen.getByLabelText(/Document file/i);
    await userEvent.upload(input, file);

    await userEvent.click(screen.getByRole("button", { name: "Upload" }));

    expect(
      await screen.findByText("File content does not match its extension")
    ).toBeInTheDocument();
    // Document list must not change on failure.
    expect(screen.getByText("No documents yet.")).toBeInTheDocument();
  });

  it("disables the upload control while an upload is in progress", async () => {
    getDocuments.mockResolvedValue([]);
    uploadDocument.mockReturnValue(new Promise(() => {}));
    renderSection();
    await screen.findByText("No documents yet.");

    await userEvent.click(screen.getByRole("button", { name: "Upload document" }));
    await userEvent.selectOptions(screen.getByLabelText(/Category/i), "train_ticket");

    const file = new File(["%PDF"], "ticket.pdf", { type: "application/pdf" });
    await userEvent.upload(screen.getByLabelText(/Document file/i), file);

    const submitBtn = screen.getByRole("button", { name: "Upload" });
    await userEvent.click(submitBtn);

    expect(await screen.findByText("Uploading…")).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });

  // ── Downloading ────────────────────────────────────────────────────────────

  it("calls downloadDocument when the Download button is clicked", async () => {
    getDocuments.mockResolvedValue(docs);
    renderSection();

    const firstItem = (await screen.findAllByRole("listitem"))[0];
    await userEvent.click(within(firstItem).getByRole("button", { name: "Download" }));

    expect(downloadDocument).toHaveBeenCalledWith(docs[0].id);
  });

  // ── Deleting ───────────────────────────────────────────────────────────────

  it("removes the document from the list after deletion", async () => {
    getDocuments.mockResolvedValue([...docs]);
    deleteDocument.mockResolvedValue({ message: "Document deleted" });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderSection();

    const firstItem = (await screen.findAllByRole("listitem"))[0];
    await userEvent.click(within(firstItem).getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(screen.queryByText("boarding_pass.pdf")).not.toBeInTheDocument()
    );
    expect(screen.getByText("hotel_receipt.jpg")).toBeInTheDocument();
  });

  it("does not delete when the user cancels the confirmation", async () => {
    getDocuments.mockResolvedValue([...docs]);
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderSection();

    const firstItem = (await screen.findAllByRole("listitem"))[0];
    await userEvent.click(within(firstItem).getByRole("button", { name: "Delete" }));

    expect(deleteDocument).not.toHaveBeenCalled();
    expect(screen.getByText("boarding_pass.pdf")).toBeInTheDocument();
  });

  it("shows a delete error without removing the document", async () => {
    getDocuments.mockResolvedValue([...docs]);
    deleteDocument.mockRejectedValue(new Error("Document not found"));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderSection();

    const firstItem = (await screen.findAllByRole("listitem"))[0];
    await userEvent.click(within(firstItem).getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText("Document not found")
    ).toBeInTheDocument();
    expect(screen.getByText("boarding_pass.pdf")).toBeInTheDocument();
  });

  // ── Error isolation ────────────────────────────────────────────────────────

  it("load failures do not affect other parts of the trip details page", async () => {
    getDocuments.mockRejectedValue(new Error("500 error"));
    renderSection();
    expect(
      await screen.findByRole("alert")
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Documents" })).toBeInTheDocument();
  });
});
