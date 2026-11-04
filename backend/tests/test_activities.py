import pytest


def activity_data(**changes):
    data = {
        "title": "Dinner",
        "date": "2026-11-11",
        "time": "20:00",
        "location": "Fisherman's Wharf",
        "notes": "Book a table",
    }
    return {**data, **changes}


def test_get_activities_empty(client, trip):
    response = client.get(f"/api/trips/{trip['id']}/activities")
    assert response.status_code == 200
    assert response.get_json() == []


def test_create_activity(client, trip):
    response = client.post(f"/api/trips/{trip['id']}/activities", json=activity_data())
    assert response.status_code == 201
    activity = response.get_json()
    assert activity["trip_id"] == trip["id"]
    assert activity["title"] == "Dinner"
    assert activity["time"] == "20:00"


def test_create_activity_with_only_required_fields(client, trip):
    data = {"title": "Free day", "date": "2026-11-12"}
    response = client.post(f"/api/trips/{trip['id']}/activities", json=data)
    assert response.status_code == 201
    assert response.get_json()["location"] == ""
    assert response.get_json()["duration_minutes"] is None
    assert response.get_json()["end_time"] is None


def test_create_activity_with_duration_calculates_end_time(client, trip):
    data = activity_data(title="Visit Museum", time="10:00", duration_minutes=120)
    response = client.post(f"/api/trips/{trip['id']}/activities", json=data)
    assert response.status_code == 201
    activity = response.get_json()
    assert activity["duration_minutes"] == 120
    assert activity["end_time"] == "12:00"


def test_end_time_handles_minutes(client, trip):
    data = activity_data(time="09:45", duration_minutes=95)
    response = client.post(f"/api/trips/{trip['id']}/activities", json=data)
    assert response.get_json()["end_time"] == "11:20"


def test_activity_can_end_just_before_midnight(client, trip):
    data = activity_data(time="23:00", duration_minutes=59)
    response = client.post(f"/api/trips/{trip['id']}/activities", json=data)
    assert response.status_code == 201
    assert response.get_json()["end_time"] == "23:59"


def test_empty_duration_means_no_duration(client, trip):
    data = activity_data(duration_minutes="")
    response = client.post(f"/api/trips/{trip['id']}/activities", json=data)
    assert response.status_code == 201
    assert response.get_json()["duration_minutes"] is None


def test_list_activities_includes_end_time(client, trip):
    url = f"/api/trips/{trip['id']}/activities"
    client.post(url, json=activity_data(time="10:00", duration_minutes=90))
    assert client.get(url).get_json()[0]["end_time"] == "11:30"


def test_update_activity_duration(client, activity):
    data = activity_data(date=activity["date"], time="10:00", duration_minutes=45)
    response = client.put(f"/api/activities/{activity['id']}", json=data)
    assert response.status_code == 200
    assert response.get_json()["end_time"] == "10:45"

    data["duration_minutes"] = None
    response = client.put(f"/api/activities/{activity['id']}", json=data)
    assert response.get_json()["duration_minutes"] is None
    assert response.get_json()["end_time"] is None


def test_get_activities_sorted_by_date_and_time(client, trip):
    url = f"/api/trips/{trip['id']}/activities"
    client.post(url, json=activity_data(title="Late", date="2026-11-12", time="09:00"))
    client.post(url, json=activity_data(title="Evening", date="2026-11-11", time="20:00"))
    client.post(url, json=activity_data(title="Morning", date="2026-11-11", time="08:00"))

    titles = [a["title"] for a in client.get(url).get_json()]
    assert titles == ["Morning", "Evening", "Late"]


def test_get_activities_only_returns_own_trip(client, trip, activity):
    other = client.post("/api/trips", json={
        "name": "Other", "destination": "Elsewhere",
        "start_date": "2026-11-10", "end_date": "2026-11-14",
    }).get_json()
    assert client.get(f"/api/trips/{other['id']}/activities").get_json() == []


def test_update_activity(client, activity):
    data = activity_data(title="Sunset at Baga", date="2026-11-13", time="17:30")
    response = client.put(f"/api/activities/{activity['id']}", json=data)
    assert response.status_code == 200
    updated = response.get_json()
    assert updated["title"] == "Sunset at Baga"
    assert updated["date"] == "2026-11-13"
    assert updated["trip_id"] == activity["trip_id"]


def test_delete_activity(client, trip, activity):
    response = client.delete(f"/api/activities/{activity['id']}")
    assert response.status_code == 200
    assert client.get(f"/api/trips/{trip['id']}/activities").get_json() == []


def test_activities_for_missing_trip(client):
    assert client.get("/api/trips/999/activities").status_code == 404
    response = client.post("/api/trips/999/activities", json=activity_data())
    assert response.status_code == 404
    assert response.get_json() == {"error": "Trip not found"}


def test_activity_not_found(client):
    assert client.put("/api/activities/999", json=activity_data()).status_code == 404
    response = client.delete("/api/activities/999")
    assert response.status_code == 404
    assert response.get_json() == {"error": "Activity not found"}


def test_invalid_activity_id(client):
    response = client.delete("/api/activities/abc")
    assert response.status_code == 400
    assert response.get_json() == {"error": "Invalid activity id"}


