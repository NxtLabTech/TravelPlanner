from datetime import date, timedelta

import pytest


def trip_data(**changes):
    data = {
        "name": "Manali Trip",
        "destination": "Manali",
        "start_date": "2026-12-01",
        "end_date": "2026-12-05",
        "budget": 15000,
        "description": "Snow",
    }
    return {**data, **changes}


def days_from_today(days):
    return (date.today() + timedelta(days=days)).isoformat()


def test_get_trips_empty(client):
    response = client.get("/api/trips")
    assert response.status_code == 200
    assert response.get_json() == {
        "trips": [], "page": 1, "limit": 10, "total": 0, "total_pages": 0
    }


def test_get_trips(client, trip):
    response = client.get("/api/trips")
    assert response.status_code == 200
    payload = response.get_json()
    trips = payload["trips"]
    assert len(trips) == 1
    assert trips[0]["name"] == "Goa Trip"


def test_create_trip(client):
    response = client.post("/api/trips", json=trip_data())
    assert response.status_code == 201
    trip = response.get_json()
    assert trip["id"] == 1
    assert trip["name"] == "Manali Trip"
    assert trip["budget"] == 15000
    assert trip["created_at"]
    assert trip["reminder_days"] is None
    assert trip["timezone"] == "UTC"
    assert trip["destinations"] == ["Manali"]


def test_create_trip_stores_timezone(client):
    response = client.post("/api/trips", json=trip_data(timezone="America/New_York"))
    assert response.status_code == 201
    assert response.get_json()["timezone"] == "America/New_York"


@pytest.mark.parametrize("timezone", ("Not/AZone", "UTC/Invalid", 3))
def test_create_trip_rejects_invalid_timezone(client, timezone):
    response = client.post("/api/trips", json=trip_data(timezone=timezone))
    assert response.status_code == 400
    assert response.get_json() == {"error": "Timezone must be a valid IANA timezone"}


def test_update_trip_timezone(client, trip):
    response = client.put(
        f"/api/trips/{trip['id']}",
        json=trip_data(timezone="Asia/Kolkata"),
    )
    assert response.status_code == 200
    assert response.get_json()["timezone"] == "Asia/Kolkata"


def test_create_trip_stores_destinations_in_order(client):
    response = client.post(
        "/api/trips",
        json=trip_data(
            destination="Hyderabad",
            destinations=["Hyderabad", "Goa", "Mumbai", "Hyderabad"],
        ),
    )
    assert response.status_code == 201
    assert response.get_json()["destinations"] == ["Hyderabad", "Goa", "Mumbai", "Hyderabad"]


def test_update_trip_reorders_destinations(client, trip):
    response = client.put(
        f"/api/trips/{trip['id']}",
        json=trip_data(
            destination="Mumbai",
            destinations=["Mumbai", "Goa"],
        ),
    )
    assert response.status_code == 200
    assert response.get_json()["destinations"] == ["Mumbai", "Goa"]


@pytest.mark.parametrize("destinations", ([], ["Goa", ""], ["Goa", 3]))
def test_create_trip_rejects_invalid_destinations(client, destinations):
    response = client.post("/api/trips", json=trip_data(destinations=destinations))
    assert response.status_code == 400


def test_create_trip_with_reminder(client):
    response = client.post("/api/trips", json=trip_data(reminder_days=3))
    assert response.status_code == 201
    assert response.get_json()["reminder_days"] == 3


@pytest.mark.parametrize("reminder_days", (0, 2, 4, 8, "3", True))
def test_create_trip_rejects_invalid_reminder(client, reminder_days):
    response = client.post("/api/trips", json=trip_data(reminder_days=reminder_days))
    assert response.status_code == 400
    assert response.get_json() == {
        "error": "Reminder must be 1, 3, or 7 days before the trip"
    }


def test_completed_trip_cannot_have_reminder(client):
    response = client.post(
        "/api/trips",
        json=trip_data(
            start_date=days_from_today(-10),
            end_date=days_from_today(-5),
            reminder_days=1,
        ),
    )
    assert response.status_code == 400
    assert response.get_json() == {"error": "Completed trips cannot have reminders"}


def test_update_trip_reminder(client, trip):
    response = client.put(
        f"/api/trips/{trip['id']}",
        json=trip_data(reminder_days=7),
    )
    assert response.status_code == 200
    assert response.get_json()["reminder_days"] == 7


def test_create_trip_without_budget_defaults_to_zero(client):
    data = trip_data()
    del data["budget"]
    response = client.post("/api/trips", json=data)
    assert response.status_code == 201
    assert response.get_json()["budget"] == 0


