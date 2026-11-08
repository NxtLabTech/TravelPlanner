import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from flask import Blueprint, current_app, jsonify

from models import find_trip
from validation import parse_id

bp = Blueprint("weather", __name__, url_prefix="/api")

WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def fetch_json(url):
    with urlopen(url, timeout=10) as response:
        return json.load(response)


def get_coordinates_for_destination(destination):
    geocode_url = "https://geocoding-api.open-meteo.com/v1/search?" + urlencode({
        "name": destination,
        "count": 1,
        "language": "en",
        "format": "json",
    })
    locations = fetch_json(geocode_url).get("results") or []
    if not locations:
        raise ValueError("Destination could not be located")
    location = locations[0]
    return {"latitude": location["latitude"], "longitude": location["longitude"]}


def get_weather_for_destination(destination):
    location = get_coordinates_for_destination(destination)
    forecast_url = "https://api.open-meteo.com/v1/forecast?" + urlencode({
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
        "temperature_unit": "celsius",
        "wind_speed_unit": "kmh",
    })
    current = fetch_json(forecast_url).get("current") or {}
    required = ("temperature_2m", "relative_humidity_2m", "wind_speed_10m", "weather_code")
    if any(field not in current for field in required):
        raise ValueError("Weather provider returned incomplete data")

    return {
        "temperature": current["temperature_2m"],
        "condition": WEATHER_CODES.get(current["weather_code"], "Unknown"),
        "humidity": current["relative_humidity_2m"],
        "wind_speed": current["wind_speed_10m"],
        "units": {"temperature": "°C", "wind_speed": "km/h"},
    }


@bp.get("/trips/<trip_id>/weather")
def get_trip_weather(trip_id):
    trip_id = parse_id(trip_id)
    if trip_id is None:
        return jsonify(error="Invalid trip id"), 400
    trip = find_trip(trip_id)
    if trip is None:
        return jsonify(error="Trip not found"), 404

    try:
        weather = get_weather_for_destination(trip["destination"])
    except (HTTPError, URLError, TimeoutError, ValueError, KeyError, json.JSONDecodeError):
        current_app.logger.exception("Weather request failed for trip %s", trip_id)
        return jsonify(error="Weather information is unavailable"), 503
    return jsonify(weather)


@bp.get("/trips/<trip_id>/location")
def get_trip_location(trip_id):
    trip_id = parse_id(trip_id)
    if trip_id is None:
        return jsonify(error="Invalid trip id"), 400
    trip = find_trip(trip_id)
    if trip is None:
        return jsonify(error="Trip not found"), 404

    try:
        return jsonify(get_coordinates_for_destination(trip["destination"]))
    except (HTTPError, URLError, TimeoutError, ValueError, KeyError, json.JSONDecodeError):
        current_app.logger.exception("Location request failed for trip %s", trip_id)
        return jsonify(error="Map location is unavailable"), 503