@pytest.mark.parametrize("changes, message", [
    ({"title": ""}, "Title is required"),
    ({"date": ""}, "Date is required"),
    ({"date": "tomorrow"}, "Date must be a valid date (YYYY-MM-DD)"),
    ({"date": "2026-11-09"}, "Activity date must be within the trip dates"),
    ({"date": "2026-11-15"}, "Activity date must be within the trip dates"),
    ({"time": "25:00"}, "Time must be in HH:MM format"),
    ({"duration_minutes": 0}, "Duration must be greater than zero"),
    ({"duration_minutes": -30}, "Duration must be greater than zero"),
    ({"duration_minutes": 1.5}, "Duration must be a whole number of minutes"),
    ({"duration_minutes": "2 hours"}, "Duration must be a whole number of minutes"),
    ({"duration_minutes": True}, "Duration must be a whole number of minutes"),
    ({"time": "", "duration_minutes": 60}, "Start time is required when a duration is set"),
    ({"time": "23:00", "duration_minutes": 60}, "Activity must end before midnight"),
])
def test_create_activity_invalid_data(client, trip, changes, message):
    response = client.post(f"/api/trips/{trip['id']}/activities", json=activity_data(**changes))
    assert response.status_code == 400
    assert response.get_json() == {"error": message}


def test_activity_allowed_on_first_and_last_trip_day(client, trip):
    url = f"/api/trips/{trip['id']}/activities"
    assert client.post(url, json=activity_data(date="2026-11-10")).status_code == 201
    assert client.post(url, json=activity_data(date="2026-11-14")).status_code == 201


def test_update_activity_invalid_date(client, activity):
    response = client.put(f"/api/activities/{activity['id']}", json=activity_data(date="2027-01-01"))
    assert response.status_code == 400


def test_update_activity_invalid_json(client, activity):
    response = client.put(
        f"/api/activities/{activity['id']}",
        data="not a json string",
        content_type="application/json",
    )
    assert response.status_code == 400


def test_create_activity_invalid_json(client, trip):
    response = client.post(
        f"/api/trips/{trip['id']}/activities",
        data="not a json string",
        content_type="application/json",
    )
    assert response.status_code == 400


@pytest.fixture
def museum(client, trip):
    response = client.post(f"/api/trips/{trip['id']}/activities", json=activity_data(
        title="Visit Museum", date="2026-11-12", time="10:00", duration_minutes=120,
    ))
    return response.get_json()


@pytest.mark.parametrize("time, duration", [
    ("10:00", None),   # same start time
    ("11:00", None),   # starts during the museum visit
    ("09:00", 90),     # runs into the museum visit
    ("09:00", 240),    # covers the whole museum visit
    ("10:30", 30),     # inside the museum visit
])
def test_create_overlapping_activity_rejected(client, trip, museum, time, duration):
    data = activity_data(date="2026-11-12", time=time, duration_minutes=duration)
    response = client.post(f"/api/trips/{trip['id']}/activities", json=data)
    assert response.status_code == 409
    assert response.get_json() == {"error": 'Overlaps with "Visit Museum" (10:00–12:00)'}


@pytest.mark.parametrize("time, duration", [
    ("12:00", 60),     # starts when the museum visit ends
    ("08:00", 120),    # ends when the museum visit starts
    ("13:00", None),
])
def test_back_to_back_activities_allowed(client, trip, museum, time, duration):
    data = activity_data(date="2026-11-12", time=time, duration_minutes=duration)
    response = client.post(f"/api/trips/{trip['id']}/activities", json=data)
    assert response.status_code == 201


def test_overlap_only_checked_on_same_trip_and_day(client, trip, museum):
    url = f"/api/trips/{trip['id']}/activities"
    assert client.post(url, json=activity_data(date="2026-11-13", time="10:00")).status_code == 201

    other = client.post("/api/trips", json={
        "name": "Other", "destination": "Elsewhere",
        "start_date": "2026-11-10", "end_date": "2026-11-14",
    }).get_json()
    other_url = f"/api/trips/{other['id']}/activities"
    assert client.post(other_url, json=activity_data(date="2026-11-12", time="10:00")).status_code == 201


def test_activities_without_time_never_overlap(client, trip, museum):
    data = activity_data(date="2026-11-12", time="")
    response = client.post(f"/api/trips/{trip['id']}/activities", json=data)
    assert response.status_code == 201


def test_overlap_message_without_duration(client, trip, activity):
    data = activity_data(date=activity["date"], time=activity["time"])
    response = client.post(f"/api/trips/{trip['id']}/activities", json=data)
    assert response.status_code == 409
    assert response.get_json() == {"error": 'Overlaps with "Visit Baga Beach" (10:00)'}


def test_update_activity_does_not_overlap_itself(client, museum):
    data = activity_data(date="2026-11-12", time="10:30", duration_minutes=120)
    response = client.put(f"/api/activities/{museum['id']}", json=data)
    assert response.status_code == 200
    assert response.get_json()["end_time"] == "12:30"


def test_update_activity_into_overlap_rejected(client, trip, museum):
    url = f"/api/trips/{trip['id']}/activities"
    client.post(url, json=activity_data(date="2026-11-12", time="13:00"))

    data = activity_data(date="2026-11-12", time="13:00", duration_minutes=60)
    response = client.put(f"/api/activities/{museum['id']}", json=data)
    assert response.status_code == 409
    assert response.get_json() == {"error": 'Overlaps with "Dinner" (13:00)'}
