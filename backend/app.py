import os
import sqlite3

from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException

from database import close_db, init_db
from routes.activities import bp as activities_bp
from routes.trips import bp as trips_bp

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def create_app(database_path=None):
    app = Flask(__name__)
    app.config["DATABASE"] = database_path or os.environ.get(
        "DATABASE_PATH", os.path.join(BASE_DIR, "travelplanner.db")
    )
    init_db(app.config["DATABASE"])

    app.teardown_appcontext(close_db)
    app.register_blueprint(trips_bp)
    app.register_blueprint(activities_bp)

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
