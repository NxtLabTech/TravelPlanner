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


def test_expense_crud(client, trip):
    url = f"/api/trips/{trip['id']}/expenses"
    created = client.post(url, json=expense_data())
    assert created.status_code == 201
    expense = created.get_json()
    assert expense["trip_id"] == trip["id"]

    listed = client.get(url)
    assert listed.status_code == 200
    assert listed.get_json()[0]["title"] == "Hotel"

    updated = client.put(
        f"/api/expenses/{expense['id']}",
        json=expense_data(title="Taxi", amount=800, category="Transport"),
    )
    assert updated.status_code == 200
    assert updated.get_json()["amount"] == 800

    deleted = client.delete(f"/api/expenses/{expense['id']}")
    assert deleted.status_code == 200
    assert client.get(url).get_json() == []


@pytest.mark.parametrize("changes, message", [
    ({"amount": 0}, "Amount must be positive"),
    ({"amount": -1}, "Amount must be positive"),
    ({"amount": "500"}, "Amount must be a number"),
    ({"date": "2026-11-09"}, "Expense date must be within the trip dates"),
    ({"title": ""}, "Title is required"),
    ({"category": ""}, "Category is required"),
])
def test_invalid_expense_data(client, trip, changes, message):
    response = client.post(
        f"/api/trips/{trip['id']}/expenses",
        json=expense_data(**changes),
    )
    assert response.status_code == 400
    assert response.get_json() == {"error": message}


def test_deleting_trip_deletes_expenses(client, trip):
    expense = client.post(
        f"/api/trips/{trip['id']}/expenses",
        json=expense_data(),
    ).get_json()

    assert client.delete(f"/api/trips/{trip['id']}").status_code == 200
    assert client.get(f"/api/trips/{trip['id']}/expenses").status_code == 404


def test_expense_not_found_and_invalid_id(client, trip):
    assert client.get(f"/api/trips/{trip['id']}/expenses").status_code == 200
    assert client.delete("/api/expenses/abc").get_json() == {"error": "Invalid expense id"}
    assert client.delete("/api/expenses/999").get_json() == {"error": "Expense not found"}
