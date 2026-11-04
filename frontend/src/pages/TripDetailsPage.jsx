import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createActivity,
  deleteActivity,
  deleteTrip,
  getActivities,
  getTrip,
  updateActivity,
} from "../services/api.js";
import { countDays, formatDateRange, pluralize } from "../format.js";
import BudgetSummary from "../components/BudgetSummary.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ActivityForm from "../components/ActivityForm.jsx";
import Itinerary from "../components/Itinerary.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import Toast from "../components/Toast.jsx";
import useDocumentTitle from "../useDocumentTitle.js";

export default function TripDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState("");
  // null = form hidden, {} = adding a new activity, otherwise the activity being edited
  const [formActivity, setFormActivity] = useState(null);
  // The delete waiting for confirmation: { title, message, onConfirm }
  const [confirmation, setConfirmation] = useState(null);
  // The message shown after a delete: { message, undo }
  const [toast, setToast] = useState(null);
  useDocumentTitle(trip?.name);

  useEffect(() => {
    Promise.all([getTrip(id), getActivities(id)])
      .then(([tripData, activityData]) => {
        setTrip(tripData);
        setActivities(activityData);
      })
      .catch((err) => setError(err.message));
  }, [id]);

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

  function handleDeleteActivity(activity) {
    setConfirmation({
      title: "Delete activity?",
      message: `"${activity.title}" will be removed from the itinerary.`,
      onConfirm: async () => {
        setConfirmation(null);
        setError("");
        try {
          await deleteActivity(activity.id);
          if (formActivity?.id === activity.id) setFormActivity(null);
          await reloadActivities();
          setToast({ message: `Deleted "${activity.title}"`, undo: () => restoreActivity(activity) });
        } catch (err) {
          setError(err.message);
        }
      },
    });
  }

  // Undo for a deleted activity: add it again (it gets a new id).
  async function restoreActivity({ title, date, time, location, notes, cost, category }) {
    setToast(null);
    try {
      await createActivity(id, { title, date, time, location, notes, cost, category });
      await reloadActivities();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDeleteTrip() {
    setConfirmation({
      title: "Delete trip?",
      message: `"${trip.name}" and its ${pluralize(activities.length, "activity", "activities")} will be deleted. This can't be undone.`,
      onConfirm: async () => {
        setConfirmation(null);
        try {
          await deleteTrip(id);
          navigate("/", { state: { message: `Deleted "${trip.name}"` } });
        } catch (err) {
          setError(err.message);
        }
      },
    });
  }

  const cancelConfirmation = useCallback(() => setConfirmation(null), []);
  const dismissToast = useCallback(() => setToast(null), []);

  // A new activity is added above the itinerary; an existing one is edited in place.
  const isAdding = formActivity !== null && !formActivity.id;

  function renderActivityForm(activity) {
    return (
      <ActivityForm
        key={activity.id || "new"}
        initialActivity={activity.id ? activity : undefined}
        minDate={trip.start_date}
        maxDate={trip.end_date}
        submitLabel={activity.id ? "Save activity" : "Add activity"}
        onSubmit={handleSaveActivity}
        onCancel={() => setFormActivity(null)}
      />
    );
  }

  if (!trip) {
    return error ? (
      <div>
        <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          Back to trips
        </Link>
      </div>
    ) : (
      <p className="text-sm text-gray-500">Loading...</p>
    );
  }

  return (
    <div>
      <Link to="/" className="text-sm text-blue-600 hover:underline print:hidden">
        ← All trips
      </Link>

      {error && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700 print:hidden">{error}</p>}

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{trip.name}</h1>
          <p className="text-gray-600">{trip.destination}</p>
        </div>
        <div className="flex gap-3 print:hidden">
          <button onClick={() => window.print()} className="rounded border border-gray-300 px-4 py-2 text-sm">
            Print
          </button>
          <Link to={`/trips/${id}/edit`} className="rounded border border-gray-300 px-4 py-2 text-sm">
            Edit trip
          </Link>
          <button
            onClick={handleDeleteTrip}
            className="rounded border border-red-300 px-4 py-2 text-sm text-red-700"
          >
            Delete trip
          </button>
        </div>
      </div>

      <dl className="mt-4 grid gap-4 rounded border border-gray-200 bg-white p-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-gray-500">Status</dt>
          <dd className="mt-1">
            <StatusBadge status={trip.status} />
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Dates</dt>
          <dd className="mt-1">{formatDateRange(trip.start_date, trip.end_date)}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Length</dt>
          <dd className="mt-1">
            {pluralize(countDays(trip.start_date, trip.end_date), "day")} ·{" "}
            {pluralize(activities.length, "activity", "activities")}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Budget</dt>
          <dd className="mt-1">
            <BudgetSummary budget={Number(trip.budget)} activities={activities} />
          </dd>
        </div>
        {trip.description && (
          <div className="sm:col-span-4">
            <dt className="text-gray-500">Description</dt>
            <dd className="mt-1">{trip.description}</dd>
          </div>
        )}
      </dl>

      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Itinerary</h2>
        {!isAdding && (
          <button
            onClick={() => setFormActivity({})}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 print:hidden"
          >
            Add activity
          </button>
        )}
      </div>

      {isAdding && <div className="mb-5 print:hidden">{renderActivityForm(formActivity)}</div>}

      <Itinerary
        startDate={trip.start_date}
        endDate={trip.end_date}
        activities={activities}
        editingId={formActivity?.id}
        renderEditForm={renderActivityForm}
        onEdit={setFormActivity}
        onDelete={handleDeleteActivity}
      />

      {confirmation && (
        <ConfirmDialog
          title={confirmation.title}
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onCancel={cancelConfirmation}
        />
      )}
      {toast && (
        <Toast message={toast.message} actionLabel="Undo" onAction={toast.undo} onDismiss={dismissToast} />
      )}
    </div>
  );
}