def test_get_trip(client, trip):
    response = client.get(f"/api/trips/{trip['id']}")
    assert response.status_code == 200
    assert response.get_json()["destination"] == "Goa"


def test_update_trip(client, trip):
    data = trip_data(name="Goa Trip 2", destination="North Goa")
    response = client.put(f"/api/trips/{trip['id']}", json=data)
    assert response.status_code == 200
    assert response.get_json()["name"] == "Goa Trip 2"

    saved = client.get(f"/api/trips/{trip['id']}").get_json()
    assert saved["destination"] == "North Goa"


def test_delete_trip(client, trip):
    response = client.delete(f"/api/trips/{trip['id']}")
    assert response.status_code == 200
    assert client.get(f"/api/trips/{trip['id']}").status_code == 404


def test_delete_trip_deletes_its_activities(client, trip, activity):
    client.delete(f"/api/trips/{trip['id']}")
    assert client.put(f"/api/activities/{activity['id']}", json={}).status_code == 404


@pytest.mark.parametrize("changes, message", [
    ({"name": ""}, "Name is required"),
    ({"name": "   "}, "Name is required"),
    ({"destination": ""}, "Destination is required"),
    ({"start_date": ""}, "Start date is required"),
    ({"end_date": ""}, "End date is required"),
    ({"start_date": "10-11-2026"}, "Start date must be a valid date (YYYY-MM-DD)"),
    ({"end_date": "2026-11-31"}, "End date must be a valid date (YYYY-MM-DD)"),
    ({"start_date": "2026-12-10", "end_date": "2026-12-01"}, "End date cannot be before start date"),
    ({"budget": -1}, "Budget cannot be negative"),
    ({"budget": "lots"}, "Budget must be a number"),
])
def test_create_trip_invalid_data(client, changes, message):
    response = client.post("/api/trips", json=trip_data(**changes))
    assert response.status_code == 400
    assert response.get_json() == {"error": message}


def test_create_trip_without_json_body(client):
    response = client.post("/api/trips", data="not json")
    assert response.status_code == 400


def test_update_trip_invalid_data(client, trip):
    response = client.put(f"/api/trips/{trip['id']}", json=trip_data(budget=-5))
    assert response.status_code == 400
    assert client.get(f"/api/trips/{trip['id']}").get_json()["budget"] == 20000


def test_trip_not_found(client):
    assert client.get("/api/trips/999").status_code == 404
    assert client.put("/api/trips/999", json=trip_data()).status_code == 404
    response = client.delete("/api/trips/999")
    assert response.status_code == 404
    assert response.get_json() == {"error": "Trip not found"}


def test_invalid_trip_id(client):
    for bad_id in ("abc", "0", "-3"):
        response = client.get(f"/api/trips/{bad_id}")
        assert response.status_code == 400
        assert response.get_json() == {"error": "Invalid trip id"}


def test_update_trip_dates_cannot_leave_activities_outside(client, trip, activity):
    # the activity is on 2026-11-10, the first day of the trip
    data = trip_data(start_date="2026-11-11", end_date="2026-11-14")
    response = client.put(f"/api/trips/{trip['id']}", json=data)
    assert response.status_code == 400
    assert "activities fall outside" in response.get_json()["error"]
    assert client.get(f"/api/trips/{trip['id']}").get_json()["start_date"] == "2026-11-10"


def test_update_trip_dates_allowed_when_activities_still_fit(client, trip, activity):
    wider = trip_data(start_date="2026-11-01", end_date="2026-11-30")
    assert client.put(f"/api/trips/{trip['id']}", json=wider).status_code == 200

    narrower = trip_data(start_date="2026-11-10", end_date="2026-11-10")
    assert client.put(f"/api/trips/{trip['id']}", json=narrower).status_code == 200


def test_huge_numbers_are_rejected_not_server_errors(client):
    assert client.post("/api/trips", json=trip_data(budget=10**30)).status_code == 400
    assert client.post("/api/trips", json=trip_data(budget=1e300)).status_code == 400
    assert client.get("/api/trips/99999999999999999999").status_code == 400


def test_id_must_be_plain_digits(client):
    assert client.get("/api/trips/1_0").status_code == 400
    assert client.get("/api/trips/+1").status_code == 400


def test_search_treats_wildcards_as_plain_text(client, trip):
    client.post("/api/trips", json=trip_data(name="100% Fun"))
    client.post("/api/trips", json=trip_data(name="Ski_Trip"))

    assert [t["name"] for t in client.get("/api/trips?search=%25").get_json()["trips"]] == ["100% Fun"]
    assert [t["name"] for t in client.get("/api/trips?search=i_T").get_json()["trips"]] == ["Ski_Trip"]


