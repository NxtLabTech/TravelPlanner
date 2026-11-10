import math
from datetime import datetime

# Each validate_* function returns (cleaned_values, error_message).
# Exactly one of the two is None.


MAX_ID = 2**63 - 1  # largest integer SQLite can store
MAX_BUDGET = 10**12


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

    activity = {
        "title": title,
        "date": activity_date.isoformat(),
        "time": time,
        "location": clean_text(data, "location"),
        "notes": clean_text(data, "notes"),
    }
    return activity, None


# --- Document validation ---

ALLOWED_EXTENSIONS = {
    ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp",
    ".doc", ".docx", ".xls", ".xlsx", ".txt",
}

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB default


def validate_document_upload(file, name, category, allowed_categories, max_file_size=MAX_FILE_SIZE):
    """Validate a document upload.  Returns (cleaned, error)."""
    if not name or not name.strip():
        return None, "Document name is required"
    name = name.strip()

    if not category or not category.strip():
        return None, "Document category is required"
    category = category.strip()
    if category not in allowed_categories:
        return None, f"Category must be one of: {', '.join(allowed_categories)}"

    if file is None or file.filename == "":
        return None, "No file provided"

    original_filename = file.filename
    import os
    ext = os.path.splitext(original_filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return None, f"File type '{ext}' is not allowed"

    # Read file to check size and emptiness
    file_data = file.read()
    file.seek(0)

    if len(file_data) == 0:
        return None, "File is empty"

    if len(file_data) > max_file_size:
        return None, f"File exceeds maximum size of {max_file_size // (1024 * 1024)} MB"

    # Check MIME type
    mime_type = file.content_type or "application/octet-stream"
    if mime_type not in ALLOWED_MIME_TYPES:
        return None, f"MIME type '{mime_type}' is not allowed"

    return {
        "name": name,
        "category": category,
        "original_filename": original_filename,
        "mime_type": mime_type,
        "file_size": len(file_data),
    }, None
