from datetime import date

from database import get_db
from routes.auth import current_user_id

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
    destinations = get_db().execute(
        "SELECT destination FROM trip_destinations WHERE trip_id = ? ORDER BY position, id",
        (trip["id"],),
    ).fetchall()
    trip["destinations"] = [item["destination"] for item in destinations] or [trip["destination"]]
    return trip


def find_trip(trip_id):
    return get_db().execute(
        "SELECT * FROM trips WHERE id = ? AND user_id = ?", (trip_id, current_user_id())
    ).fetchone()


def find_activity(activity_id):
    return get_db().execute(
        """SELECT activities.* FROM activities
           JOIN trips ON trips.id = activities.trip_id
           WHERE activities.id = ? AND trips.user_id = ?""",
        (activity_id, current_user_id()),
    ).fetchone()


def find_expense(expense_id):
    return get_db().execute(
        """SELECT expenses.* FROM expenses
           JOIN trips ON trips.id = expenses.trip_id
           WHERE expenses.id = ? AND trips.user_id = ?""",
        (expense_id, current_user_id()),
    ).fetchone()


def find_document(document_id):
    return get_db().execute(
        """SELECT documents.* FROM documents
           JOIN trips ON trips.id = documents.trip_id
           WHERE documents.id = ? AND trips.user_id = ?""",
        (document_id, current_user_id()),
    ).fetchone()
