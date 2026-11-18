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
    let ignore = false;
    getTrip(id)
      .then((data) => {
        if (!ignore) setTrip(data);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  async function handleSubmit(updatedTrip) {
    await updateTrip(id, updatedTrip);
    navigate(`/trips/${id}`);
  }

  if (error) {
    return (
      <div>
        <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          ← Back to trips
        </Link>
      </div>
    );
  }
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
