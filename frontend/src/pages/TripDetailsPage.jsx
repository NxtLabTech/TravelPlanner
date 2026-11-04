import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createActivity,
  deleteActivity,
  deleteTrip,
  getActivities,
  getTrip,
  updateActivity,
} from "../services/api.js";
import { formatBudget, formatDate } from "../format.js";
import StatusBadge from "../components/StatusBadge.jsx";
import ActivityForm from "../components/ActivityForm.jsx";
import Itinerary from "../components/Itinerary.jsx";

export default function TripDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState("");
  // null = form hidden, {} = adding a new activity, otherwise the activity being edited
  const [formActivity, setFormActivity] = useState(null);

  useEffect(() => {
    Promise.all([getTrip(id), getActivities(id)])
      .then(([tripData, activityData]) => {
        setTrip(tripData);
        setActivities(activityData);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  // Close modal on Escape key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && formActivity) {
        setFormActivity(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [formActivity]);

  async function reloadActivities() {
    setActivities(await getActivities(id));
  }

  async function handleSaveActivity(activity) {
    if (formActivity.id) {
      await updateActivity(formActivity.id, activity);
    } else {
      await createActivity(id, activity);
    }
    await reloadActivities();
    setFormActivity(null);
  }

  async function handleDeleteActivity(activity) {
    if (!window.confirm(`Delete "${activity.title}"?`)) return;
    setError("");
    try {
      await deleteActivity(activity.id);
      await reloadActivities();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteTrip() {
    if (!window.confirm(`Delete "${trip.name}" and all its activities?`)) return;
    try {
      await deleteTrip(id);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!trip) {
    return error ? (
      <div className="py-12 max-w-lg mx-auto text-center">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-xs mb-4">
          <svg className="w-8 h-8 text-rose-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-semibold text-base">{error}</p>
        </div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 hover:underline">
          ← Back to all trips
        </Link>
      </div>
    ) : (
      <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
        <svg className="animate-spin h-5 w-5 text-sky-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-medium">Loading trip details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>All trips</span>
        </Link>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-3 shadow-xs">
          <svg className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Summary Header Metadata Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                <svg className="h-3 w-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>{trip.destination}</span>
              </span>
              <StatusBadge status={trip.status} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-snug">
              {trip.name}
            </h1>
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={`/trips/${id}/edit`}
              className="touch-target inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[40px]"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Edit trip</span>
            </Link>
            <button
              type="button"
              onClick={handleDeleteTrip}
              className="touch-target inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 shadow-xs hover:bg-rose-100 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[40px]"
            >
              <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete trip</span>
            </button>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <dl className="grid gap-4 sm:grid-cols-3 pt-6">
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <dt className="text-xs text-slate-500 font-medium">Dates</dt>
              <dd className="text-sm font-bold text-slate-900 mt-0.5">
                {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
              </dd>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div>
              <dt className="text-xs text-slate-500 font-medium">Budget</dt>
              <dd className="text-sm font-bold text-slate-900 mt-0.5">
                {formatBudget(trip.budget)}
              </dd>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <dt className="text-xs text-slate-500 font-medium">Itinerary Size</dt>
              <dd className="text-sm font-bold text-slate-900 mt-0.5">
                {activities.length} {activities.length === 1 ? "activity" : "activities"}
              </dd>
            </div>
          </div>

          {trip.description && (
            <div className="sm:col-span-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <dt className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Trip Notes & Description</dt>
              <dd className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{trip.description}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Itinerary Section */}
      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Itinerary</h2>
            <p className="text-xs text-slate-500 mt-0.5">Daily chronological schedule and booked activities</p>
          </div>
          {!formActivity && (
            <button
              type="button"
              onClick={() => setFormActivity({})}
              className="touch-target inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-sky-700 active:bg-sky-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add activity</span>
            </button>
          )}
        </div>

        {/* Modal / Drawer Wrapper for Activity Form */}
        {formActivity && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-modal-heading"
            className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          >
            <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
              {/* Mobile Drawer Drag Handle Indicator */}
              <div className="sm:hidden -mt-2 pb-3 text-center" aria-hidden="true">
                <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto" />
              </div>

              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div>
                  <h3 id="activity-modal-heading" className="text-base font-bold text-slate-900">
                    {formActivity.id ? "Edit Activity" : "Schedule New Activity"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Trip duration: {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormActivity(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <ActivityForm
                key={formActivity.id || formActivity.date || "new"}
                initialActivity={formActivity.id || formActivity.date ? { ...formActivity, title: formActivity.title || "", date: formActivity.date || "", time: formActivity.time || "", location: formActivity.location || "", notes: formActivity.notes || "" } : undefined}
                minDate={trip.start_date}
                maxDate={trip.end_date}
                submitLabel={formActivity.id ? "Save activity" : "Add activity"}
                onSubmit={handleSaveActivity}
                onCancel={() => setFormActivity(null)}
              />
            </div>
          </div>
        )}

        <Itinerary
          activities={activities}
          startDate={trip.start_date}
          endDate={trip.end_date}
          onEdit={setFormActivity}
          onDelete={handleDeleteActivity}
          onAddForDate={(date) => setFormActivity({ date })}
        />
      </div>
    </div>
  );
}
