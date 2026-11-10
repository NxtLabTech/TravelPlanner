import { useState } from "react";

const CATEGORIES = [
  "Flight Ticket",
  "Hotel Booking",
  "Train Ticket",
  "Travel Insurance",
  "Other",
];

const inputClass = "mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2";

export default function DocumentUpload({ onUpload, onCancel }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Document name is required");
      return;
    }
    if (!category) {
      setError("Please select a category");
      return;
    }
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    try {
      await onUpload({ name: name.trim(), category, file });
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded border border-gray-200 bg-white p-4">
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <label className="block text-sm font-medium">
        Document name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputClass}
          placeholder="e.g. Flight to Goa"
        />
      </label>

      <label className="block text-sm font-medium">
        Category
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className={inputClass}
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        File
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0] || null)}
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt"
          className={inputClass}
        />
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={uploading}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload document"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={uploading}
          className="rounded border border-gray-300 px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

