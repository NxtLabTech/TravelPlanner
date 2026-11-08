import csv
from io import BytesIO, StringIO

from flask import Blueprint, jsonify, send_file
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from database import get_db
from models import find_trip, trip_to_dict
from validation import parse_id

bp = Blueprint("exports", __name__, url_prefix="/api/trips")


@bp.get("/<trip_id>/activities.csv")
def export_activities_csv(trip_id):
    trip_id = parse_id(trip_id)
    if trip_id is None:
        return jsonify(error="Invalid trip id"), 400
    row = find_trip(trip_id)
    if row is None:
        return jsonify(error="Trip not found"), 404

    activities = get_db().execute(
        """SELECT title, date, time, location, notes
           FROM activities WHERE trip_id = ? ORDER BY date, time, id""",
        (trip_id,),
    ).fetchall()
    content = StringIO(newline="")
    writer = csv.writer(content, lineterminator="\r\n")
    writer.writerow(["Activity", "Date", "Time", "Location", "Notes"])
    writer.writerows(
        (activity["title"], activity["date"], activity["time"], activity["location"], activity["notes"])
        for activity in activities
    )
    output = BytesIO(content.getvalue().encode("utf-8"))
    return send_file(
        output,
        mimetype="text/csv",
        as_attachment=True,
        download_name=f"{_safe_filename(row['name'])}-activities.csv",
    )


@bp.get("/<trip_id>/itinerary.pdf")
def export_itinerary(trip_id):
    trip_id = parse_id(trip_id)
    if trip_id is None:
        return jsonify(error="Invalid trip id"), 400
    row = find_trip(trip_id)
    if row is None:
        return jsonify(error="Trip not found"), 404

    trip = trip_to_dict(row)
    activities = get_db().execute(
        """SELECT title, date, time, location, notes, duration
           FROM activities WHERE trip_id = ? ORDER BY date, time, id""",
        (trip_id,),
    ).fetchall()

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ItineraryTitle", parent=styles["Title"], alignment=TA_CENTER, spaceAfter=12
    )
    body_style = ParagraphStyle("ItineraryBody", parent=styles["BodyText"], fontSize=9, leading=12)
    small_style = ParagraphStyle("ItinerarySmall", parent=body_style, fontSize=8)
    story = [
        Paragraph("Trip Itinerary", title_style),
        Paragraph(f"<b>{_escape(trip['name'])}</b>", styles["Heading2"]),
        Spacer(1, 4),
        Paragraph(f"Destination: {_escape(' → '.join(trip['destinations']))}", body_style),
        Paragraph(f"Dates: {_escape(trip['start_date'])} – {_escape(trip['end_date'])}", body_style),
        Paragraph(f"Budget: {_escape(str(trip['budget']))}", body_style),
        Spacer(1, 12),
        Paragraph("Activities", styles["Heading2"]),
        Spacer(1, 4),
    ]

    if activities:
        data = [[
            Paragraph("<b>Date</b>", small_style),
            Paragraph("<b>Time</b>", small_style),
            Paragraph("<b>Activity</b>", small_style),
            Paragraph("<b>Location</b>", small_style),
            Paragraph("<b>Notes</b>", small_style),
        ]]
        for activity in activities:
            time = activity["time"] or "—"
            if activity["duration"] and activity["time"]:
                time = f"{time} – {_end_time(activity['time'], activity['duration'])}"
            data.append([
                Paragraph(_escape(activity["date"]), small_style),
                Paragraph(_escape(time), small_style),
                Paragraph(_escape(activity["title"]), small_style),
                Paragraph(_escape(activity["location"] or "—"), small_style),
                Paragraph(_escape(activity["notes"] or "—"), small_style),
            ])
        table = Table(data, colWidths=[24 * mm, 28 * mm, 38 * mm, 35 * mm, 55 * mm], repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e5e7eb")),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#9ca3af")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(table)
    else:
        story.append(Paragraph("No activities planned.", body_style))

    output = BytesIO()
    document = SimpleDocTemplate(
        output, pagesize=A4, rightMargin=15 * mm, leftMargin=15 * mm,
        topMargin=15 * mm, bottomMargin=15 * mm,
        title=f"{trip['name']} itinerary",
    )
    document.build(story)
    output.seek(0)
    return send_file(
        output,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"{_safe_filename(trip['name'])}-itinerary.pdf",
    )


def _escape(value):
    return str(value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _safe_filename(value):
    return "".join(character if character.isalnum() or character in " ._-" else "_" for character in value).strip() or "trip"


def _end_time(time, duration):
    hours, minutes = map(int, time.split(":"))
    total = hours * 60 + minutes + duration
    return f"{total // 60:02d}:{total % 60:02d}"
