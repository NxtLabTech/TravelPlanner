import sqlite3

from flask import current_app, g

SCHEMA = """
CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    budget NUMERIC NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    cost NUMERIC NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_activities_trip_id ON activities(trip_id);
"""

# Columns added after the first release. Databases created before them
# get the columns on startup, so existing data is kept.
ADDED_COLUMNS = {
    "activities": {
        "cost": "NUMERIC NOT NULL DEFAULT 0",
        "category": "TEXT NOT NULL DEFAULT ''",
    },
}


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
    for table, columns in ADDED_COLUMNS.items():
        existing = {row[1] for row in db.execute(f"PRAGMA table_info({table})")}
        for name, definition in columns.items():
            if name not in existing:
                db.execute(f"ALTER TABLE {table} ADD COLUMN {name} {definition}")
    db.commit()
    db.close()
