def test_complete_trip_workflow(client):
    create_trip = client.post(
        "/api/trips",
        json={
            "name": "Japan Trip",
            "destination": "Tokyo",
            "start_date": "2026-12-01",
            "end_date": "2026-12-10",
            "budget": 50000,
            "description": "Winter holiday",
        },
    )
    assert create_trip.status_code == 201
    trip = create_trip.get_json()
    trip_id = trip["id"]

    get_trip = client.get(f"/api/trips/{trip_id}")
    assert get_trip.status_code == 200
    assert get_trip.get_json()["name"] == "Japan Trip"

    create_activity = client.post(
        f"/api/trips/{trip_id}/activities",
        json={
            "title": "Visit museum",
            "date": "2026-12-02",
            "time": "10:00",
            "location": "Ueno",
            "notes": "Buy tickets",
        },
    )
    assert create_activity.status_code == 201
    activity_id = create_activity.get_json()["id"]

    get_activities = client.get(f"/api/trips/{trip_id}/activities")
    assert get_activities.status_code == 200
    assert [activity["id"] for activity in get_activities.get_json()] == [activity_id]

    update_activity = client.put(
        f"/api/activities/{activity_id}",
        json={
            "title": "Visit Tokyo National Museum",
            "date": "2026-12-03",
            "time": "11:30",
            "location": "Ueno Park",
            "notes": "Reserve an entry time",
        },
    )
    assert update_activity.status_code == 200
    assert update_activity.get_json()["title"] == "Visit Tokyo National Museum"

    update_trip = client.put(
        f"/api/trips/{trip_id}",
        json={
            "name": "Japan Winter Trip",
            "destination": "Tokyo",
            "start_date": "2026-12-01",
            "end_date": "2026-12-12",
            "budget": 60000,
            "description": "Extended winter holiday",
        },
    )
    assert update_trip.status_code == 200
    assert update_trip.get_json()["name"] == "Japan Winter Trip"

    delete_activity = client.delete(f"/api/activities/{activity_id}")
    assert delete_activity.status_code == 200
    assert client.get(f"/api/trips/{trip_id}/activities").get_json() == []

    delete_trip = client.delete(f"/api/trips/{trip_id}")
    assert delete_trip.status_code == 200

    missing_trip = client.get(f"/api/trips/{trip_id}")
    assert missing_trip.status_code == 404
