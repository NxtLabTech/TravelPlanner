import { Link, Navigate, Route, Routes } from "react-router-dom";
import TripsPage from "./pages/TripsPage.jsx";
import NewTripPage from "./pages/NewTripPage.jsx";
import EditTripPage from "./pages/EditTripPage.jsx";
import TripDetailsPage from "./pages/TripDetailsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (user === undefined) return <p className="text-sm text-gray-500">Loading...</p>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b border-gray-200 bg-white">
          <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link to="/" className="text-lg font-semibold">TravelPlanner</Link>
            <AuthNavigation />
          </nav>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<RequireAuth><TripsPage /></RequireAuth>} />
            <Route path="/trips/new" element={<RequireAuth><NewTripPage /></RequireAuth>} />
            <Route path="/trips/:id" element={<RequireAuth><TripDetailsPage /></RequireAuth>} />
            <Route path="/trips/:id/edit" element={<RequireAuth><EditTripPage /></RequireAuth>} />
            <Route path="*" element={<p>Page not found.</p>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

function AuthNavigation() {
  const { user, signOut } = useAuth();
  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
        <Link to="/register" className="rounded bg-blue-600 px-3 py-2 text-white">Register</Link>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <Link to="/trips/new" className="text-blue-600 hover:underline">New trip</Link>
      <span>{user.username}</span>
      <button onClick={signOut} className="text-blue-600 hover:underline">Log out</button>
    </div>
  );
}
