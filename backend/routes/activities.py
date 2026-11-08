from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta

from database import get_db
from models import find_activity, find_trip
from validation import parse_id, validate_activity

bp = Blueprint("activities", __name__, url_prefix="/api")


def calculate_end_time(activity):
    if not activity["time"] or not activity["duration"]:
        return ""
    start = datetime.strptime(activity["time"], "%H:%M")
    return (start + timedelta(minutes=activity["duration"])).strftime("%H:%M")


def find_duplicate_activity(db, trip_id, activity, exclude_id=None):
    query = """SELECT id FROM activities
               WHERE trip_id = :trip_id AND title = :title AND date = :date
                 AND time = :time AND duration = :duration AND location = :location"""
    params = {**activity, "trip_id": trip_id}
    if exclude_id is not None:
        query += " AND id != :exclude_id"
        params["exclude_id"] = exclude_id
    return db.execute(query, params).fetchone()


def find_conflicting_activity(db, trip_id, activity, exclude_id=None):
    if not activity["time"]:
        return None
    query = """SELECT id, time, duration FROM activities
               WHERE trip_id = :trip_id AND date = :date AND time != ''"""
    params = {
        "trip_id": trip_id,
        "date": activity["date"],
        "time": activity["time"],
    }
    if exclude_id is not None:
        query += " AND id != :exclude_id"
        params["exclude_id"] = exclude_id
    start = int(activity["time"][:2]) * 60 + int(activity["time"][3:])
    end = start + activity["duration"]
    for row in db.execute(query, params).fetchall():
        existing_start = int(row["time"][:2]) * 60 + int(row["time"][3:])
        existing_end = existing_start + row["duration"]
        if (activity["duration"] == 0 and existing_start == start) or (
            row["duration"] == 0 and existing_start == start
        ) or (activity["duration"] > 0 and row["duration"] > 0 and start < existing_end and existing_start < end):
            return row
    return None


@bp.get("/trips/<trip_id>/activities")
def list_activities(trip_id):
    trip_id = parse_id(trip_id)
    if trip_id is None:
        return jsonify(error="Invalid trip id"), 400
    if find_trip(trip_id) is None:
        return jsonify(error="Trip not found"), 404

    rows = get_db().execute(
        "SELECT * FROM activities WHERE trip_id = ? ORDER BY date, time, id", (trip_id,)
    ).fetchall()
    activities = []
    for row in rows:
        activity = dict(row)
        activity["end_time"] = calculate_end_time(activity)
        activities.append(activity)
    return jsonify(activities)


@bp.post("/trips/<trip_id>/activities")
def create_activity(trip_id):
    trip_id = parse_id(trip_id)
    if trip_id is None:
        return jsonify(error="Invalid trip id"), 400
    trip = find_trip(trip_id)
    if trip is None:
        return jsonify(error="Trip not found"), 404

    activity, error = validate_activity(request.get_json(silent=True), trip)
    if error:
        return jsonify(error=error), 400

    db = get_db()
    if find_duplicate_activity(db, trip_id, activity):
        return jsonify(error="An identical activity already exists for this trip"), 400
    if find_conflicting_activity(db, trip_id, activity):
        return jsonify(error="Another activity is already scheduled for this date and time"), 400
    cursor = db.execute(
        """INSERT INTO activities (trip_id, title, date, time, duration, location, notes)
           VALUES (:trip_id, :title, :date, :time, :duration, :location, :notes)""",
        {**activity, "trip_id": trip_id},
    )
    db.commit()
    created = dict(find_activity(cursor.lastrowid))
    created["end_time"] = calculate_end_time(created)
    return jsonify(created), 201


@bp.put("/activities/<activity_id>")
def update_activity(activity_id):
    activity_id = parse_id(activity_id)
    if activity_id is None:
        return jsonify(error="Invalid activity id"), 400
    existing = find_activity(activity_id)
    if existing is None:
        return jsonify(error="Activity not found"), 404

    trip = find_trip(existing["trip_id"])
    activity, error = validate_activity(request.get_json(silent=True), trip)
    if error:
        return jsonify(error=error), 400

    db = get_db()
    if find_duplicate_activity(db, existing["trip_id"], activity, activity_id):
        return jsonify(error="An identical activity already exists for this trip"), 400
    if find_conflicting_activity(db, existing["trip_id"], activity, activity_id):
        return jsonify(error="Another activity is already scheduled for this date and time"), 400
    db.execute(
        """UPDATE activities SET title = :title, date = :date, time = :time, duration = :duration,
           location = :location, notes = :notes WHERE id = :id""",
        {**activity, "id": activity_id},
    )
    db.commit()
    updated = dict(find_activity(activity_id))
    updated["end_time"] = calculate_end_time(updated)
    return jsonify(updated)


@bp.delete("/activities/<activity_id>")
def delete_activity(activity_id):
    activity_id = parse_id(activity_id)
    if activity_id is None:
        return jsonify(error="Invalid activity id"), 400
    if find_activity(activity_id) is None:
        return jsonify(error="Activity not found"), 404

    db = get_db()
    db.execute("DELETE FROM activities WHERE id = ?", (activity_id,))
    db.commit()
    return jsonify(message="Activity deleted")
