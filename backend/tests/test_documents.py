"""
Tests for the documents feature (Issue #17).

Conventions mirror test_trips.py and test_activities.py:
- shared `client` and `trip` fixtures from conftest.py
- `small_limit_client` / `small_limit_trip` fixtures defined locally so
  size-limit tests stay isolated from the rest of the suite
"""
import io
import os
import sqlite3
import zipfile
from unittest.mock import patch

import pytest

from app import create_app


# ── In-memory file helpers ────────────────────────────────────────────────────

def make_pdf(size: int = 16) -> bytes:
    """Return `size` bytes that begin with the PDF magic header."""
    assert size >= 4
    return b"%PDF" + b"A" * (size - 4)


def make_png() -> bytes:
    return b"\x89PNG\r\n\x1a\n" + b"B" * 8


def make_jpg() -> bytes:
    return b"\xff\xd8\xff" + b"C" * 8


def minimal_docx() -> bytes:
    """A valid DOCX: a ZIP archive containing word/document.xml."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("word/document.xml", "<root/>")
    return buf.getvalue()


def zip_without_document_xml() -> bytes:
    """A valid ZIP archive that lacks word/document.xml."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("other/file.txt", "not a docx")
    return buf.getvalue()


def upload(client, trip_id, data: bytes, filename: str, doc_type: str = "flight_ticket", name: str = None):
    """POST a multipart upload to the documents endpoint."""
    form_data = {"file": (io.BytesIO(data), filename)}
    if doc_type is not None:
        form_data["doc_type"] = doc_type
    if name is not None:
        form_data["name"] = name
    return client.post(
        f"/api/trips/{trip_id}/documents",
        data=form_data,
        content_type="multipart/form-data",
    )


# ── Size-limit fixtures (isolated from the main suite) ───────────────────────

@pytest.fixture
def small_limit_client(tmp_path):
    """App with MAX_FILE_SIZE=100 B and MAX_CONTENT_LENGTH=1124 B."""
    app = create_app(
        database_path=str(tmp_path / "test.db"),
        upload_folder=str(tmp_path / "uploads"),
    )
    app.config["MAX_FILE_SIZE"] = 100
    app.config["MAX_CONTENT_LENGTH"] = 100 + 1024   # 1124 bytes total
    return app.test_client()


@pytest.fixture
def small_limit_trip(small_limit_client):
    resp = small_limit_client.post("/api/trips", json={
        "name": "Size Test Trip",
        "destination": "Nowhere",
        "start_date": "2026-11-10",
        "end_date": "2026-11-14",
    })
    return resp.get_json()


# ── Basic CRUD ────────────────────────────────────────────────────────────────

def test_list_documents_empty(client, trip):
    response = client.get(f"/api/trips/{trip['id']}/documents")
    assert response.status_code == 200
    assert response.get_json() == []


def test_upload_pdf(client, trip):
    response = upload(client, trip["id"], make_pdf(), "boarding_pass.pdf")
    assert response.status_code == 201
    doc = response.get_json()
    assert doc["trip_id"] == trip["id"]
    assert doc["name"] == "boarding_pass.pdf"
    assert doc["doc_type"] == "flight_ticket"
    assert "upload_date" in doc
    assert "id" in doc
    # stored_name must not be exposed to API consumers
    assert "stored_name" not in doc


def test_list_documents_after_upload(client, trip):
    upload(client, trip["id"], make_pdf(), "boarding_pass.pdf")
    docs = client.get(f"/api/trips/{trip['id']}/documents").get_json()
    assert len(docs) == 1
    assert docs[0]["name"] == "boarding_pass.pdf"


def test_upload_multiple_documents(client, trip):
    upload(client, trip["id"], make_pdf(), "doc1.pdf")
    upload(client, trip["id"], make_pdf(), "doc2.pdf")
    docs = client.get(f"/api/trips/{trip['id']}/documents").get_json()
    assert len(docs) == 2


def test_list_documents_only_returns_own_trip(client, trip):
    other = client.post("/api/trips", json={
        "name": "Other Trip", "destination": "Elsewhere",
        "start_date": "2026-11-10", "end_date": "2026-11-14",
    }).get_json()
    upload(client, trip["id"], make_pdf(), "mine.pdf")
    assert client.get(f"/api/trips/{other['id']}/documents").get_json() == []


