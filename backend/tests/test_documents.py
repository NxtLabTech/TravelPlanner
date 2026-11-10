import io
import os

import pytest


def make_file(name="ticket.pdf", content=b"%PDF-1.4 test content", mime="application/pdf"):
    """Create a file-like tuple for multipart upload."""
    return (io.BytesIO(content), name, mime)


def upload(client, trip_id, name="Flight to Goa", category="Flight Ticket",
           filename="ticket.pdf", content=b"%PDF-1.4 test content", mime="application/pdf"):
    """Helper to upload a document with default valid values."""
    data = {
        "name": name,
        "category": category,
        "file": (io.BytesIO(content), filename, mime),
    }
    return client.post(
        f"/api/trips/{trip_id}/documents",
        data=data,
        content_type="multipart/form-data",
    )


class TestDocumentUpload:
    def test_successful_upload(self, client, trip, upload_dir):
        response = upload(client, trip["id"])
        assert response.status_code == 201
        doc = response.get_json()
        assert doc["name"] == "Flight to Goa"
        assert doc["category"] == "Flight Ticket"
        assert doc["original_filename"] == "ticket.pdf"
        assert doc["mime_type"] == "application/pdf"
        assert doc["file_size"] == len(b"%PDF-1.4 test content")
        assert doc["trip_id"] == trip["id"]
        assert doc["id"]
        assert doc["uploaded_at"]
        # stored_filename must NOT be exposed
        assert "stored_filename" not in doc

    def test_file_saved_to_disk(self, client, trip, upload_dir):
        upload(client, trip["id"])
        files = os.listdir(upload_dir)
        assert len(files) == 1
        assert files[0].endswith(".pdf")

    def test_multiple_documents_for_one_trip(self, client, trip, upload_dir):
        upload(client, trip["id"], name="Doc 1")
        upload(client, trip["id"], name="Doc 2")
        response = client.get(f"/api/trips/{trip['id']}/documents")
        assert len(response.get_json()) == 2

    def test_documents_isolated_between_trips(self, client, trip, upload_dir):
        other = client.post("/api/trips", json={
            "name": "Other", "destination": "Delhi",
            "start_date": "2026-12-01", "end_date": "2026-12-05",
        }).get_json()
        upload(client, trip["id"], name="Trip 1 Doc")
        upload(client, other["id"], name="Trip 2 Doc")

        docs1 = client.get(f"/api/trips/{trip['id']}/documents").get_json()
        docs2 = client.get(f"/api/trips/{other['id']}/documents").get_json()
        assert len(docs1) == 1
        assert docs1[0]["name"] == "Trip 1 Doc"
        assert len(docs2) == 1
        assert docs2[0]["name"] == "Trip 2 Doc"


