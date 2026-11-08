import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTrips } from "../services/api.js";
import { formatBudget, formatDate } from "../format.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ limit: 10, total: 0, total_pages: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    getTrips({ search, status, page, limit: pagination.limit })
      .then((data) => {
        if (ignore) return;
        setTrips(data.trips);
        setPagination(data);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setError(err.message);
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [search, status, page]);

  function handleSearchChange(event) {
    setSearch(event.target.value);
    setPage(1);
  }

  function handleStatusChange(event) {
    setStatus(event.target.value);
    setPage(1);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Trips</h1>
        <Link to="/trips/new" className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          Add Trip
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <input
          type="search"
          placeholder="Search by name or destination"
          aria-label="Search trips"
          value={search}
          onChange={handleSearchChange}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2"
        />
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Trip filters">
          {[
            ["", "All Trips"],
            ["upcoming", "Upcoming"],
            ["ongoing", "Ongoing"],
            ["completed", "Completed"],
          ].map(([value, label]) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={status === value}
              onClick={() => handleStatusChange({ target: { value } })}
              className={`rounded border px-3 py-2 text-sm ${
                status === value
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {!loading && !error && pagination.total === 0 && <p className="text-gray-500">No trips found.</p>}

      {trips.length > 0 && (
        <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link
                to={`/trips/${trip.id}`}
                className="flex flex-col gap-2 p-4 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{trip.name}</p>
                  <p className="text-sm text-gray-600">{(trip.destinations || [trip.destination]).join(" → ")}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>
                    {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                  </span>
                  <span>{formatBudget(trip.budget)}</span>
                  <StatusBadge status={trip.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pagination.total_pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((current) => current - 1)}
            disabled={page === 1}
            className="rounded border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {pagination.total_pages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={page === pagination.total_pages}
            className="rounded border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