# ── Upload validation ─────────────────────────────────────────────────────────

def test_upload_missing_doc_type(client, trip):
    response = client.post(
        f"/api/trips/{trip['id']}/documents",
        data={"file": (io.BytesIO(make_pdf()), "ticket.pdf")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 400
    assert response.get_json()["error"] == "Document type is required"


def test_upload_invalid_doc_type(client, trip):
    upload_folder = client.application.config["UPLOAD_FOLDER"]
    response = upload(client, trip["id"], make_pdf(), "ticket.pdf", doc_type="spaceship")
    assert response.status_code == 400
    assert "Document type must be one of:" in response.get_json()["error"]
    # No file must be left in upload folder when category is invalid
    assert os.listdir(upload_folder) == []


def test_upload_custom_name_is_trimmed(client, trip):
    response = upload(client, trip["id"], make_pdf(), "raw.pdf", name="  Boarding Pass  ")
    assert response.status_code == 201
    assert response.get_json()["name"] == "Boarding Pass"


def test_upload_blank_name_defaults_to_uploaded_filename(client, trip):
    response = upload(client, trip["id"], make_pdf(), "my_ticket.pdf", name="   ")
    assert response.status_code == 201
    assert response.get_json()["name"] == "my_ticket.pdf"


def test_upload_no_file_part(client, trip):
    response = client.post(
        f"/api/trips/{trip['id']}/documents",
        data={"doc_type": "flight_ticket"},
        content_type="multipart/form-data",
    )
    assert response.status_code == 400
    assert response.get_json()["error"] == "No file uploaded"


def test_upload_unsupported_extension(client, trip):
    response = upload(client, trip["id"], b"payload", "virus.exe")
    assert response.status_code == 400
    err = response.get_json()["error"]
    assert "File type not supported. Allowed types:" in err
    for ext in client.application.config["ALLOWED_EXTENSIONS"]:
        assert ext in err


def test_upload_non_ascii_filename_accepted(client, trip):
    response = upload(client, trip["id"], make_pdf(), "日本語.pdf")
    assert response.status_code == 201
    doc = response.get_json()
    assert doc["name"] == "日本語.pdf"

    # Download safe name handles non-ASCII base name
    dl_resp = client.get(f"/api/documents/{doc['id']}/download")
    assert dl_resp.status_code == 200
    cd = dl_resp.headers.get("Content-Disposition", "")
    assert f"document_{doc['id']}.pdf" in cd


def test_upload_name_capped_at_max_length(client, trip):
    long_name = "X" * 300
    response = upload(client, trip["id"], make_pdf(), "test.pdf", name=long_name)
    assert response.status_code == 201
    assert response.get_json()["name"] == "X" * 255


def test_upload_wrong_magic_for_extension(client, trip):
    # PDF extension but bytes that do not start with %PDF
    response = upload(client, trip["id"], b"\x00\x01\x02\x03\x04\x05\x06\x07\x08", "fake.pdf")
    assert response.status_code == 400
    assert "does not match" in response.get_json()["error"]


def test_upload_jpg_wrong_magic(client, trip):
    response = upload(client, trip["id"], b"not jpeg at all", "photo.jpg")
    assert response.status_code == 400
    assert "does not match" in response.get_json()["error"]


def test_upload_png_accepted(client, trip):
    response = upload(client, trip["id"], make_png(), "image.png")
    assert response.status_code == 201
    assert response.get_json()["doc_type"] == "flight_ticket"


def test_upload_jpg_accepted(client, trip):
    response = upload(client, trip["id"], make_jpg(), "photo.jpg")
    assert response.status_code == 201
    assert response.get_json()["doc_type"] == "flight_ticket"


def test_upload_txt_accepted(client, trip):
    response = upload(client, trip["id"], b"plain text content", "notes.txt")
    assert response.status_code == 201
    assert response.get_json()["doc_type"] == "flight_ticket"


# ── DOCX validation ───────────────────────────────────────────────────────────

def test_upload_valid_docx(client, trip):
    response = upload(client, trip["id"], minimal_docx(), "report.docx")
    assert response.status_code == 201
    assert response.get_json()["doc_type"] == "flight_ticket"


def test_upload_docx_valid_zip_missing_word_document_xml(client, trip):
    response = upload(client, trip["id"], zip_without_document_xml(), "fake.docx")
    assert response.status_code == 400
    assert "does not match" in response.get_json()["error"]


def test_upload_docx_corrupt_zip(client, trip):
    # Starts with PK magic bytes but is not a valid ZIP.
    bad = b"PK\x03\x04" + b"\x00" * 20
    response = upload(client, trip["id"], bad, "corrupt.docx")
    assert response.status_code == 400
    assert "does not match" in response.get_json()["error"]


def test_upload_docx_random_bytes(client, trip):
    response = upload(client, trip["id"], b"\xde\xad\xbe\xef" * 10, "random.docx")
    assert response.status_code == 400
    assert "does not match" in response.get_json()["error"]


# ── Download ──────────────────────────────────────────────────────────────────

def test_download_document(client, trip):
    upload(client, trip["id"], make_pdf(), "boarding_pass.pdf")
    doc_id = client.get(f"/api/trips/{trip['id']}/documents").get_json()[0]["id"]

    response = client.get(f"/api/documents/{doc_id}/download")
    assert response.status_code == 200
    assert response.data[:4] == b"%PDF"
    cd = response.headers.get("Content-Disposition", "")
    assert "boarding_pass.pdf" in cd


def test_download_document_safe_name_without_extension(client, trip):
    upload(client, trip["id"], make_pdf(), "raw.pdf", name="Flight Confirmation")
    doc_id = client.get(f"/api/trips/{trip['id']}/documents").get_json()[0]["id"]

    response = client.get(f"/api/documents/{doc_id}/download")
    assert response.status_code == 200
    cd = response.headers.get("Content-Disposition", "")
    assert "Flight_Confirmation.pdf" in cd


def test_download_document_safe_name_avoids_duplicate_extension(client, trip):
    upload(client, trip["id"], make_pdf(), "raw.pdf", name="ticket.pdf")
    doc_id = client.get(f"/api/trips/{trip['id']}/documents").get_json()[0]["id"]

    response = client.get(f"/api/documents/{doc_id}/download")
    assert response.status_code == 200
    cd = response.headers.get("Content-Disposition", "")
    assert "ticket.pdf" in cd
    assert "ticket.pdf.pdf" not in cd


def test_download_nonexistent_document(client):
    response = client.get("/api/documents/999/download")
    assert response.status_code == 404
    assert response.get_json() == {"error": "Document not found"}


def test_download_missing_file_on_disk(client, trip):
    upload(client, trip["id"], make_pdf(), "boarding_pass.pdf")
    doc = client.get(f"/api/trips/{trip['id']}/documents").get_json()[0]

    # Remove every file from the upload folder to simulate a partial-failure state.
    upload_folder = client.application.config["UPLOAD_FOLDER"]
    for fname in os.listdir(upload_folder):
        os.remove(os.path.join(upload_folder, fname))

    response = client.get(f"/api/documents/{doc['id']}/download")
    assert response.status_code == 404
    assert response.get_json() == {"error": "Document file not found"}


def test_download_invalid_document_id(client):
    response = client.get("/api/documents/abc/download")
    assert response.status_code == 400
    assert response.get_json() == {"error": "Invalid document id"}


# ── Delete ────────────────────────────────────────────────────────────────────

def test_delete_document(client, trip):
    upload(client, trip["id"], make_pdf(), "to_delete.pdf")
    doc_id = client.get(f"/api/trips/{trip['id']}/documents").get_json()[0]["id"]

    response = client.delete(f"/api/documents/{doc_id}")
    assert response.status_code == 200
    assert response.get_json() == {"message": "Document deleted"}
    assert client.get(f"/api/trips/{trip['id']}/documents").get_json() == []


def test_delete_document_removes_file_from_disk(client, trip):
    upload(client, trip["id"], make_pdf(), "to_delete.pdf")
    doc_id = client.get(f"/api/trips/{trip['id']}/documents").get_json()[0]["id"]

    upload_folder = client.application.config["UPLOAD_FOLDER"]
    assert len(os.listdir(upload_folder)) == 1

    client.delete(f"/api/documents/{doc_id}")
    assert os.listdir(upload_folder) == []


def test_delete_nonexistent_document(client):
    response = client.delete("/api/documents/999")
    assert response.status_code == 404
    assert response.get_json() == {"error": "Document not found"}


def test_delete_invalid_document_id(client):
    response = client.delete("/api/documents/abc")
    assert response.status_code == 400
    assert response.get_json() == {"error": "Invalid document id"}


# ── Trip deletion cleanup ─────────────────────────────────────────────────────

def test_trip_deletion_removes_document_files_from_disk(client, trip):
    upload(client, trip["id"], make_pdf(), "doc1.pdf")
    upload(client, trip["id"], make_pdf(), "doc2.pdf")

    upload_folder = client.application.config["UPLOAD_FOLDER"]
    assert len(os.listdir(upload_folder)) == 2

    client.delete(f"/api/trips/{trip['id']}")
    assert os.listdir(upload_folder) == []


def test_trip_deletion_removes_document_db_rows(client, trip):
    upload(client, trip["id"], make_pdf(), "doc.pdf")
    doc_id = client.get(f"/api/trips/{trip['id']}/documents").get_json()[0]["id"]

    client.delete(f"/api/trips/{trip['id']}")

    # The document row is gone; download should 404.
    assert client.get(f"/api/documents/{doc_id}/download").status_code == 404


def test_trip_deletion_without_documents_still_works(client, trip):
    response = client.delete(f"/api/trips/{trip['id']}")
    assert response.status_code == 200
    assert response.get_json() == {"message": "Trip deleted"}


# ── ID / not-found edge cases ─────────────────────────────────────────────────

def test_list_documents_invalid_trip_id(client):
    response = client.get("/api/trips/abc/documents")
    assert response.status_code == 400
    assert response.get_json() == {"error": "Invalid trip id"}


def test_list_documents_missing_trip(client):
    response = client.get("/api/trips/999/documents")
    assert response.status_code == 404
    assert response.get_json() == {"error": "Trip not found"}


def test_upload_invalid_trip_id(client):
    response = upload(client, "abc", make_pdf(), "doc.pdf")
    assert response.status_code == 400
    assert response.get_json() == {"error": "Invalid trip id"}


def test_upload_missing_trip(client):
    response = upload(client, 999, make_pdf(), "doc.pdf")
    assert response.status_code == 404
    assert response.get_json() == {"error": "Trip not found"}


# ── Size limits ───────────────────────────────────────────────────────────────

def test_upload_exactly_at_per_file_limit(small_limit_client, small_limit_trip):
    """A file of exactly MAX_FILE_SIZE bytes must be accepted (limit is >, not >=)."""
    payload = b"%PDF" + b"A" * 96   # 4 + 96 = exactly 100 bytes
    assert len(payload) == 100
    response = upload(small_limit_client, small_limit_trip["id"], payload, "exact.pdf")
    assert response.status_code == 201


def test_upload_one_byte_over_per_file_limit(small_limit_client, small_limit_trip):
    """A file of MAX_FILE_SIZE + 1 bytes must be rejected with HTTP 400."""
    payload = b"%PDF" + b"A" * 97   # 4 + 97 = 101 bytes
    assert len(payload) == 101
    response = upload(small_limit_client, small_limit_trip["id"], payload, "over.pdf")
    assert response.status_code == 400
    assert "exceeds the maximum allowed size" in response.get_json()["error"]


def test_upload_oversized_file_rejected_for_size_before_content_sniffing(small_limit_client, small_limit_trip):
    """
    Size check must run before content sniffing. Even with invalid magic bytes,
    an oversized file must be rejected with 400 size error (not 400 content error).
    """
    # 105 bytes of corrupt non-PDF data (exceeds 100-byte limit)
    payload = b"NOT_A_PDF_MAGIC_BYTES" + b"Z" * 84
    assert len(payload) == 105
    response = upload(small_limit_client, small_limit_trip["id"], payload, "fake_corrupt.pdf")
    assert response.status_code == 400
    assert "exceeds the maximum allowed size" in response.get_json()["error"]


def test_upload_triggers_flask_413_for_oversized_request(small_limit_client, small_limit_trip):
    """
    A multipart request whose total body exceeds MAX_CONTENT_LENGTH (1124 bytes)
    must trigger Flask's RequestEntityTooLarge handler *before* the route runs,
    returning HTTP 413.  The existing handle_http_error in app.py handles this.
    """
    # 2000-byte PDF body; total multipart framing will push it well above 1124 B.
    payload = b"%PDF" + b"X" * (2000 - 4)
    assert len(payload) == 2000
    response = upload(small_limit_client, small_limit_trip["id"], payload, "huge.pdf")
    assert response.status_code == 413
    assert response.get_json() == {"error": "Request Entity Too Large"}


# ── Upload DB failure cleanup ─────────────────────────────────────────────────

def test_upload_db_failure_cleans_up_saved_file(client, trip):
    """
    Regression for the file-saved-but-INSERT-fails path.

    patch('routes.documents.get_db') replaces only the get_db reference
    inside routes/documents.py.  find_trip() uses models.get_db (a separate
    import) so trip lookup still succeeds, and only the INSERT-path mock raises.
    """
    upload_folder = client.application.config["UPLOAD_FOLDER"]

    with patch("routes.documents.get_db") as mock_get_db:
        mock_get_db.return_value.execute.side_effect = sqlite3.OperationalError(
            "simulated INSERT failure"
        )
        response = upload(client, trip["id"], make_pdf(), "test.pdf")

    # Flask's handle_database_error handler converts sqlite3.Error → 500.
    assert response.status_code == 500
    assert response.get_json() == {"error": "Database error"}
    # Database transaction rollback must have been invoked
    mock_get_db.return_value.rollback.assert_called_once()
    # Cleanup must have run: no file should remain on disk.
    assert os.listdir(upload_folder) == []


def test_upload_db_failure_logs_warning_when_rollback_also_fails(client, trip):
    """
    When the INSERT fails and db.rollback() also raises:
    - A warning about rollback failure is logged.
    - The original database error is still returned (not masked).
    - File cleanup still executes.
    """
    upload_folder = client.application.config["UPLOAD_FOLDER"]

    with patch("routes.documents.get_db") as mock_get_db, \
         patch.object(client.application.logger, "warning") as mock_warning:

        mock_get_db.return_value.execute.side_effect = sqlite3.OperationalError(
            "simulated INSERT failure"
        )
        mock_get_db.return_value.rollback.side_effect = sqlite3.OperationalError(
            "simulated rollback failure"
        )
        response = upload(client, trip["id"], make_pdf(), "test.pdf")

    assert response.status_code == 500
    assert response.get_json() == {"error": "Database error"}
    # File cleanup still ran
    assert os.listdir(upload_folder) == []
    # Warning about rollback was logged
    warning_messages = [call[0][0] for call in mock_warning.call_args_list]
    assert any("Could not roll back" in msg for msg in warning_messages)


def test_upload_db_failure_logs_warning_when_cleanup_also_fails(client, trip):
    """
    When the INSERT fails *and* the subsequent os.remove also fails:
    - A warning that includes the file path is logged.
    - The original database error (not the OSError) is still returned to the caller.
    - Cleanup was attempted (os.remove was called).
    """
    with patch("routes.documents.get_db") as mock_get_db, \
         patch("routes.documents.os.remove", side_effect=OSError("permission denied")) as mock_remove, \
         patch.object(client.application.logger, "warning") as mock_warning:

        mock_get_db.return_value.execute.side_effect = sqlite3.OperationalError(
            "simulated INSERT failure"
        )
        response = upload(client, trip["id"], make_pdf(), "test.pdf")

    # The original DB error is surfaced; the OSError must not replace it.
    assert response.status_code == 500
    assert response.get_json() == {"error": "Database error"}
    # Cleanup was attempted even though it failed.
    mock_remove.assert_called_once()
    # The failure was logged with a message that includes the path.
    mock_warning.assert_called_once()
    logged_format_str = mock_warning.call_args[0][0]
    assert "Could not remove" in logged_format_str
    # The saved path was passed as the %s argument.
    logged_path_arg = mock_warning.call_args[0][1]
    assert logged_path_arg.endswith(".pdf")
