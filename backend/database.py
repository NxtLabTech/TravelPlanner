import sqlite3

from flask import current_app, g

SCHEMA = """
CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    budget NUMERIC NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    reminder_days INTEGER,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL DEFAULT '',
    duration INTEGER NOT NULL DEFAULT 0,
    location TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_activities_trip_id ON activities(trip_id);

CREATE TABLE IF NOT EXISTS trip_destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    destination TEXT NOT NULL,
    position INTEGER NOT NULL,
    UNIQUE(trip_id, position)
);

CREATE INDEX IF NOT EXISTS idx_trip_destinations_trip_id ON trip_destinations(trip_id);

CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);

CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL,
    file_reference TEXT NOT NULL UNIQUE,
    uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_trip_id ON documents(trip_id);
"""


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(error=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db(path):
    db = sqlite3.connect(path)
    db.executescript(SCHEMA)
    columns = {row[1] for row in db.execute("PRAGMA table_info(activities)")}
    if "duration" not in columns:
        db.execute("ALTER TABLE activities ADD COLUMN duration INTEGER NOT NULL DEFAULT 0")
        db.commit()
    trip_columns = {row[1] for row in db.execute("PRAGMA table_info(trips)")}
    if "user_id" not in trip_columns:
        db.execute("ALTER TABLE trips ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE")
        db.commit()
    if "reminder_days" not in trip_columns:
        db.execute("ALTER TABLE trips ADD COLUMN reminder_days INTEGER")
        db.commit()
    if "timezone" not in trip_columns:
        db.execute("ALTER TABLE trips ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC'")
        db.commit()
    db.close()