class TestDocumentValidation:
    def test_missing_name(self, client, trip):
        response = upload(client, trip["id"], name="")
        assert response.status_code == 400
        assert response.get_json()["error"] == "Document name is required"

    def test_missing_category(self, client, trip):
        response = upload(client, trip["id"], category="")
        assert response.status_code == 400
        assert response.get_json()["error"] == "Document category is required"

    def test_invalid_category(self, client, trip):
        response = upload(client, trip["id"], category="Selfie")
        assert response.status_code == 400
        assert "Category must be one of" in response.get_json()["error"]

    def test_no_file(self, client, trip):
        data = {"name": "Doc", "category": "Other"}
        response = client.post(
            f"/api/trips/{trip['id']}/documents",
            data=data,
            content_type="multipart/form-data",
        )
        assert response.status_code == 400
        assert response.get_json()["error"] == "No file provided"

    def test_unsupported_file_type(self, client, trip):
        response = upload(client, trip["id"], filename="script.exe",
                          content=b"MZ executable", mime="application/x-msdownload")
        assert response.status_code == 400
        assert "not allowed" in response.get_json()["error"]

    def test_unsupported_mime_type(self, client, trip):
        response = upload(client, trip["id"], filename="file.pdf",
                          content=b"some content", mime="application/x-shockwave-flash")
        assert response.status_code == 400
        assert "MIME type" in response.get_json()["error"]

    def test_empty_file(self, client, trip):
        response = upload(client, trip["id"], content=b"")
        assert response.status_code == 400
        assert response.get_json()["error"] == "File is empty"

    def test_oversized_file_rejected(self, client, trip):
        client.application.config["MAX_CONTENT_LENGTH"] = 50
        response = upload(client, trip["id"], content=b"A" * 100)
        assert response.status_code in (400, 413)

    def test_missing_trip(self, client):
        response = upload(client, 999)
        assert response.status_code == 404
        assert response.get_json()["error"] == "Trip not found"

    def test_invalid_trip_id(self, client):
        response = upload(client, "abc")
        assert response.status_code == 400
        assert response.get_json()["error"] == "Invalid trip id"

    def test_all_valid_categories(self, client, trip, upload_dir):
        for cat in ("Flight Ticket", "Hotel Booking", "Train Ticket", "Travel Insurance", "Other"):
            response = upload(client, trip["id"], category=cat, name=f"Doc {cat}")
            assert response.status_code == 201, f"Category '{cat}' should be valid"

    def test_all_valid_extensions(self, client, trip, upload_dir):
        valid = {
            "test.pdf": "application/pdf",
            "test.jpg": "image/jpeg",
            "test.jpeg": "image/jpeg",
            "test.png": "image/png",
            "test.gif": "image/gif",
            "test.webp": "image/webp",
            "test.txt": "text/plain",
            "test.doc": "application/msword",
            "test.docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "test.xls": "application/vnd.ms-excel",
            "test.xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
        for filename, mime in valid.items():
            response = upload(client, trip["id"], filename=filename, mime=mime, name=f"Doc {filename}")
            assert response.status_code == 201, f"'{filename}' with '{mime}' should be allowed"


class TestDocumentListing:
    def test_list_empty(self, client, trip):
        response = client.get(f"/api/trips/{trip['id']}/documents")
        assert response.status_code == 200
        assert response.get_json() == []

    def test_list_returns_documents(self, client, trip, upload_dir):
        upload(client, trip["id"], name="First")
        upload(client, trip["id"], name="Second")
        docs = client.get(f"/api/trips/{trip['id']}/documents").get_json()
        names = [d["name"] for d in docs]
        assert "First" in names
        assert "Second" in names

    def test_list_for_missing_trip(self, client):
        response = client.get("/api/trips/999/documents")
        assert response.status_code == 404


class TestDocumentDownload:
    def test_successful_download(self, client, trip, upload_dir):
        content = b"%PDF-1.4 flight ticket data"
        doc = upload(client, trip["id"], content=content).get_json()
        response = client.get(f"/api/documents/{doc['id']}/download")
        assert response.status_code == 200
        assert response.data == content
        assert "ticket.pdf" in response.headers.get("Content-Disposition", "")

    def test_download_missing_document(self, client):
        response = client.get("/api/documents/999/download")
        assert response.status_code == 404
        assert response.get_json()["error"] == "Document not found"

    def test_download_invalid_id(self, client):
        response = client.get("/api/documents/abc/download")
        assert response.status_code == 400

    def test_download_when_file_missing_from_disk(self, client, trip, upload_dir):
        doc = upload(client, trip["id"]).get_json()
        # Remove the file from disk manually
        for f in os.listdir(upload_dir):
            os.remove(os.path.join(upload_dir, f))
        response = client.get(f"/api/documents/{doc['id']}/download")
        assert response.status_code == 404
        assert "not found in storage" in response.get_json()["error"]


class TestDocumentDeletion:
    def test_successful_deletion(self, client, trip, upload_dir):
        doc = upload(client, trip["id"]).get_json()
        assert len(os.listdir(upload_dir)) == 1

        response = client.delete(f"/api/documents/{doc['id']}")
        assert response.status_code == 200
        assert response.get_json()["message"] == "Document deleted"

        # Verify removed from DB
        assert client.get(f"/api/documents/{doc['id']}/download").status_code == 404
        # Verify file removed from disk
        assert len(os.listdir(upload_dir)) == 0

    def test_delete_missing_document(self, client):
        response = client.delete("/api/documents/999")
        assert response.status_code == 404
        assert response.get_json()["error"] == "Document not found"

    def test_delete_invalid_id(self, client):
        response = client.delete("/api/documents/abc")
        assert response.status_code == 400

    def test_deleting_trip_cleans_up_document_files(self, client, trip, upload_dir):
        upload(client, trip["id"], name="Doc 1")
        upload(client, trip["id"], name="Doc 2")
        assert len(os.listdir(upload_dir)) == 2

        client.delete(f"/api/trips/{trip['id']}")
        # Files should be cleaned up
        assert len(os.listdir(upload_dir)) == 0
        # DB records should be gone (CASCADE)
        response = client.get(f"/api/trips/{trip['id']}/documents")
        assert response.status_code == 404  # trip itself is gone

    def test_list_after_deletion(self, client, trip, upload_dir):
        doc1 = upload(client, trip["id"], name="Keep").get_json()
        doc2 = upload(client, trip["id"], name="Remove").get_json()
        client.delete(f"/api/documents/{doc2['id']}")

        docs = client.get(f"/api/trips/{trip['id']}/documents").get_json()
        assert len(docs) == 1
        assert docs[0]["name"] == "Keep"

