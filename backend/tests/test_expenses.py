import sqlite3

import pytest

from app import create_app


def expense_data(**changes):
    data = {
        "title": "Taxi",
        "amount": 800,
        "category": "transport",
        "date": "2026-11-10",
        "notes": "Airport to hotel",
    }
    return {**data, **changes}


@pytest.fixture
def expense(client, trip):
    response = client.post(f"/api/trips/{trip['id']}/expenses", json=expense_data())
    return response.get_json()


def test_get_expenses_empty(client, trip):
    response = client.get(f"/api/trips/{trip['id']}/expenses")
    assert response.status_code == 200
    assert response.get_json() == []


def test_create_expense(client, trip):
    response = client.post(f"/api/trips/{trip['id']}/expenses", json=expense_data())
    assert response.status_code == 201
    expense = response.get_json()
    assert expense["trip_id"] == trip["id"]
    assert expense["title"] == "Taxi"
    assert expense["amount"] == 800
    assert expense["category"] == "transport"
    assert expense["date"] == "2026-11-10"
    assert expense["notes"] == "Airport to hotel"


def test_create_expense_with_only_required_fields(client, trip):
    data = expense_data()
    del data["notes"]
    response = client.post(f"/api/trips/{trip['id']}/expenses", json=data)
    assert response.status_code == 201
    assert response.get_json()["notes"] == ""


def test_create_expense_cleans_values(client, trip):
    data = expense_data(title="  Dinner  ", amount=599.5, category=" Food ")
    expense = client.post(f"/api/trips/{trip['id']}/expenses", json=data).get_json()
    assert expense["title"] == "Dinner"
    assert expense["amount"] == 599.5
    assert expense["category"] == "food"


def test_expense_date_is_not_limited_to_trip_dates(client, trip):
    # Bookings such as flights and hotels are often paid before the trip starts.
    data = expense_data(title="Flight", date="2026-10-01")
    assert client.post(f"/api/trips/{trip['id']}/expenses", json=data).status_code == 201


def test_get_expenses_sorted_by_date(client, trip):
    url = f"/api/trips/{trip['id']}/expenses"
    client.post(url, json=expense_data(title="Dinner", date="2026-11-12"))
    client.post(url, json=expense_data(title="Hotel", date="2026-11-10"))
    client.post(url, json=expense_data(title="Taxi", date="2026-11-10"))

    titles = [e["title"] for e in client.get(url).get_json()]
    assert titles == ["Hotel", "Taxi", "Dinner"]


def test_get_expenses_only_returns_own_trip(client, trip, expense):
    other = client.post("/api/trips", json={
        "name": "Other", "destination": "Elsewhere",
        "start_date": "2026-11-10", "end_date": "2026-11-14",
    }).get_json()
    assert client.get(f"/api/trips/{other['id']}/expenses").get_json() == []


def test_update_expense(client, expense):
    data = expense_data(title="Hotel", amount=5000, category="accommodation", notes="")
    response = client.put(f"/api/expenses/{expense['id']}", json=data)
    assert response.status_code == 200
    updated = response.get_json()
    assert updated["title"] == "Hotel"
    assert updated["amount"] == 5000
    assert updated["category"] == "accommodation"
    assert updated["notes"] == ""
    assert updated["trip_id"] == expense["trip_id"]


def test_update_expense_invalid_data(client, trip, expense):
    response = client.put(f"/api/expenses/{expense['id']}", json=expense_data(amount=0))
    assert response.status_code == 400
    assert response.get_json() == {"error": "Amount must be greater than zero"}

    saved = client.get(f"/api/trips/{trip['id']}/expenses").get_json()
    assert saved[0]["amount"] == 800


def test_delete_expense(client, trip, expense):
    response = client.delete(f"/api/expenses/{expense['id']}")
    assert response.status_code == 200
    assert response.get_json() == {"message": "Expense deleted"}
    assert client.get(f"/api/trips/{trip['id']}/expenses").get_json() == []


def test_delete_trip_deletes_its_expenses(client, trip, expense):
    client.delete(f"/api/trips/{trip['id']}")
    assert client.delete(f"/api/expenses/{expense['id']}").status_code == 404


def test_expenses_for_missing_trip(client):
    assert client.get("/api/trips/999/expenses").status_code == 404
    response = client.post("/api/trips/999/expenses", json=expense_data())
    assert response.status_code == 404
    assert response.get_json() == {"error": "Trip not found"}


def test_expense_not_found(client):
    assert client.put("/api/expenses/999", json=expense_data()).status_code == 404
    response = client.delete("/api/expenses/999")
    assert response.status_code == 404
    assert response.get_json() == {"error": "Expense not found"}


def test_invalid_ids(client):
    response = client.get("/api/trips/abc/expenses")
    assert response.status_code == 400
    assert response.get_json() == {"error": "Invalid trip id"}

    for bad_id in ("abc", "0", "-1"):
        response = client.delete(f"/api/expenses/{bad_id}")
        assert response.status_code == 400
        assert response.get_json() == {"error": "Invalid expense id"}


@pytest.mark.parametrize("changes, message", [
    ({"title": ""}, "Title is required"),
    ({"title": "   "}, "Title is required"),
    ({"amount": None}, "Amount is required"),
    ({"amount": ""}, "Amount is required"),
    ({"amount": "800"}, "Amount must be a number"),
    ({"amount": True}, "Amount must be a number"),
    ({"amount": 0}, "Amount must be greater than zero"),
    ({"amount": -50}, "Amount must be greater than zero"),
    ({"amount": 10**13}, "Amount is too large"),
    ({"category": ""}, "Category is required"),
    ({"category": "flights"}, "Category must be one of: accommodation, transport, food, sightseeing, shopping, other"),
    ({"date": ""}, "Date is required"),
    ({"date": "10-11-2026"}, "Date must be a valid date (YYYY-MM-DD)"),
])
def test_create_expense_invalid_data(client, trip, changes, message):
    response = client.post(f"/api/trips/{trip['id']}/expenses", json=expense_data(**changes))
    assert response.status_code == 400
    assert response.get_json() == {"error": message}


def test_create_expense_without_amount(client, trip):
    data = expense_data()
    del data["amount"]
    response = client.post(f"/api/trips/{trip['id']}/expenses", json=data)
    assert response.status_code == 400
    assert response.get_json() == {"error": "Amount is required"}


def test_create_expense_without_json_body(client, trip):
    response = client.post(f"/api/trips/{trip['id']}/expenses", data="not json")
    assert response.status_code == 400
    assert response.get_json() == {"error": "Request body must be a JSON object"}


def test_existing_database_gets_expenses_table(tmp_path):
    # A database created before expenses existed should keep its data and gain the new table.
    path = str(tmp_path / "old.db")
    db = sqlite3.connect(path)
    db.executescript("""
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
        INSERT INTO trips (name, destination, start_date, end_date) VALUES ('Old', 'Goa', '2026-11-10', '2026-11-14');
    """)
    db.close()

    client = create_app(path).test_client()
    assert client.get("/api/trips/1").get_json()["name"] == "Old"
    assert client.post("/api/trips/1/expenses", json=expense_data()).status_code == 201
