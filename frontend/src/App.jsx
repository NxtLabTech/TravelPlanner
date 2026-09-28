import { Link, Route, Routes } from "react-router-dom";
import TripsPage from "./pages/TripsPage.jsx";
import NewTripPage from "./pages/NewTripPage.jsx";
import EditTripPage from "./pages/EditTripPage.jsx";
import TripDetailsPage from "./pages/TripDetailsPage.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold">
            TravelPlanner
          </Link>
          <Link to="/trips/new" className="text-sm text-blue-600 hover:underline">
            New trip
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <Routes>
          <Route path="/" element={<TripsPage />} />
          <Route path="/trips/new" element={<NewTripPage />} />
          <Route path="/trips/:id" element={<TripDetailsPage />} />
          <Route path="/trips/:id/edit" element={<EditTripPage />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </div>
  );
}
