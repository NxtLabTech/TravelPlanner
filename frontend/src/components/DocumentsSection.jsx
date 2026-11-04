import { useEffect, useRef, useState } from "react";
import {
  deleteDocument,
  downloadDocument,
  getDocuments,
  uploadDocument,
} from "../services/api.js";

export const DOCUMENT_CATEGORIES = [
  { value: "flight_ticket", label: "Flight Ticket" },
  { value: "hotel_booking", label: "Hotel Booking" },
  { value: "train_ticket", label: "Train Ticket" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
];

const CATEGORY_LABELS = Object.fromEntries(
  DOCUMENT_CATEGORIES.map((c) => [c.value, c.label])
);

export function getCategoryLabel(docType) {
  return CATEGORY_LABELS[docType] || docType;
}

// Client-side extension allowlist mirrors the backend so the user gets
// immediate feedback, but the backend remains the authoritative validator.
const ALLOWED_EXTENSIONS = new Set([
  "pdf", "jpg", "jpeg", "png", "gif", "txt", "doc", "docx",
]);
const ALLOWED_ACCEPT = ".pdf,.jpg,.jpeg,.png,.gif,.txt,.doc,.docx";

function getExtension(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function formatUploadDate(raw) {
  // Backend returns "YYYY-MM-DD HH:MM:SS" (SQLite CURRENT_TIMESTAMP, UTC).
  // Parse the date portion only so timezone offset cannot shift the day.
  if (!raw) return "";
  const datePart = raw.split(" ")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const inputClass = "mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm";

export default function DocumentsSection({ tripId }) {
  const [documents, setDocuments] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [actionError, setActionError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    getDocuments(tripId)
      .then(setDocuments)
      .catch((err) => setLoadError(err.message));
  }, [tripId]);

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    if (!file) return;

    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      setUploadError(
        `"${file.name}" is not a supported file type. Allowed: PDF, JPG, PNG, GIF, TXT, DOC, DOCX.`
      );
    } else {
      setUploadError("");
    }
  }

  function handleCancel() {
    setIsFormOpen(false);
    setUploadError("");
    setDocName("");
    setDocType("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUploadSubmit(event) {
    event.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    const ext = getExtension(selectedFile.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      setUploadError(
        `"${selectedFile.name}" is not a supported file type. Allowed: PDF, JPG, PNG, GIF, TXT, DOC, DOCX.`
      );
      return;
    }

    if (!docType) {
      setUploadError("Please select a category.");
      return;
    }

    setUploadError("");
    setActionError("");
    setUploading(true);
    try {
      const doc = await uploadDocument(tripId, {
        file: selectedFile,
        docType,
        name: docName.trim(),
      });
      setDocuments((prev) => [...prev, doc]);
      handleCancel();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleDownload(doc) {
    setActionError("");
    try {
      downloadDocument(doc.id);
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Remove "${doc.name}"? This cannot be undone.`)) return;
    setActionError("");
    try {
      await deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <section aria-label="Documents">
      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Documents</h2>
        {!isFormOpen && (
          <button
            type="button"
            onClick={() => {
              setIsFormOpen(true);
              setUploadError("");
            }}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Upload document
          </button>
        )}
      </div>

      {uploadError && (
        <p role="alert" className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {uploadError}
        </p>
      )}
      {actionError && (
        <p role="alert" className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}
      {loadError && (
        <p role="alert" className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          Could not load documents: {loadError}
        </p>
      )}

      {isFormOpen && (
        <form
          noValidate
          onSubmit={handleUploadSubmit}
          aria-label="Upload document form"
          className="mb-5 space-y-4 rounded border border-gray-200 bg-white p-4"
        >
          <label className="block text-sm font-medium">
            Document name (optional)
            <input
              type="text"
              name="name"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block text-sm font-medium">
            Category
            <select
              name="docType"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select a category</option>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <label htmlFor="document-file-input" className="block text-sm font-medium">
              File
            </label>
            <div className="mt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {selectedFile ? "Change file" : "Choose file"}
              </button>
              <span className="truncate text-sm text-gray-600">
                {selectedFile ? selectedFile.name : "No file chosen"}
              </span>
              <input
                id="document-file-input"
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_ACCEPT}
                onChange={handleFileChange}
                disabled={uploading}
                className="sr-only"
                aria-label="Document file"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={uploading}
              className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!loadError && documents.length === 0 && !uploading && (
        <p className="text-sm text-gray-500">No documents yet.</p>
      )}

      {documents.length > 0 && (
        <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-4 p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium" title={doc.name}>
                  {doc.name}
                </p>
                <p className="text-sm text-gray-500">
                  {getCategoryLabel(doc.doc_type)}
                  {doc.upload_date && (
                    <> &middot; {formatUploadDate(doc.upload_date)}</>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 gap-3 text-sm">
                <button
                  onClick={() => handleDownload(doc)}
                  className="text-blue-600 hover:underline"
                >
                  Download
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
