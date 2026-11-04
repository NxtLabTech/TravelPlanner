from datetime import date

from database import get_db
from validation import time_to_minutes

TRIP_STATUSES = ("upcoming", "ongoing", "completed")


def get_trip_status(start_date, end_date):
    today = date.today().isoformat()
    if today < start_date:
        return "upcoming"
    if today > end_date:
        return "completed"
    return "ongoing"


def trip_to_dict(row):
    trip = dict(row)
    trip["status"] = get_trip_status(trip["start_date"], trip["end_date"])
    return trip


def find_trip(trip_id):
    return get_db().execute("SELECT * FROM trips WHERE id = ?", (trip_id,)).fetchone()


def find_activity(activity_id):
    return get_db().execute("SELECT * FROM activities WHERE id = ?", (activity_id,)).fetchone()


def get_end_time(start_time, duration_minutes):
    if not start_time or not duration_minutes:
        return None
    end = time_to_minutes(start_time) + duration_minutes
    return f"{end // 60:02d}:{end % 60:02d}"


def activity_to_dict(row):
    activity = dict(row)
    activity["end_time"] = get_end_time(activity["time"], activity["duration_minutes"])
    return activity


def time_span(activity):
    # An activity without a duration occupies just its start minute.
    start = time_to_minutes(activity["time"])
    return start, start + (activity["duration_minutes"] or 0)


def spans_overlap(first, second):
    first_start, first_end = first
    second_start, second_end = second
    return first_start == second_start or (first_start < second_end and second_start < first_end)


def find_overlapping_activity(trip_id, activity, exclude_id=None):
    """Return another activity on the same trip and day whose time range overlaps."""
    if not activity["time"]:
        return None
    rows = get_db().execute(
        """SELECT * FROM activities
           WHERE trip_id = ? AND date = ? AND time != '' AND id IS NOT ?
           ORDER BY time, id""",
        (trip_id, activity["date"], exclude_id),
    ).fetchall()
    span = time_span(activity)
    for row in rows:
        if spans_overlap(span, time_span(row)):
            return row
    return None
