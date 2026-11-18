def test_trip_and_activity_lifecycle(client):
    """Integration test verifying complete user workflow:
    1. Create a trip.
    2. Get the created trip.
    3. Add an activity.
    4. Get the trip activities.
    5. Update the activity.
    6. Update the trip.
    7. Delete the activity.
    8. Delete the trip.
    9. Verify the trip no longer exists.
    """
    # 1. Create a trip
    print("\n[Step 1/9] Creating a new trip...")
    trip_payload = {
        "name": "Japan Vacation",
        "destination": "Tokyo",
        "start_date": "2026-12-01",
        "end_date": "2026-12-10",
        "budget": 50000,
        "description": "Exploring Tokyo and Kyoto",
    }
    create_trip_response = client.post("/api/trips", json=trip_payload)
    assert create_trip_response.status_code == 201
    created_trip = create_trip_response.get_json()
    trip_id = created_trip["id"]
    assert trip_id is not None
    assert created_trip["name"] == trip_payload["name"]
    assert created_trip["destination"] == trip_payload["destination"]
    assert created_trip["start_date"] == trip_payload["start_date"]
    assert created_trip["end_date"] == trip_payload["end_date"]
    assert created_trip["budget"] == trip_payload["budget"]
    assert created_trip["description"] == trip_payload["description"]
    print(f"  -> Trip created successfully: ID {trip_id} ('{created_trip['name']}')")

    # 2. Get the created trip
    print(f"\n[Step 2/9] Fetching created trip (ID: {trip_id})...")
    get_trip_response = client.get(f"/api/trips/{trip_id}")
    assert get_trip_response.status_code == 200
    retrieved_trip = get_trip_response.get_json()
    assert retrieved_trip["id"] == trip_id
    assert retrieved_trip["name"] == trip_payload["name"]
    assert retrieved_trip["destination"] == trip_payload["destination"]
    assert retrieved_trip["start_date"] == trip_payload["start_date"]
    assert retrieved_trip["end_date"] == trip_payload["end_date"]
    print(f"  -> Trip verified: {retrieved_trip['name']} to {retrieved_trip['destination']}")

    # 3. Add an activity
    print(f"\n[Step 3/9] Adding an activity to trip (ID: {trip_id})...")
    activity_payload = {
        "title": "Visit Senso-ji Temple",
        "date": "2026-12-02",
        "time": "09:30",
        "location": "Asakusa, Tokyo",
        "notes": "Arrive early to avoid crowds",
    }
    create_activity_response = client.post(
        f"/api/trips/{trip_id}/activities", json=activity_payload
    )
    assert create_activity_response.status_code == 201
    created_activity = create_activity_response.get_json()
    activity_id = created_activity["id"]
    assert activity_id is not None
    assert created_activity["trip_id"] == trip_id
    assert created_activity["title"] == activity_payload["title"]
    assert created_activity["date"] == activity_payload["date"]
    assert created_activity["time"] == activity_payload["time"]
    assert created_activity["location"] == activity_payload["location"]
    assert created_activity["notes"] == activity_payload["notes"]
    print(f"  -> Activity added successfully: ID {activity_id} ('{created_activity['title']}')")

    # 4. Get the trip activities
    print(f"\n[Step 4/9] Fetching activities for trip (ID: {trip_id})...")
    get_activities_response = client.get(f"/api/trips/{trip_id}/activities")
    assert get_activities_response.status_code == 200
    activities = get_activities_response.get_json()
    assert len(activities) == 1
    assert activities[0]["id"] == activity_id
    assert activities[0]["trip_id"] == trip_id
    assert activities[0]["title"] == activity_payload["title"]
    print(f"  -> Found {len(activities)} activity: '{activities[0]['title']}'")

    # 5. Update the activity
    print(f"\n[Step 5/9] Updating activity (ID: {activity_id})...")
    updated_activity_payload = {
        "title": "Visit Senso-ji Temple & Nakamise Shopping Street",
        "date": "2026-12-02",
        "time": "10:00",
        "location": "Asakusa, Tokyo",
        "notes": "Try street food at Nakamise",
    }
    update_activity_response = client.put(
        f"/api/activities/{activity_id}", json=updated_activity_payload
    )
    assert update_activity_response.status_code == 200
    updated_activity = update_activity_response.get_json()
    assert updated_activity["id"] == activity_id
    assert updated_activity["title"] == updated_activity_payload["title"]
    assert updated_activity["time"] == "10:00"
    assert updated_activity["notes"] == updated_activity_payload["notes"]

    # Verify activity update is reflected in the trip's activities list
    verify_activity_response = client.get(f"/api/trips/{trip_id}/activities")
    assert verify_activity_response.status_code == 200
    assert (
        verify_activity_response.get_json()[0]["title"]
        == updated_activity_payload["title"]
    )
    print(f"  -> Activity updated and verified: '{updated_activity['title']}' at {updated_activity['time']}")

    # 6. Update the trip
    print(f"\n[Step 6/9] Updating trip (ID: {trip_id})...")
    updated_trip_payload = {
        "name": "Japan Winter Holiday",
        "destination": "Tokyo & Kyoto",
        "start_date": "2026-12-01",
        "end_date": "2026-12-12",
        "budget": 60000,
        "description": "Updated holiday itinerary with Kyoto stay",
    }
    update_trip_response = client.put(
        f"/api/trips/{trip_id}", json=updated_trip_payload
    )
    assert update_trip_response.status_code == 200
    updated_trip = update_trip_response.get_json()
    assert updated_trip["id"] == trip_id
    assert updated_trip["name"] == updated_trip_payload["name"]
    assert updated_trip["destination"] == updated_trip_payload["destination"]
    assert updated_trip["end_date"] == updated_trip_payload["end_date"]
    assert updated_trip["budget"] == updated_trip_payload["budget"]

    # Verify trip update is reflected when fetching the trip
    get_updated_trip_response = client.get(f"/api/trips/{trip_id}")
    assert get_updated_trip_response.status_code == 200
    assert (
        get_updated_trip_response.get_json()["name"]
        == updated_trip_payload["name"]
    )
    print(f"  -> Trip updated and verified: '{updated_trip['name']}', Budget: {updated_trip['budget']}")

    # 7. Delete the activity
    print(f"\n[Step 7/9] Deleting activity (ID: {activity_id})...")
    delete_activity_response = client.delete(f"/api/activities/{activity_id}")
    assert delete_activity_response.status_code == 200
    assert delete_activity_response.get_json() == {"message": "Activity deleted"}

    # Verify activity list is now empty for this trip
    get_activities_after_delete = client.get(f"/api/trips/{trip_id}/activities")
    assert get_activities_after_delete.status_code == 200
    assert get_activities_after_delete.get_json() == []
    print("  -> Activity deleted and trip activities list confirmed empty")

    # 8. Delete the trip
    print(f"\n[Step 8/9] Deleting trip (ID: {trip_id})...")
    delete_trip_response = client.delete(f"/api/trips/{trip_id}")
    assert delete_trip_response.status_code == 200
    assert delete_trip_response.get_json() == {"message": "Trip deleted"}
    print("  -> Trip delete request succeeded")

    # 9. Verify the trip no longer exists
    print(f"\n[Step 9/9] Verifying trip (ID: {trip_id}) no longer exists...")
    get_deleted_trip_response = client.get(f"/api/trips/{trip_id}")
    assert get_deleted_trip_response.status_code == 404
    assert get_deleted_trip_response.get_json() == {"error": "Trip not found"}

    # Verify trip is not in the trips list
    list_trips_response = client.get("/api/trips")
    assert list_trips_response.status_code == 200
    assert not any(t["id"] == trip_id for t in list_trips_response.get_json())

    # Verify getting activities for deleted trip returns 404
    deleted_trip_activities_response = client.get(
        f"/api/trips/{trip_id}/activities"
    )
    assert deleted_trip_activities_response.status_code == 404
    assert deleted_trip_activities_response.get_json() == {
        "error": "Trip not found"
    }
    print("  -> Confirmed: Trip 404s, omitted from all trips list, and activities 404s")
    print("\n[SUCCESS] Full trip and activity lifecycle completed successfully!")
