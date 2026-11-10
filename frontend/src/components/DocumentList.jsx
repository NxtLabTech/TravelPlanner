import { formatDate } from "../format.js";

const categoryColors = {
  "Flight Ticket": "bg-blue-100 text-blue-800",
  "Hotel Booking": "bg-purple-100 text-purple-800",
  "Train Ticket": "bg-amber-100 text-amber-800",
  "Travel Insurance": "bg-green-100 text-green-800",
  "Other": "bg-gray-200 text-gray-700",
};

export default function DocumentList({ documents, onDownload, onDelete, deleting }) {
  if (documents.length === 0) {
    return <p className="text-sm text-gray-500">No documents yet.</p>;
  }

  return (
    <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
      {documents.map((doc) => (
        <li key={doc.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-medium truncate">{doc.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${categoryColors[doc.category] || categoryColors["Other"]}`}>
                {doc.category}
              </span>
              <span>{doc.original_filename}</span>
              <span>·</span>
              <span>{formatUploadDate(doc.uploaded_at)}</span>
              <span>·</span>
              <span>{formatFileSize(doc.file_size)}</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-3 text-sm">
            <button
              onClick={() => onDownload(doc)}
              className="text-blue-600 hover:underline"
            >
              Download
            </button>
            <button
              onClick={() => onDelete(doc)}
              disabled={deleting === doc.id}
              className="text-red-600 hover:underline disabled:opacity-50"
            >
              {deleting === doc.id ? "Deleting…" : "Delete"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatUploadDate(iso) {
  if (!iso) return "";
  // uploaded_at comes as "YYYY-MM-DD HH:MM:SS" from SQLite
  const dateOnly = iso.split(" ")[0];
  return formatDate(dateOnly);
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

