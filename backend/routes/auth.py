from functools import wraps
import sqlite3

from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from database import get_db

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def current_user_id():
    return session.get("user_id")


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if current_user_id() is None:
            return jsonify(error="Authentication required"), 401
        return view(*args, **kwargs)

    return wrapped


@bp.post("/register")
def register():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="Request body must be a JSON object"), 400
    username = data.get("username", "")
    password = data.get("password", "")
    if not isinstance(username, str) or not username.strip():
        return jsonify(error="Username is required"), 400
    if not isinstance(password, str) or len(password) < 8:
        return jsonify(error="Password must be at least 8 characters"), 400
    username = username.strip()
    db = get_db()
    try:
        cursor = db.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (username, generate_password_hash(password)),
        )
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify(error="Username is already registered"), 409
    session.clear()
    session["user_id"] = cursor.lastrowid
    session["username"] = username
    return jsonify(username=username), 201


@bp.post("/login")
def login():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="Request body must be a JSON object"), 400
    username = data.get("username", "")
    password = data.get("password", "")
    if not isinstance(username, str) or not isinstance(password, str):
        return jsonify(error="Invalid username or password"), 401
    user = get_db().execute(
        "SELECT id, username, password_hash FROM users WHERE username = ?", (username.strip(),)
    ).fetchone()
    if user is None or not check_password_hash(user["password_hash"], password):
        return jsonify(error="Invalid username or password"), 401
    session.clear()
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    return jsonify(username=user["username"])


@bp.post("/logout")
def logout():
    session.clear()
    return jsonify(message="Logged out")


@bp.get("/me")
def me():
    if current_user_id() is None:
        return jsonify(error="Authentication required"), 401
    return jsonify(username=session["username"])
