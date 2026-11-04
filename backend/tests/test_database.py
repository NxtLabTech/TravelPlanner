import sqlite3

from database import init_db


def test_init_db_adds_duration_to_existing_database(tmp_path):
    path = str(tmp_path / "old.db")
    db = sqlite3.connect(path)
    db.execute("""CREATE TABLE activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL DEFAULT '',
        location TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT ''
    )""")
    db.execute("INSERT INTO activities (trip_id, title, date) VALUES (1, 'Old', '2026-11-10')")
    db.commit()
    db.close()

    init_db(path)
    init_db(path)  # running again must not fail

    db = sqlite3.connect(path)
    row = db.execute("SELECT title, duration_minutes FROM activities").fetchone()
    db.close()
    assert row == ("Old", None)
