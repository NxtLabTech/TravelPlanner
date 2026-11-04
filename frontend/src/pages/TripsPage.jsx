import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getTrips } from "../services/api.js";
import { formatBudget, formatDateRange } from "../format.js";
import StatusBadge from "../components/StatusBadge.jsx";
import Toast from "../components/Toast.jsx";
import useDocumentTitle from "../useDocumentTitle.js";

export default function TripsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // A message passed by the page we came from, e.g. after deleting a trip.
  const [message, setMessage] = useState(location.state?.message || "");
  const dismissMessage = useCallback(() => setMessage(""), []);
  useDocumentTitle("Trips");

  // Clear the message from history so a reload or Back doesn't show it again.
  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    getTrips({ search, status })
      .then((data) => {
        if (ignore) return;
        setTrips(data);
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
  }, [search, status]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Trips</h1>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          placeholder="Search by name or destination"
          aria-label="Search trips"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2"
        />
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded border border-gray-300 bg-white px-3 py-2"
        >
          <option value="">All trips</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {!loading && !error && trips.length === 0 && (
        <p className="text-gray-500">
          {search || status ? (
            "No trips found."
          ) : (
            <>
              No trips yet.{" "}
              <Link to="/trips/new" className="text-blue-600 hover:underline">
                Plan your first trip
              </Link>
            </>
          )}
        </p>
      )}

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
                  <p className="text-sm text-gray-600">{trip.destination}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
                  <span>{formatBudget(trip.budget)}</span>
                  <StatusBadge status={trip.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {message && <Toast message={message} onDismiss={dismissMessage} />}
    </div>
  );
}
