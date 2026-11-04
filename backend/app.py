import os
import sqlite3

from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException

from database import close_db, init_db
from routes.activities import bp as activities_bp
from routes.documents import bp as documents_bp
from routes.trips import bp as trips_bp

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

_DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def create_app(database_path=None, upload_folder=None):
    app = Flask(__name__)
    app.config["DATABASE"] = database_path or os.environ.get(
        "DATABASE_PATH", os.path.join(BASE_DIR, "travelplanner.db")
    )

    max_file_size = int(os.environ.get("MAX_FILE_SIZE", _DEFAULT_MAX_FILE_SIZE))
    app.config["MAX_FILE_SIZE"] = max_file_size
    # MAX_CONTENT_LENGTH is a first-class Flask config key: Flask rejects the entire
    # multipart request with 413 if the Content-Length header exceeds this value,
    # before any route code runs.  It is set 1 MB above MAX_FILE_SIZE so that a file
    # exactly at the per-file ceiling is never rejected by this backstop check.
    app.config["MAX_CONTENT_LENGTH"] = int(
        os.environ.get("MAX_CONTENT_LENGTH", max_file_size + 1 * 1024 * 1024)
    )
    app.config["ALLOWED_EXTENSIONS"] = {
        "pdf", "jpg", "jpeg", "png", "gif", "txt", "doc", "docx"
    }
    app.config["UPLOAD_FOLDER"] = upload_folder or os.environ.get(
        "UPLOAD_FOLDER", os.path.expanduser("~/.travelplanner/documents")
    )
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    init_db(app.config["DATABASE"])

    app.teardown_appcontext(close_db)
    app.register_blueprint(trips_bp)
    app.register_blueprint(activities_bp)
    app.register_blueprint(documents_bp)

    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        return jsonify(error=error.name), error.code

    @app.errorhandler(sqlite3.Error)
    def handle_database_error(error):
        app.logger.exception("Database error")
        return jsonify(error="Database error"), 500

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        app.logger.exception("Unexpected error")
        return jsonify(error="Internal server error"), 500

    return app


if __name__ == "__main__":
    create_app().run(debug=os.environ.get("FLASK_DEBUG") == "1")
