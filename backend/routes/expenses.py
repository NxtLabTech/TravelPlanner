from flask import Blueprint, jsonify, request

from database import get_db
from models import find_expense, find_trip
from validation import parse_id, validate_expense

bp = Blueprint("expenses", __name__, url_prefix="/api")


@bp.get("/trips/<trip_id>/expenses")
def list_expenses(trip_id):
    trip_id = parse_id(trip_id)
    if trip_id is None:
        return jsonify(error="Invalid trip id"), 400
    if find_trip(trip_id) is None:
        return jsonify(error="Trip not found"), 404

    rows = get_db().execute(
        "SELECT * FROM expenses WHERE trip_id = ? ORDER BY date, id", (trip_id,)
    ).fetchall()
    return jsonify([dict(row) for row in rows])


@bp.post("/trips/<trip_id>/expenses")
def create_expense(trip_id):
    trip_id = parse_id(trip_id)
    if trip_id is None:
        return jsonify(error="Invalid trip id"), 400
    trip = find_trip(trip_id)
    if trip is None:
        return jsonify(error="Trip not found"), 404

    expense, error = validate_expense(request.get_json(silent=True), trip)
    if error:
        return jsonify(error=error), 400

    db = get_db()
    cursor = db.execute(
        """INSERT INTO expenses (trip_id, title, amount, category, date, notes)
           VALUES (:trip_id, :title, :amount, :category, :date, :notes)""",
        {**expense, "trip_id": trip_id},
    )
    db.commit()
    return jsonify(dict(find_expense(cursor.lastrowid))), 201


@bp.put("/expenses/<expense_id>")
def update_expense(expense_id):
    expense_id = parse_id(expense_id)
    if expense_id is None:
        return jsonify(error="Invalid expense id"), 400
    existing = find_expense(expense_id)
    if existing is None:
        return jsonify(error="Expense not found"), 404

    trip = find_trip(existing["trip_id"])
    expense, error = validate_expense(request.get_json(silent=True), trip)
    if error:
        return jsonify(error=error), 400

    db = get_db()
    db.execute(
        """UPDATE expenses SET title = :title, amount = :amount, category = :category,
           date = :date, notes = :notes WHERE id = :id""",
        {**expense, "id": expense_id},
    )
    db.commit()
    return jsonify(dict(find_expense(expense_id)))


@bp.delete("/expenses/<expense_id>")
def delete_expense(expense_id):
    expense_id = parse_id(expense_id)
    if expense_id is None:
        return jsonify(error="Invalid expense id"), 400
    if find_expense(expense_id) is None:
        return jsonify(error="Expense not found"), 404

    db = get_db()
    db.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    db.commit()
    return jsonify(message="Expense deleted")
