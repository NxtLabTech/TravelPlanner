from pathlib import Path

from flask import Blueprint, current_app, jsonify, request

from database import get_db
from models import TRIP_STATUSES, find_trip, trip_to_dict
from validation import parse_id, validate_trip
from routes.auth import current_user_id

bp = Blueprint("trips", __name__, url_prefix="/api/trips")
DEFAULT_PAGE = 1
DEFAULT_LIMIT = 10
MAX_LIMIT = 100


def save_destinations(db, trip_id, destinations):
    db.execute("DELETE FROM trip_destinations WHERE trip_id = ?", (trip_id,))
    db.executemany(
        "INSERT INTO trip_destinations (trip_id, destination, position) VALUES (?, ?, ?)",
        [(trip_id, destination, position) for position, destination in enumerate(destinations)],
    )


def parse_pagination():
    values = {}
    for name, default, maximum in (
        ("page", DEFAULT_PAGE, None),
        ("limit", DEFAULT_LIMIT, MAX_LIMIT),
    ):
        value = request.args.get(name)
        if value is None:
            values[name] = default
            continue
        if not value.isascii() or not value.isdigit():
            return None, f"{name.capitalize()} must be a positive integer"
        parsed = int(value)
        if parsed < 1:
            return None, f"{name.capitalize()} must be a positive integer"
        if maximum is not None and parsed > maximum:
            return None, f"Limit cannot exceed {maximum}"
        values[name] = parsed
    return values, None


@bp.get("")
def list_trips():
    pagination, error = parse_pagination()
    if error:
        return jsonify(error=error), 400

    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip().lower()
    if status and status not in TRIP_STATUSES:
        return jsonify(error=f"Status must be one of: {', '.join(TRIP_STATUSES)}"), 400

    query = "SELECT * FROM trips WHERE user_id = ?"
    params = [current_user_id()]
    if search:
        query += """ AND (name LIKE ? ESCAPE '\\' OR destination LIKE ? ESCAPE '\\'
                     OR EXISTS (
                       SELECT 1 FROM trip_destinations td
                       WHERE td.trip_id = trips.id AND td.destination LIKE ? ESCAPE '\\'
                     ))"""
        escaped = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        params.extend([f"%{escaped}%", f"%{escaped}%", f"%{escaped}%"])
    query += " ORDER BY start_date, id"

    rows = get_db().execute(query, params).fetchall()
    trips = [trip_to_dict(row) for row in rows]
    if status:
        trips = [trip for trip in trips if trip["status"] == status]
    total = len(trips)
    page = pagination["page"]
    limit = pagination["limit"]
    start = (page - 1) * limit
    return jsonify({
        "trips": trips[start:start + limit],
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": (total + limit - 1) // limit,
    })


@bp.post("")
def create_trip():
    trip, error = validate_trip(request.get_json(silent=True))
    if error:
        return jsonify(error=error), 400

    db = get_db()
    cursor = db.execute(
        """INSERT INTO trips (user_id, name, destination, start_date, end_date, budget, description, reminder_days, timezone)
           VALUES (:user_id, :name, :destination, :start_date, :end_date, :budget, :description, :reminder_days, :timezone)""",
        {**trip, "user_id": current_user_id()},
    )
    db.commit()
    save_destinations(db, cursor.lastrowid, trip["destinations"])
    db.commit()
    return jsonify(trip_to_dict(find_trip(cursor.lastrowid))), 201


@bp.get("/<trip_id>")
def get_trip(trip_id):
    trip_id = parse_id(trip_id)
    if trip_id is None:
        return jsonify(error="Invalid trip id"), 400
    row = find_trip(trip_id)
    if row is None:
        return jsonify(error="Trip not found"), 404
    return jsonify(trip_to_dict(row))


@bp.put("/<trip_id>")
def update_trip(trip_id):
    trip_id = parse_id(trip_id)
    if trip_id is None:
        return jsonify(error="Invalid trip id"), 400
    if find_trip(trip_id) is None:
        return jsonify(error="Trip not found"), 404

    trip, error = validate_trip(request.get_json(silent=True))
    if error:
        return jsonify(error=error), 400

    db = get_db()
    outside_dates = db.execute(
        "SELECT COUNT(*) FROM activities WHERE trip_id = ? AND (date < ? OR date > ?)",
        (trip_id, trip["start_date"], trip["end_date"]),
    ).fetchone()[0]
    if outside_dates:
        return jsonify(error="Some activities fall outside the new trip dates. Edit or delete them first"), 400

    db.execute(
        """UPDATE trips SET name = :name, destination = :destination, start_date = :start_date,
           end_date = :end_date, budget = :budget, description = :description, reminder_days = :reminder_days,
           timezone = :timezone
           WHERE id = :id""",
        {**trip, "id": trip_id},
    )
    save_destinations(db, trip_id, trip["destinations"])
    db.commit()
    return jsonify(trip_to_dict(find_trip(trip_id)))


@bp.delete("/<trip_id>")
def delete_trip(trip_id):
    trip_id = parse_id(trip_id)
    if trip_id is None:
        return jsonify(error="Invalid trip id"), 400
    if find_trip(trip_id) is None:
        return jsonify(error="Trip not found"), 404

    db = get_db()
    document_rows = db.execute(
        "SELECT file_reference FROM documents WHERE trip_id = ?", (trip_id,)
    ).fetchall()
    db.execute("DELETE FROM trips WHERE id = ?", (trip_id,))
    db.commit()
    storage_path = current_app.config.get("DOCUMENT_STORAGE_PATH")
    if storage_path:
        for row in document_rows:
            (Path(storage_path) / row["file_reference"]).unlink(missing_ok=True)
    return jsonify(message="Trip deleted")
