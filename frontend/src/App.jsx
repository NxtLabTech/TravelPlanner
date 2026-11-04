import { Link, Route, Routes } from "react-router-dom";
import TripsPage from "./pages/TripsPage.jsx";
import NewTripPage from "./pages/NewTripPage.jsx";
import EditTripPage from "./pages/EditTripPage.jsx";
import TripDetailsPage from "./pages/TripDetailsPage.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Global Application Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
          {/* Brand Identity */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight block leading-tight">
                TravelPlanner
              </span>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Itineraries & Travel Budgets
              </span>
            </div>
          </Link>

          {/* Primary Action */}
          <div className="flex items-center gap-3">
            <Link
              to="/trips/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-sky-700 active:bg-sky-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 min-h-[40px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v16m8-8H4" />
              </svg>
              <span>New trip</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Canvas Viewport */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Routes>
          <Route path="/" element={<TripsPage />} />
          <Route path="/trips/new" element={<NewTripPage />} />
          <Route path="/trips/:id" element={<TripDetailsPage />} />
          <Route path="/trips/:id/edit" element={<EditTripPage />} />
          <Route
            path="*"
            element={
              <div className="py-16 text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">404 - Page Not Found</h2>
                <p className="text-slate-500 mb-6">The page you were looking for doesn't exist.</p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  Return to Dashboard
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
