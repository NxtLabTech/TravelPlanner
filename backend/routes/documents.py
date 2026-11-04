import os
import uuid
import zipfile

from flask import Blueprint, current_app, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

from database import get_db
from models import find_document, find_trip
from validation import parse_id, validate_doc_type

bp = Blueprint("documents", __name__, url_prefix="/api")

MAX_NAME_LENGTH = 255


def _get_allowed_types_msg() -> str:
    allowed = current_app.config.get("ALLOWED_EXTENSIONS", set())
    types_str = ", ".join(sorted(allowed))
    return f"File type not supported. Allowed types: {types_str}"


# ── Content-sniffing helpers ──────────────────────────────────────────────────

def _sniff_ok(header: bytes, ext: str) -> bool:
    """Check magic bytes for all supported types except docx."""
    if ext in ("jpg", "jpeg"):
        return header[:3] == b"\xff\xd8\xff"
    if ext == "png":
        return header[:8] == b"\x89PNG\r\n\x1a\n"
    if ext == "gif":
        return header[:6] in (b"GIF87a", b"GIF89a")
    if ext == "pdf":
        return header[:4] == b"%PDF"
    if ext == "doc":
        return header[:8] == b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"
    if ext == "txt":
        return True  # plain text has no reliable magic bytes
    return False


def _is_valid_docx(file_storage) -> bool:
    """Verify DOCX via ZIP central-directory inspection – nothing is extracted to disk.

    zipfile.ZipFile reads the central directory from the end of the seekable
    Werkzeug stream.  zf.namelist() returns member paths only; no data is
    decompressed or written to the filesystem.
    """
    stream = file_storage.stream
    header = stream.read(4)
    stream.seek(0)
    if header != b"PK\x03\x04":
        return False
    try:
        with zipfile.ZipFile(stream) as zf:
            result = "word/document.xml" in zf.namelist()
    except zipfile.BadZipFile:
        result = False
    stream.seek(0)
    return result


# ── Endpoints ─────────────────────────────────────────────────────────────────

@bp.get("/trips/<trip_id>/documents")
def list_documents(trip_id):
    trip_id = parse_id(trip_id)
    if trip_id is None:
        return jsonify(error="Invalid trip id"), 400
    if find_trip(trip_id) is None:
        return jsonify(error="Trip not found"), 404

    rows = get_db().execute(
        "SELECT id, trip_id, name, doc_type, upload_date FROM documents "
        "WHERE trip_id = ? ORDER BY upload_date, id",
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

    # Step 1 – validate category allowlist before checking or saving files
    doc_type, error = validate_doc_type(request.form.get("doc_type"))
    if error:
        return jsonify(error=error), 400

    # Step 2 – structural checks
    file = request.files.get("file")
    if file is None:
        return jsonify(error="No file uploaded"), 400
    if not file.filename or not file.filename.strip():
        return jsonify(error="No file selected"), 400

    clean_filename = os.path.basename(file.filename.replace("\\", "/"))
    if not clean_filename or "." not in clean_filename:
        return jsonify(error=_get_allowed_types_msg()), 400

    # Step 3 – optional name: trim and cap at MAX_NAME_LENGTH; default to clean filename
    raw_name = request.form.get("name")
    if isinstance(raw_name, str) and raw_name.strip():
        name = raw_name.strip()[:MAX_NAME_LENGTH]
    else:
        name = clean_filename[:MAX_NAME_LENGTH]

    # Step 4 – extension allowlist (preserves Unicode extensions; client Content-Type never used)
    ext = clean_filename.rsplit(".", 1)[1].strip().lower()
    if not ext or ext not in current_app.config["ALLOWED_EXTENSIONS"]:
        return jsonify(error=_get_allowed_types_msg()), 400

    # Step 5 – per-file size check BEFORE content sniffing
    file.stream.seek(0, 2)
    size = file.stream.tell()
    file.stream.seek(0)
    if size > current_app.config["MAX_FILE_SIZE"]:
        return jsonify(error="File exceeds the maximum allowed size"), 400

    # Step 6 – content sniffing (only on files that passed the size check)
    if ext == "docx":
        if not _is_valid_docx(file):
            return jsonify(error="File content does not match its extension"), 400
    else:
        header = file.stream.read(8)
        file.stream.seek(0)
        if not _sniff_ok(header, ext):
            return jsonify(error="File content does not match its extension"), 400

    # Step 7 – save to disk, then insert DB row
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    stored_name = uuid.uuid4().hex + "." + ext
    saved_path = os.path.join(upload_folder, stored_name)

    file.save(saved_path)

    try:
        db = get_db()
        cursor = db.execute(
            "INSERT INTO documents (trip_id, name, doc_type, stored_name) "
            "VALUES (?, ?, ?, ?)",
            (trip_id, name, doc_type, stored_name),
        )
        db.commit()
    except Exception:
        # Roll back database transaction if needed, without masking original error
        try:
            db.rollback()
        except Exception:
            current_app.logger.warning(
                "Could not roll back database transaction after insert failure"
            )
        # Roll back the filesystem write so no orphan file is left on disk.
        try:
            os.remove(saved_path)
        except OSError:
            current_app.logger.warning(
                "Could not remove uploaded file %s after failed database insert",
                saved_path,
            )
        raise

    row = get_db().execute(
        "SELECT id, trip_id, name, doc_type, upload_date FROM documents WHERE id = ?",
        (cursor.lastrowid,),
    ).fetchone()
    return jsonify(dict(row)), 201


@bp.get("/documents/<doc_id>/download")
def download_document(doc_id):
    doc_id = parse_id(doc_id)
    if doc_id is None:
        return jsonify(error="Invalid document id"), 400
    row = find_document(doc_id)
    if row is None:
        return jsonify(error="Document not found"), 404

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    if not os.path.isfile(os.path.join(upload_folder, row["stored_name"])):
        return jsonify(error="Document file not found"), 404

    ext = row["stored_name"].rsplit(".", 1)[1]
    base_name = row["name"]
    if base_name.lower().endswith("." + ext.lower()):
        base_name = base_name[: -(len(ext) + 1)]
    safe_base = secure_filename(base_name).strip("._") or f"document_{row['id']}"
    download_name = f"{safe_base}.{ext}"

    return send_from_directory(
        upload_folder,
        row["stored_name"],
        as_attachment=True,
        download_name=download_name,
    )


@bp.delete("/documents/<doc_id>")
def delete_document(doc_id):
    doc_id = parse_id(doc_id)
    if doc_id is None:
        return jsonify(error="Invalid document id"), 400
    row = find_document(doc_id)
    if row is None:
        return jsonify(error="Document not found"), 404

    stored_name = row["stored_name"]
    upload_folder = current_app.config["UPLOAD_FOLDER"]

    # Commit the DB deletion first; file removal is post-commit and non-fatal.
    db = get_db()
    db.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    db.commit()

    path = os.path.join(upload_folder, stored_name)
    try:
        os.remove(path)
    except OSError:
        current_app.logger.warning("Could not remove document file %s", path)

    return jsonify(message="Document deleted")
