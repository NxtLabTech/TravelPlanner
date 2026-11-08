# TravelPlanner

A simple travel planning application built with React and Flask.

A small travel planning app. Create trips, keep an itinerary of activities for each one, and search or filter your trips by status.

## Features

- Create, view, edit and delete trips
- Add, edit and delete activities for a trip
- Itinerary grouped by date
- Search trips by name or destination
- Filter trips by status: upcoming, ongoing, completed (calculated from the trip dates)

## Tech stack

- Frontend: React, Vite, Tailwind CSS, React Router
- Backend: Python, Flask
- Database: SQLite (created automatically on first run)
- Tests: pytest (backend), Vitest + Testing Library (frontend)

## Project structure

```
TravelPlanner/
├── backend/
│   ├── app.py            # Flask app, error handlers
│   ├── database.py       # SQLite connection and schema
│   ├── models.py         # Trip status, row helpers, lookups
│   ├── validation.py     # Request validation
│   ├── routes/
│   │   ├── trips.py
│   │   └── activities.py
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/   # TripForm, ActivityForm, Itinerary, StatusBadge
│       ├── pages/        # Trips list, new/edit trip, trip details
│       ├── services/     # api.js (calls to the Flask API)
│       ├── App.jsx
│       └── main.jsx
├── README.md
└── LICENSE
```

## Requirements

- Python 3.10+
- Node.js 22.12 or newer, and npm

## Installation

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Frontend:

```bash
cd frontend
npm install
```

## Running the app

Start Flask (http://127.0.0.1:5000):

```bash
cd backend
python app.py
```

Start React (http://localhost:5173):

```bash
cd frontend
npm run dev
```

The Vite dev server proxies `/api` requests to Flask, so start both. Open http://localhost:5173.

The SQLite database is stored in `backend/travelplanner.db`. Set the `DATABASE_PATH` environment variable to use a different file. Set `FLASK_DEBUG=1` to run Flask with auto-reload.

Authentication uses an HTTP-only session cookie. Set `SECRET_KEY` to a strong random value outside development.

## API

Authentication

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/auth/register` | Register and log in a user |
| POST | `/api/auth/login` | Log in with username and password |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get the current user |

Trips

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/trips` | List trips with pagination. Optional `?search=goa`, `?status=upcoming`, `?page=1`, and `?limit=10` (`limit` max 100). Returns `trips`, `page`, `limit`, `total`, and `total_pages` |
| POST | `/api/trips` | Create a trip. Optional `timezone` must be a valid IANA timezone and defaults to `UTC`. Send an ordered `destinations` array for multi-stop trips; the first item remains the legacy `destination` value. Optional `reminder_days` must be `1`, `3`, or `7`; completed trips cannot have reminders |
| GET | `/api/trips/<id>` | Get a trip |
| PUT | `/api/trips/<id>` | Update a trip (send all fields, including ordered `destinations`, `timezone`, and optional `reminder_days`). Rejected with 400 if its activities would fall outside the new dates or a completed trip has a reminder |
| DELETE | `/api/trips/<id>` | Delete a trip and its activities |
| GET | `/api/trips/<id>/weather` | Retrieve current weather for the trip destination |
| GET | `/api/trips/<id>/location` | Retrieve map coordinates for the trip destination |
| GET | `/api/trips/<id>/itinerary.pdf` | Download a PDF containing trip information and sorted activities |
| GET | `/api/trips/<id>/activities.csv` | Download the trip's date/time-sorted activities as CSV |

Activities

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/trips/<trip_id>/activities` | List a trip's activities, ordered by date and time. Activities include `duration` in minutes and calculated `end_time` when timed |
| POST | `/api/trips/<trip_id>/activities` | Add an activity. Optional `duration` is a non-negative whole number of minutes; timed activities must end by midnight |
| PUT | `/api/activities/<id>` | Update an activity |
| DELETE | `/api/activities/<id>` | Delete an activity |

Expenses

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/trips/<trip_id>/expenses` | List expenses for a trip |
| POST | `/api/trips/<trip_id>/expenses` | Add an expense |
| PUT | `/api/expenses/<id>` | Update an expense |
| DELETE | `/api/expenses/<id>` | Delete an expense |

Documents

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/api/trips/<trip_id>/documents` | List uploaded documents |
| POST | `/api/trips/<trip_id>/documents` | Upload a PDF, PNG, JPG, DOC, or DOCX document (max 10 MB) |
| GET | `/api/documents/<id>/download` | Download a document |
| DELETE | `/api/documents/<id>` | Remove a document |

Errors are returned as JSON, for example `{"error": "End date cannot be before start date"}`, with status 400 (invalid input), 404 (not found) or 500 (server error).

Weather is retrieved from Open-Meteo at request time and is not stored in the database. Weather provider failures return HTTP 503.
Map coordinates are geocoded through Open-Meteo at request time and displayed using OpenStreetMap.
Document metadata is stored in SQLite, while file contents are stored outside the repository. Set `DOCUMENT_STORAGE_PATH` to choose the storage directory; otherwise the system uses a temporary application directory.

Example trip:

```json
{
  "name": "Goa Trip",
  "destination": "Goa",
  "start_date": "2026-11-10",
  "end_date": "2026-11-14",
  "budget": 20000,
  "description": "Weekend trip with friends"
}
```

Example activity (its date must fall within the trip dates; `time` is optional, `HH:MM`):

```json
{
  "title": "Visit Baga Beach",
  "date": "2026-11-10",
  "time": "10:00",
  "location": "Baga Beach",
  "notes": "Spend the morning at the beach"
}
```

## Running tests

```bash
cd backend
pytest
```

```bash
cd frontend
npm test
```

## Building the frontend

```bash
cd frontend
npm run build
```

## License

MIT, see [LICENSE](LICENSE).
