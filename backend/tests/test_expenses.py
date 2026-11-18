import pytest


def expense_data(**changes):
    data = {
        "title": "Hotel",
        "amount": 5000,
        "category": "Accommodation",
        "date": "2026-11-11",
        "notes": "Two nights",
    }
    return {**data, **changes}


def test_get_expenses_empty(client, trip):
    response = client.get(f"/api/trips/{trip['id']}/expenses")
    assert response.status_code == 200
    assert response.get_json() == []


def test_create_expense(client, trip):
    response = client.post(f"/api/trips/{trip['id']}/expenses", json=expense_data())
    assert response.status_code == 201
    expense = response.get_json()
    assert expense["trip_id"] == trip["id"]
    assert expense["title"] == "Hotel"
    assert expense["amount"] == 5000
    assert expense["category"] == "Accommodation"
    assert expense["notes"] == "Two nights"


def test_create_expense_without_notes(client, trip):
    data = expense_data()
    del data["notes"]
    response = client.post(f"/api/trips/{trip['id']}/expenses", json=data)
    assert response.status_code == 201
    assert response.get_json()["notes"] == ""


def test_expenses_sorted_newest_first(client, trip):
    url = f"/api/trips/{trip['id']}/expenses"
    client.post(url, json=expense_data(title="Earlier", date="2026-11-10"))
    client.post(url, json=expense_data(title="Later", date="2026-11-13"))
    titles = [expense["title"] for expense in client.get(url).get_json()]
    assert titles == ["Later", "Earlier"]


def test_get_expenses_only_returns_own_trip(client, trip):
    client.post(f"/api/trips/{trip['id']}/expenses", json=expense_data())
    other = client.post("/api/trips", json={
        "name": "Other", "destination": "Elsewhere",
        "start_date": "2026-11-10", "end_date": "2026-11-14",
    }).get_json()
    assert client.get(f"/api/trips/{other['id']}/expenses").get_json() == []


def test_update_expense(client, trip):
    expense = client.post(f"/api/trips/{trip['id']}/expenses", json=expense_data()).get_json()
    response = client.put(f"/api/expenses/{expense['id']}", json=expense_data(
        title="Airport taxi", amount=800, category="Transport", date="2026-11-12"
    ))
    assert response.status_code == 200
    updated = response.get_json()
    assert updated["title"] == "Airport taxi"
    assert updated["amount"] == 800
    assert updated["category"] == "Transport"
    assert updated["trip_id"] == trip["id"]


def test_delete_expense(client, trip):
    expense = client.post(f"/api/trips/{trip['id']}/expenses", json=expense_data()).get_json()
    response = client.delete(f"/api/expenses/{expense['id']}")
    assert response.status_code == 200
    assert client.get(f"/api/trips/{trip['id']}/expenses").get_json() == []


@pytest.mark.parametrize("changes, message", [
    ({"title": ""}, "Title is required"),
    ({"category": ""}, "Category is required"),
    ({"amount": 0}, "Amount must be positive"),
    ({"amount": -1}, "Amount must be positive"),
    ({"amount": "many"}, "Amount must be a number"),
    ({"date": ""}, "Date is required"),
    ({"date": "tomorrow"}, "Date must be a valid date (YYYY-MM-DD)"),
    ({"date": "2026-11-09"}, "Expense date must be within the trip dates"),
    ({"date": "2026-11-15"}, "Expense date must be within the trip dates"),
])
def test_create_expense_invalid_data(client, trip, changes, message):
    response = client.post(f"/api/trips/{trip['id']}/expenses", json=expense_data(**changes))
    assert response.status_code == 400
    assert response.get_json() == {"error": message}


def test_expense_allowed_on_first_and_last_trip_day(client, trip):
    url = f"/api/trips/{trip['id']}/expenses"
    assert client.post(url, json=expense_data(date="2026-11-10")).status_code == 201
    assert client.post(url, json=expense_data(date="2026-11-14")).status_code == 201


def test_expense_not_found(client):
    assert client.put("/api/expenses/999", json=expense_data()).status_code == 404
    assert client.delete("/api/expenses/999").status_code == 404


def test_invalid_expense_id(client):
    assert client.get("/api/trips/abc/expenses").status_code == 400
    assert client.delete("/api/expenses/abc").status_code == 400


def test_expenses_for_missing_trip(client):
    assert client.get("/api/trips/999/expenses").status_code == 404
    assert client.post("/api/trips/999/expenses", json=expense_data()).status_code == 404
