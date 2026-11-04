import math
from datetime import datetime

# Each validate_* function returns (cleaned_values, error_message).
# Exactly one of the two is None.


MAX_ID = 2**63 - 1  # largest integer SQLite can store
MAX_BUDGET = 10**12
MINUTES_PER_DAY = 24 * 60


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


def time_to_minutes(value):
    hours, minutes = value.split(":")
    return int(hours) * 60 + int(minutes)


def read_duration(data, time):
    duration = data.get("duration_minutes")
    if duration in (None, ""):
        return None, None
    if isinstance(duration, bool) or not isinstance(duration, int):
        return None, "Duration must be a whole number of minutes"
    if duration <= 0:
        return None, "Duration must be greater than zero"
    if not time:
        return None, "Start time is required when a duration is set"
    # Activities belong to a single day, so they cannot run past midnight.
    if time_to_minutes(time) + duration >= MINUTES_PER_DAY:
        return None, "Activity must end before midnight"
    return duration, None


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

    budget = data.get("budget")
    if budget in (None, ""):
        budget = 0
    if isinstance(budget, bool) or not isinstance(budget, (int, float)) or not math.isfinite(budget):
        return None, "Budget must be a number"
    if budget < 0:
        return None, "Budget cannot be negative"
    if budget > MAX_BUDGET:
        return None, "Budget is too large"

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

    duration, error = read_duration(data, time)
    if error:
        return None, error

    activity = {
        "title": title,
        "date": activity_date.isoformat(),
        "time": time,
        "duration_minutes": duration,
        "location": clean_text(data, "location"),
        "notes": clean_text(data, "notes"),
    }
    return activity, None