def test_search_trips(client, trip):
    client.post("/api/trips", json=trip_data())

    by_name = client.get("/api/trips?search=goa").get_json()["trips"]
    assert [t["name"] for t in by_name] == ["Goa Trip"]

    by_destination = client.get("/api/trips?search=MANALI").get_json()["trips"]
    assert [t["destination"] for t in by_destination] == ["Manali"]

    assert client.get("/api/trips?search=paris").get_json()["trips"] == []


def test_filter_trips_by_status(client):
    client.post("/api/trips", json=trip_data(name="Past", start_date=days_from_today(-10), end_date=days_from_today(-5)))
    client.post("/api/trips", json=trip_data(name="Now", start_date=days_from_today(-1), end_date=days_from_today(1)))
    client.post("/api/trips", json=trip_data(name="Next", start_date=days_from_today(5), end_date=days_from_today(9)))

    def names(status):
        return [t["name"] for t in client.get(f"/api/trips?status={status}").get_json()["trips"]]

    assert names("completed") == ["Past"]
    assert names("ongoing") == ["Now"]
    assert names("upcoming") == ["Next"]


def test_trip_status_includes_first_and_last_day(client):
    today = days_from_today(0)
    client.post("/api/trips", json=trip_data(name="Starts today", start_date=today, end_date=days_from_today(3)))
    client.post("/api/trips", json=trip_data(name="Ends today", start_date=days_from_today(-3), end_date=today))

    ongoing = client.get("/api/trips?status=ongoing").get_json()["trips"]
    assert sorted(t["name"] for t in ongoing) == ["Ends today", "Starts today"]


def test_invalid_status_filter(client):
    response = client.get("/api/trips?status=someday")
    assert response.status_code == 400


def test_weather_for_trip(client, trip, monkeypatch):
    from routes import weather

    responses = iter([
        {"results": [{"latitude": 17.385, "longitude": 78.4867}]},
        {"current": {
            "temperature_2m": 28.5,
            "relative_humidity_2m": 62,
            "wind_speed_10m": 12.3,
            "weather_code": 1,
        }},
    ])
    monkeypatch.setattr(weather, "fetch_json", lambda url: next(responses))

    response = client.get(f"/api/trips/{trip['id']}/weather")

    assert response.status_code == 200
    assert response.get_json() == {
        "temperature": 28.5,
        "condition": "Mainly clear",
        "humidity": 62,
        "wind_speed": 12.3,
        "units": {"temperature": "°C", "wind_speed": "km/h"},
    }


def test_weather_failure_returns_unavailable(client, trip, monkeypatch):
    from routes import weather

    def fail(url):
        raise weather.URLError("provider unavailable")

    monkeypatch.setattr(weather, "fetch_json", fail)

    response = client.get(f"/api/trips/{trip['id']}/weather")

    assert response.status_code == 503
    assert response.get_json() == {"error": "Weather information is unavailable"}


def test_trip_location(client, trip, monkeypatch):
    from routes import weather

    monkeypatch.setattr(
        weather,
        "fetch_json",
        lambda url: {"results": [{"latitude": 17.385, "longitude": 78.4867}]},
    )

    response = client.get(f"/api/trips/{trip['id']}/location")

    assert response.status_code == 200
    assert response.get_json() == {"latitude": 17.385, "longitude": 78.4867}


def test_trip_location_failure_returns_unavailable(client, trip, monkeypatch):
    from routes import weather

    monkeypatch.setattr(
        weather,
        "fetch_json",
        lambda url: {"results": []},
    )

    response = client.get(f"/api/trips/{trip['id']}/location")

    assert response.status_code == 503
    assert response.get_json() == {"error": "Map location is unavailable"}


def test_paginate_trips(client, trip):
    for index in range(1, 4):
        client.post("/api/trips", json=trip_data(name=f"Trip {index}"))

    response = client.get("/api/trips?page=2&limit=2")

    assert response.status_code == 200
    payload = response.get_json()
    assert [item["name"] for item in payload["trips"]] == ["Trip 2", "Trip 3"]
    assert payload["page"] == 2
    assert payload["limit"] == 2
    assert payload["total"] == 4
    assert payload["total_pages"] == 2


@pytest.mark.parametrize("query", [
    "page=0", "page=-1", "page=one", "limit=0", "limit=-1", "limit=ten", "limit=101",
])
def test_invalid_pagination_values(client, query):
    response = client.get(f"/api/trips?{query}")
    assert response.status_code == 400
    assert "error" in response.get_json()


def test_unknown_route_returns_json(client):
    response = client.get("/api/nothing")
    assert response.status_code == 404
    assert response.get_json() == {"error": "Not Found"}
