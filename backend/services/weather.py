
import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen


class WeatherUnavailableError(Exception):
    """Raised when weather information cannot be retrieved."""


def fetch_json(url, params):
    query = urlencode(params)
    request_url = f"{url}?{query}"

    try:
        with urlopen(request_url, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))

        if not isinstance(data, dict):
            raise ValueError("Unexpected API response format")

        return data
    except (HTTPError, URLError, TimeoutError, OSError, ValueError) as exc:
        raise WeatherUnavailableError(
            "Weather information is temporarily unavailable."
        ) from exc


def get_weather(destination):
    """Return current weather for a destination using Open-Meteo."""
    location = fetch_json(
        "https://geocoding-api.open-meteo.com/v1/search",
        {"name": destination, "count": 1, "language": "en", "format": "json"},
    )

    results = location.get("results")
    if not isinstance(results, list) or not results:
        raise WeatherUnavailableError(
            "Weather information is unavailable for this destination."
        )

    place = results[0]
    if not isinstance(place, dict):
        raise WeatherUnavailableError(
            "Weather information is unavailable for this destination."
        )

    latitude = place.get("latitude")
    longitude = place.get("longitude")
    if latitude is None or longitude is None:
        raise WeatherUnavailableError(
            "Weather information is temporarily unavailable."
        )

    forecast = fetch_json(
        "https://api.open-meteo.com/v1/forecast",
        {
            "latitude": latitude,
            "longitude": longitude,
            "current": (
                "temperature_2m,relative_humidity_2m,"
                "apparent_temperature,is_day,precipitation,"
                "weather_code,wind_speed_10m"
            ),
            "timezone": "auto",
        },
    )

    current = forecast.get("current")
    if not isinstance(current, dict):
        raise WeatherUnavailableError(
            "Weather information is temporarily unavailable."
        )

    units = forecast.get("current_units")
    if not isinstance(units, dict):
        units = {}

    return {
        "destination": place.get("name", destination),
        "temperature": current.get("temperature_2m"),
        "condition": weather_description(current.get("weather_code")),
        "humidity": current.get("relative_humidity_2m"),
        "wind_speed": current.get("wind_speed_10m"),
        "units": {
            "temperature": units.get("temperature_2m", "°C"),
            "wind_speed": units.get("wind_speed_10m", "km/h"),
        },
    }


def weather_description(code):
    """Translate Open-Meteo weather codes into readable conditions."""
    descriptions = {
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
        80: "Rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        95: "Thunderstorm",
        96: "Thunderstorm with hail",
        99: "Thunderstorm with heavy hail",
    }
    return descriptions.get(code, "Unknown conditions")
