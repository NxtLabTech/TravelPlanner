import os
import uuid

from flask import Blueprint, current_app, jsonify, request, send_file

from database import get_db
from models import (
    DOCUMENT_CATEGORIES,
    document_to_dict,
    find_document,
    find_trip,
)
from validation import parse_id, validate_document_upload

bp = Blueprint("documents", __name__, url_prefix="/api")


def _get_upload_dir():
    upload_dir = current_app.config["UPLOAD_DIR"]
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir


@bp.post("/trips/<trip_id>/documents")
def upload_document(trip_id):
    trip_id = parse_id(trip_id)
    if trip_id is None:
        return jsonify(error="Invalid trip id"), 400
    if find_trip(trip_id) is None:
        return jsonify(error="Trip not found"), 404

    file = request.files.get("file")
    name = request.form.get("name", "").strip()
    category = request.form.get("category", "").strip()

    max_size = current_app.config.get("MAX_CONTENT_LENGTH", 10 * 1024 * 1024)
    cleaned, error = validate_document_upload(
        file, name, category, DOCUMENT_CATEGORIES, max_file_size=max_size
    )
    if error:
        return jsonify(error=error), 400

    # Generate a unique filename preserving the extension
    ext = os.path.splitext(cleaned["original_filename"])[1].lower()
    stored_filename = f"{uuid.uuid4().hex}{ext}"

    upload_dir = _get_upload_dir()
    file_path = os.path.join(upload_dir, stored_filename)

    try:
        file.save(file_path)
    except OSError:
        current_app.logger.exception("Failed to save uploaded file")
        return jsonify(error="Failed to save file"), 500

    db = get_db()
    try:
        cursor = db.execute(
            """INSERT INTO documents
               (trip_id, name, category, stored_filename, original_filename, mime_type, file_size)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                trip_id,
                cleaned["name"],
                cleaned["category"],
                stored_filename,
                cleaned["original_filename"],
                cleaned["mime_type"],
                cleaned["file_size"],
            ),
        )
        db.commit()
    except Exception:
        # Clean up the saved file if DB insert fails
        try:
            os.remove(file_path)
        except OSError:
            pass
        raise

    return jsonify(document_to_dict(find_document(cursor.lastrowid))), 201


@bp.get("/trips/<trip_id>/documents")
def list_documents(trip_id):
    trip_id = parse_id(trip_id)
    if trip_id is None:
        return jsonify(error="Invalid trip id"), 400
    if find_trip(trip_id) is None:
        return jsonify(error="Trip not found"), 404

    rows = get_db().execute(
        "SELECT * FROM documents WHERE trip_id = ? ORDER BY uploaded_at DESC, id DESC",
        (trip_id,),
    ).fetchall()
    return jsonify([document_to_dict(row) for row in rows])


@bp.get("/documents/<document_id>/download")
def download_document(document_id):
    document_id = parse_id(document_id)
    if document_id is None:
        return jsonify(error="Invalid document id"), 400
    doc = find_document(document_id)
    if doc is None:
        return jsonify(error="Document not found"), 404

    upload_dir = _get_upload_dir()
    file_path = os.path.join(upload_dir, doc["stored_filename"])

    if not os.path.isfile(file_path):
        current_app.logger.error("File missing from storage: %s", doc["stored_filename"])
        return jsonify(error="File not found in storage"), 404

    return send_file(
        file_path,
        mimetype=doc["mime_type"],
        as_attachment=True,
        download_name=doc["original_filename"],
    )


@bp.delete("/documents/<document_id>")
def delete_document(document_id):
    document_id = parse_id(document_id)
    if document_id is None:
        return jsonify(error="Invalid document id"), 400
    doc = find_document(document_id)
    if doc is None:
        return jsonify(error="Document not found"), 404

    # Delete the physical file
    upload_dir = _get_upload_dir()
    file_path = os.path.join(upload_dir, doc["stored_filename"])
    try:
        os.remove(file_path)
    except OSError:
        current_app.logger.warning("Could not delete file: %s", file_path)

    db = get_db()
    db.execute("DELETE FROM documents WHERE id = ?", (document_id,))
    db.commit()
    return jsonify(message="Document deleted")

