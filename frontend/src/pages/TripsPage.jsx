import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTrips } from "../services/api.js";
import { formatBudget, formatDate } from "../format.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const statusColors = {
    upcoming: "from-amber-400 to-amber-500",
    ongoing: "from-emerald-400 to-teal-500",
    completed: "from-slate-300 to-slate-400",
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Trips</h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize, explore, and track all your travel itineraries and budgets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/trips/new"
            className="touch-target inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-sky-700 active:bg-sky-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Trip</span>
          </Link>
        </div>
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Search by name or destination"
            aria-label="Search trips"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="touch-target w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all min-h-[44px]"
          />
        </div>

        {/* Status Filter Select */}
        <div className="relative sm:w-56 shrink-0">
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="touch-target w-full appearance-none rounded-xl border border-slate-300 bg-white pl-3.5 pr-10 py-2.5 text-sm font-medium text-slate-800 shadow-xs focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all min-h-[44px] cursor-pointer"
          >
            <option value="">All trips</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-3 shadow-xs">
          <svg className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold">{error}</p>
            <p className="text-xs text-rose-600 mt-0.5">Please check your connection and try again.</p>
          </div>
        </div>
      )}

      {/* Skeleton Loading State */}
      {loading && (
        <div>
          <p className="text-xs text-slate-400 mb-4 flex items-center gap-2">
            <svg className="animate-spin h-3.5 w-3.5 text-sky-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading...
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-slate-200 rounded-md" />
                  <div className="h-6 w-20 bg-slate-200 rounded-full" />
                </div>
                <div className="h-6 w-3/4 bg-slate-200 rounded-md" />
                <div className="space-y-2 pt-2">
                  <div className="h-3.5 w-full bg-slate-200 rounded" />
                  <div className="h-3.5 w-4/5 bg-slate-200 rounded" />
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-4 w-16 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State Presentation (Zero Trips or Zero Search Results) */}
      {!loading && !error && trips.length === 0 && (
        <div className="py-16 px-4 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">No trips found.</h2>
          <p className="text-sm text-slate-500 mb-6">
            {search || status
              ? "No trips match your active search or filters. Try adjusting your query or clear filters."
              : "Start planning your next adventure. Build daily itineraries, track activities, and manage travel budgets."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/trips/new"
              className="touch-target inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-sky-700 min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Trip</span>
            </Link>
            {(search || status) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatus("");
                }}
                className="touch-target rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 min-h-[44px]"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Trips Card Listing Grid (Responsive: 1 col mobile 375px, 2 col tablet 768px, 3 col desktop 1280px) */}
      {!loading && trips.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const gradient = statusColors[trip.status] || "from-sky-400 to-indigo-500";
            return (
              <div
                key={trip.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md hover:border-sky-300 transition-all duration-200 min-h-[220px]"
              >
                {/* Status Color Bar */}
                <div className={`h-2 w-full bg-gradient-to-r ${gradient}`} />

                <div className="p-5 flex-1 flex flex-col">
                  {/* Top Row: Destination pill & Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium truncate max-w-[65%]">
                      <svg className="h-3 w-3 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="truncate">{trip.destination}</span>
                    </span>

                    <StatusBadge status={trip.status} />
                  </div>

                  {/* Trip Title */}
                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug line-clamp-2 mb-2">
                    <Link to={`/trips/${trip.id}`} className="hover:underline focus:outline-none focus:ring-1 focus:ring-sky-500 rounded">
                      {trip.name}
                    </Link>
                  </h2>

                  {/* Trip Description if present */}
                  {trip.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {trip.description}
                    </p>
                  )}

                  {/* Metadata: Dates & Budget */}
                  <div className="mt-auto space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>
                          {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                        <span>Budget</span>
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatBudget(trip.budget)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer with Action Triggers */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                  <Link
                    to={`/trips/${trip.id}`}
                    className="text-sky-600 hover:text-sky-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>View Details & Itinerary</span>
                    <span>→</span>
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/trips/${trip.id}/edit`}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                      title="Edit trip"
                      aria-label={`Edit ${trip.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
