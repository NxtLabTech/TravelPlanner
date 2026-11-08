import math
import re
from datetime import datetime, date
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

# Each validate_* function returns (cleaned_values, error_message).
# Exactly one of the two is None.


MAX_ID = 2**63 - 1  # largest integer SQLite can store
MAX_BUDGET = 10**12
TIME_PATTERN = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")
REMINDER_OPTIONS = (1, 3, 7)
DEFAULT_TIMEZONE = "UTC"


def get_trip_status(start_date, end_date):
    today = date.today().isoformat()
    if today < start_date:
        return "upcoming"
    if today > end_date:
        return "completed"
    return "ongoing"


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
    raw_destinations = data.get("destinations")
    if isinstance(raw_destinations, list) and raw_destinations:
        destination = raw_destinations[0].strip() if isinstance(raw_destinations[0], str) else ""
    if not name:
        return None, "Name is required"
    if not destination:
        return None, "Destination is required"

    if raw_destinations is None:
        destinations = [destination]
    elif not isinstance(raw_destinations, list) or not raw_destinations:
        return None, "At least one destination is required"
    else:
        destinations = []
        for value in raw_destinations:
            if not isinstance(value, str) or not value.strip():
                return None, "Destinations must be non-empty text values"
            destinations.append(value.strip())
        destination = destinations[0]

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

    reminder_days = data.get("reminder_days")
    if reminder_days in (None, ""):
        reminder_days = None
    elif isinstance(reminder_days, bool) or reminder_days not in REMINDER_OPTIONS:
        return None, "Reminder must be 1, 3, or 7 days before the trip"
    if reminder_days is not None and get_trip_status(start_date.isoformat(), end_date.isoformat()) == "completed":
        return None, "Completed trips cannot have reminders"

    timezone = data.get("timezone", DEFAULT_TIMEZONE)
    if timezone in (None, ""):
        timezone = DEFAULT_TIMEZONE
    if not isinstance(timezone, str):
        return None, "Timezone must be a valid IANA timezone"
    timezone = timezone.strip()
    try:
        ZoneInfo(timezone)
    except (ZoneInfoNotFoundError, ValueError):
        return None, "Timezone must be a valid IANA timezone"

    trip = {
        "name": name,
        "destination": destination,
        "destinations": destinations,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "budget": budget,
        "description": clean_text(data, "description"),
        "reminder_days": reminder_days,
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
        if not TIME_PATTERN.fullmatch(time):
            return None, "Time must be in HH:MM format"

    duration = data.get("duration", 0)
    if duration in (None, ""):
        duration = 0
    if isinstance(duration, bool) or not isinstance(duration, int):
        return None, "Duration must be a whole number of minutes"
    if duration < 0:
        return None, "Duration cannot be negative"
    if duration > 1440:
        return None, "Duration cannot exceed 24 hours"
    if time and duration:
        start_minutes = int(time[:2]) * 60 + int(time[3:])
        if start_minutes + duration > 24 * 60:
            return None, "Activity must end by midnight"

    activity = {
        "title": title,
        "date": activity_date.isoformat(),
        "time": time,
        "duration": duration,
        "location": clean_text(data, "location"),
        "notes": clean_text(data, "notes"),
    }
    return activity, None


def validate_expense(data, trip):
    if not isinstance(data, dict):
        return None, "Request body must be a JSON object"

    title = clean_text(data, "title")
    category = clean_text(data, "category")
    if not title:
        return None, "Title is required"
    if not category:
        return None, "Category is required"

    amount = data.get("amount")
    if isinstance(amount, bool) or not isinstance(amount, (int, float)) or not math.isfinite(amount):
        return None, "Amount must be a number"
    if amount <= 0:
        return None, "Amount must be positive"

    expense_date, error = read_date(data, "date", "Date")
    if error:
        return None, error
    if not parse_date(trip["start_date"]) <= expense_date <= parse_date(trip["end_date"]):
        return None, "Expense date must be within the trip dates"

    return {
        "title": title,
        "amount": amount,
        "category": category,
        "date": expense_date.isoformat(),
        "notes": clean_text(data, "notes"),
    }, None
