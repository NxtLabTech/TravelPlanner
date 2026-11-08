import io
import sqlite3
import uuid
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request, send_file
from werkzeug.utils import secure_filename

from database import get_db
from models import find_document, find_trip
from validation import parse_id

bp = Blueprint("documents", __name__, url_prefix="/api")
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "doc", "docx"}


def storage_path(file_reference):
    return Path(current_app.config["DOCUMENT_STORAGE_PATH"]) / file_reference


def get_extension(filename):
    safe_name = secure_filename(filename or "")
    if "." not in safe_name:
        return ""
    return safe_name.rsplit(".", 1)[1].lower()


@bp.get("/trips/<trip_id>/documents")
def list_documents(trip_id):
    trip_id = parse_id(trip_id)
    if trip_id is None:
        return jsonify(error="Invalid trip id"), 400
    if find_trip(trip_id) is None:
        return jsonify(error="Trip not found"), 404
    rows = get_db().execute(
        "SELECT id, trip_id, document_name, document_type, uploaded_at "
        "FROM documents WHERE trip_id = ? ORDER BY uploaded_at, id",
        (trip_id,),
    ).fetchall()
    return jsonify([dict(row) for row in rows])


@bp.post("/trips/<trip_id>/documents")
def upload_document(trip_id):
    trip_id = parse_id(trip_id)
    if trip_id is None:
        return jsonify(error="Invalid trip id"), 400
    if find_trip(trip_id) is None:
        return jsonify(error="Trip not found"), 404

    uploaded_file = request.files.get("file")
    document_type = request.form.get("document_type", "").strip()
    if uploaded_file is None or not uploaded_file.filename:
        return jsonify(error="A document file is required"), 400
    extension = get_extension(uploaded_file.filename)
    if extension not in ALLOWED_EXTENSIONS:
        return jsonify(error="Unsupported file type"), 400
    if not document_type:
        return jsonify(error="Document type is required"), 400

    file_reference = f"{uuid.uuid4().hex}.{extension}"
    storage = Path(current_app.config["DOCUMENT_STORAGE_PATH"])
    storage.mkdir(parents=True, exist_ok=True)
    path = storage / file_reference
    uploaded_file.save(path)
    try:
        db = get_db()
        cursor = db.execute(
            """INSERT INTO documents (trip_id, document_name, document_type, file_reference)
               VALUES (?, ?, ?, ?)""",
            (trip_id, secure_filename(uploaded_file.filename), document_type, file_reference),
        )
        db.commit()
    except (OSError, sqlite3.Error):
        path.unlink(missing_ok=True)
        raise
    document = find_document(cursor.lastrowid)
    return jsonify(dict(document)), 201


@bp.get("/documents/<document_id>/download")
def download_document(document_id):
    document_id = parse_id(document_id)
    if document_id is None:
        return jsonify(error="Invalid document id"), 400
    document = find_document(document_id)
    if document is None:
        return jsonify(error="Document not found"), 404
    path = storage_path(document["file_reference"])
    if not path.is_file():
        return jsonify(error="Document file is unavailable"), 404
    return send_file(
        io.BytesIO(path.read_bytes()),
        as_attachment=True,
        download_name=document["document_name"],
    )


@bp.delete("/documents/<document_id>")
def delete_document(document_id):
    document_id = parse_id(document_id)
    if document_id is None:
        return jsonify(error="Invalid document id"), 400
    document = find_document(document_id)
    if document is None:
        return jsonify(error="Document not found"), 404
    db = get_db()
    db.execute("DELETE FROM documents WHERE id = ?", (document_id,))
    db.commit()
    storage_path(document["file_reference"]).unlink(missing_ok=True)
    return jsonify(message="Document deleted")
