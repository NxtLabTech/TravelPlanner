import sqlite3

from app import create_app

# The activities table as it was before cost and category were added.
OLD_SCHEMA = """
CREATE TABLE trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    budget NUMERIC NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT ''
);
INSERT INTO trips (name, destination, start_date, end_date) VALUES ('Goa Trip', 'Goa', '2026-11-10', '2026-11-14');
INSERT INTO activities (trip_id, title, date) VALUES (1, 'Beach', '2026-11-10');
"""


def test_existing_database_gets_new_columns_and_keeps_data(tmp_path):
    path = tmp_path / "old.db"
    db = sqlite3.connect(path)
    db.executescript(OLD_SCHEMA)
    db.close()

    client = create_app(str(path)).test_client()

    activities = client.get("/api/trips/1/activities").get_json()
    assert len(activities) == 1
    assert activities[0]["title"] == "Beach"
    assert activities[0]["cost"] == 0
    assert activities[0]["category"] == ""

    response = client.post("/api/trips/1/activities", json={
        "title": "Dinner", "date": "2026-11-11", "cost": 900, "category": "food",
    })
    assert response.status_code == 201


def test_starting_twice_does_not_fail(tmp_path):
    path = str(tmp_path / "test.db")
    create_app(path)
    create_app(path)
