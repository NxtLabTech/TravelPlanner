from pypdf import PdfReader

from io import BytesIO
import csv


def test_export_itinerary_contains_trip_and_sorted_activity_data(client, trip):
    client.post(
        f"/api/trips/{trip['id']}/activities",
        json={
            "title": "Dinner",
            "date": "2026-11-11",
            "time": "20:00",
            "location": "Beach Road",
            "notes": "Book a table",
        },
    )
    client.post(
        f"/api/trips/{trip['id']}/activities",
        json={
            "title": "Museum",
            "date": "2026-11-10",
            "time": "09:00",
            "location": "Old Town",
            "notes": "Bring tickets",
        },
    )

    response = client.get(f"/api/trips/{trip['id']}/itinerary.pdf")

    assert response.status_code == 200
    assert response.mimetype == "application/pdf"
    assert response.headers["Content-Disposition"].startswith("attachment;")
    text = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(response.data)).pages)
    assert "Goa Trip" in text
    assert "Goa" in text
    assert "20000" in text
    assert text.index("Museum") < text.index("Dinner")
    assert "Old Town" in text
    assert "Bring tickets" in text


def test_export_empty_itinerary_is_readable(client, trip):
    response = client.get(f"/api/trips/{trip['id']}/itinerary.pdf")

    assert response.status_code == 200
    text = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(response.data)).pages)
    assert "No activities planned." in text


def test_export_itinerary_trip_not_found(client):
    response = client.get("/api/trips/999/itinerary.pdf")

    assert response.status_code == 404
    assert response.get_json() == {"error": "Trip not found"}


def test_export_activities_csv_contains_sorted_rows_and_quoted_values(client, trip):
    client.post(
        f"/api/trips/{trip['id']}/activities",
        json={
            "title": "Dinner, special",
            "date": "2026-11-11",
            "time": "20:00",
            "location": "Beach Road",
            "notes": 'Bring "tickets"',
        },
    )
    client.post(
        f"/api/trips/{trip['id']}/activities",
        json={
            "title": "Museum",
            "date": "2026-11-10",
            "time": "09:00",
            "location": "Old Town",
            "notes": "Bring tickets",
        },
    )

    response = client.get(f"/api/trips/{trip['id']}/activities.csv")

    assert response.status_code == 200
    assert response.mimetype == "text/csv"
    assert response.headers["Content-Disposition"] == 'attachment; filename="Goa Trip-activities.csv"'
    rows = list(csv.reader(response.data.decode("utf-8").splitlines()))
    assert rows == [
        ["Activity", "Date", "Time", "Location", "Notes"],
        ["Museum", "2026-11-10", "09:00", "Old Town", "Bring tickets"],
        ["Dinner, special", "2026-11-11", "20:00", "Beach Road", 'Bring "tickets"'],
    ]


def test_export_empty_activities_csv_has_header_only(client, trip):
    response = client.get(f"/api/trips/{trip['id']}/activities.csv")

    assert response.status_code == 200
    assert response.data.decode("utf-8") == "Activity,Date,Time,Location,Notes\r\n"


def test_export_activities_csv_trip_not_found(client):
    response = client.get("/api/trips/999/activities.csv")

    assert response.status_code == 404
    assert response.get_json() == {"error": "Trip not found"}
