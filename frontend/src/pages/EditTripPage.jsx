import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getTrip, updateTrip } from "../services/api.js";
import TripForm from "../components/TripForm.jsx";

export default function EditTripPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getTrip(id).then(setTrip).catch((err) => setError(err.message));
  }, [id]);

  async function handleSubmit(updatedTrip) {
    await updateTrip(id, updatedTrip);
    navigate(`/trips/${id}`);
  }

  if (error) {
    return (
      <div className="py-8 max-w-xl mx-auto">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800 mb-4">
          {error}
        </div>
        <Link to={`/trips/${id}`} className="text-sm font-semibold text-sky-600 hover:underline">
          ← Back to trip
        </Link>
      </div>
    );
  }

  if (!trip) {
    return (
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
    <div className="max-w-2xl mx-auto py-2">
      <div className="mb-6">
        <Link
          to={`/trips/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline mb-3"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to trip</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Edit trip</h1>
        <p className="text-sm text-slate-500 mt-1">
          Modify trip name, destination, timeline, budget, or notes.
        </p>
      </div>
      <TripForm
        initialTrip={trip}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        cancelTo={`/trips/${id}`}
      />
    </div>
  );
}
