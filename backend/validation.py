import math
from datetime import datetime
import zoneinfo

# Each validate_* function returns (cleaned_values, error_message).
# Exactly one of the two is None.


MAX_ID = 2**63 - 1  # largest integer SQLite can store
MAX_BUDGET = 10**12
DEFAULT_TIMEZONE = "UTC"


def is_valid_timezone(value):
    if not isinstance(value, str) or not value.strip():
        return False
    value = value.strip()
    try:
        zoneinfo.ZoneInfo(value)
        return value in zoneinfo.available_timezones()
    except Exception:
        return False


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

    timezone = data.get("timezone")
    if timezone in (None, ""):
        timezone = DEFAULT_TIMEZONE
    elif isinstance(timezone, str):
        timezone = timezone.strip()
        if not timezone:
            timezone = DEFAULT_TIMEZONE

    if not is_valid_timezone(timezone):
        return None, "Timezone must be a valid IANA timezone"

    trip = {
        "name": name,
        "destination": destination,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "budget": budget,
        "description": clean_text(data, "description"),
        "timezone": timezone,
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

    activity = {
        "title": title,
        "date": activity_date.isoformat(),
        "time": time,
        "location": clean_text(data, "location"),
        "notes": clean_text(data, "notes"),
    }
    return activity, None
