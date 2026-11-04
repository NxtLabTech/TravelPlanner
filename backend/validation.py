import math
from datetime import datetime

# Each validate_* function returns (cleaned_values, error_message).
# Exactly one of the two is None.


MAX_ID = 2**63 - 1  # largest integer SQLite can store
MAX_AMOUNT = 10**12  # upper limit for a trip budget or an activity cost

ACTIVITY_CATEGORIES = ("food", "transport", "stay", "sightseeing", "shopping", "other")


def parse_id(value):
    if not (value.isascii() and value.isdigit()):
        return None
    number = int(value)
    return number if 0 < number <= MAX_ID else None


def parse_date(value):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


def clean_text(data, key):
    value = data.get(key)
    return value.strip() if isinstance(value, str) else ""


def read_date(data, key, label):
    if not data.get(key):
        return None, f"{label} is required"
    parsed = parse_date(data[key])
    if parsed is None:
        return None, f"{label} must be a valid date (YYYY-MM-DD)"
    return parsed, None


# An optional amount of money: missing or "" means 0.
def read_amount(data, key, label):
    value = data.get(key)
    if value is None or value == "":
        return 0, None
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        return None, f"{label} must be a number"
    if value < 0:
        return None, f"{label} cannot be negative"
    if value > MAX_AMOUNT:
        return None, f"{label} is too large"
    return value, None


def validate_trip(data):
    if not isinstance(data, dict):
        return None, "Request body must be a JSON object"

    name = clean_text(data, "name")
    destination = clean_text(data, "destination")
    if not name:
        return None, "Name is required"
    if not destination:
        return None, "Destination is required"

    start_date, error = read_date(data, "start_date", "Start date")
    if error:
        return None, error
    end_date, error = read_date(data, "end_date", "End date")
    if error:
        return None, error
    if end_date < start_date:
        return None, "End date cannot be before start date"

    budget, error = read_amount(data, "budget", "Budget")
    if error:
        return None, error

    trip = {
        "name": name,
        "destination": destination,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "budget": budget,
        "description": clean_text(data, "description"),
    }
    return trip, None


def validate_activity(data, trip):
    if not isinstance(data, dict):
        return None, "Request body must be a JSON object"

    title = clean_text(data, "title")
    if not title:
        return None, "Title is required"

    activity_date, error = read_date(data, "date", "Date")
    if error:
        return None, error
    if not parse_date(trip["start_date"]) <= activity_date <= parse_date(trip["end_date"]):
        return None, "Activity date must be within the trip dates"

    time = clean_text(data, "time")
    if time:
        try:
            time = datetime.strptime(time, "%H:%M").strftime("%H:%M")
        except ValueError:
            return None, "Time must be in HH:MM format"

    cost, error = read_amount(data, "cost", "Cost")
    if error:
        return None, error

    category = clean_text(data, "category").lower()
    if category and category not in ACTIVITY_CATEGORIES:
        return None, f"Category must be one of: {', '.join(ACTIVITY_CATEGORIES)}"

    activity = {
        "title": title,
        "date": activity_date.isoformat(),
        "time": time,
        "location": clean_text(data, "location"),
        "notes": clean_text(data, "notes"),
        "cost": cost,
        "category": category,
    }
    return activity, None
