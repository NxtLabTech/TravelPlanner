import os
import sqlite3
import tempfile

from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException

from database import close_db, init_db
from routes.activities import bp as activities_bp
from routes.expenses import bp as expenses_bp
from routes.documents import bp as documents_bp
from routes.trips import bp as trips_bp
from routes.weather import bp as weather_bp
from routes.exports import bp as exports_bp
from routes.auth import bp as auth_bp, current_user_id

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def create_app(database_path=None):
    app = Flask(__name__)
    app.config["DATABASE"] = database_path or os.environ.get(
        "DATABASE_PATH", os.path.join(BASE_DIR, "travelplanner.db")
    )
    app.config["DOCUMENT_STORAGE_PATH"] = os.environ.get(
        "DOCUMENT_STORAGE_PATH",
        os.path.join(tempfile.gettempdir(), "travelplanner-documents"),
    )
    app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY") or os.urandom(32)
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    init_db(app.config["DATABASE"])

    app.teardown_appcontext(close_db)
    app.register_blueprint(trips_bp)
    app.register_blueprint(activities_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(weather_bp)
    app.register_blueprint(exports_bp)
    app.register_blueprint(auth_bp)

    @app.before_request
    def require_authentication():
        if request.path.startswith("/api/") and not request.path.startswith("/api/auth/"):
            if current_user_id() is None:
                return jsonify(error="Authentication required"), 401

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
