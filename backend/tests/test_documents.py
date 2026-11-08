import io
from pathlib import Path


def upload(client, trip_id, filename="ticket.pdf", document_type="Flight ticket"):
    return client.post(
        f"/api/trips/{trip_id}/documents",
        data={
            "document_type": document_type,
            "file": (io.BytesIO(b"ticket contents"), filename),
        },
        content_type="multipart/form-data",
    )


def test_document_upload_list_download_delete(client, trip):
    response = upload(client, trip["id"])
    assert response.status_code == 201
    document = response.get_json()
    assert document["document_name"] == "ticket.pdf"
    assert document["document_type"] == "Flight ticket"

    listed = client.get(f"/api/trips/{trip['id']}/documents")
    assert listed.status_code == 200
    assert listed.get_json()[0]["id"] == document["id"]

    downloaded = client.get(f"/api/documents/{document['id']}/download")
    assert downloaded.status_code == 200
    assert downloaded.data == b"ticket contents"

    deleted = client.delete(f"/api/documents/{document['id']}")
    assert deleted.status_code == 200
    assert client.get(f"/api/trips/{trip['id']}/documents").get_json() == []


def test_document_rejects_unsupported_type(client, trip):
    response = upload(client, trip["id"], "malware.exe")
    assert response.status_code == 400
    assert response.get_json() == {"error": "Unsupported file type"}


def test_document_rejects_missing_type(client, trip):
    response = upload(client, trip["id"], document_type="")
    assert response.status_code == 400
    assert response.get_json() == {"error": "Document type is required"}


def test_document_files_are_removed_when_trip_is_deleted(client, trip, tmp_path):
    from app import create_app

    app = create_app(str(tmp_path / "documents.db"))
    app.config["DOCUMENT_STORAGE_PATH"] = str(tmp_path / "uploads")
    test_client = app.test_client()
    test_client.post(
        "/api/auth/register",
        json={"username": "document-user", "password": "password123"},
    )
    created_trip = test_client.post(
        "/api/trips",
        json={
            "name": "Trip",
            "destination": "Goa",
            "start_date": "2026-11-10",
            "end_date": "2026-11-14",
        },
    ).get_json()
    document = upload(test_client, created_trip["id"]).get_json()
    file_path = Path(app.config["DOCUMENT_STORAGE_PATH"]) / document["file_reference"]
    assert file_path.is_file()
    assert test_client.delete(f"/api/trips/{created_trip['id']}").status_code == 200
    assert not file_path.exists()


def test_document_rejects_files_over_size_limit(client, trip):
    response = client.post(
        f"/api/trips/{trip['id']}/documents",
        data={
            "document_type": "Other",
            "file": (io.BytesIO(b"x" * (10 * 1024 * 1024 + 1)), "large.pdf"),
        },
        content_type="multipart/form-data",
    )
    assert response.status_code == 413
    assert response.get_json() == {"error": "Request Entity Too Large"}
