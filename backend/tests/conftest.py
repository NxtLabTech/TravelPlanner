import pytest

from app import create_app


@pytest.fixture
def client(tmp_path):
    app = create_app(str(tmp_path / "test.db"))
    return app.test_client()


@pytest.fixture
def trip(client):
    response = client.post("/api/trips", json={
        "name": "Goa Trip",
        "destination": "Goa",
        "start_date": "2026-11-10",
        "end_date": "2026-11-14",
        "budget": 20000,
        "description": "Weekend trip with friends",
    })
    return response.get_json()


@pytest.fixture
def activity(client, trip):
    response = client.post(f"/api/trips/{trip['id']}/activities", json={
        "title": "Visit Baga Beach",
        "date": "2026-11-10",
        "time": "10:00",
        "location": "Baga Beach",
        "notes": "Spend the morning at the beach",
    })
    return response.get_json()
