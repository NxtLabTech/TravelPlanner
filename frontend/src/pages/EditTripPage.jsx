import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

  if (error) return <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  if (!trip) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Edit trip</h1>
      <TripForm
        initialTrip={trip}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        cancelTo={`/trips/${id}`}
      />
    </div>
  );
}
