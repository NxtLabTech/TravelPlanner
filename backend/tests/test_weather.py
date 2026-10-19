
import pytest

from services import weather
from services.weather import (
    WeatherUnavailableError,
    get_weather,
    weather_description,
)


def test_get_weather_returns_current_conditions(monkeypatch):
    responses = [
        {
            "results": [
                {"name": "Goa", "latitude": 15.5, "longitude": 73.8}
            ]
        },
        {
            "current": {
                "temperature_2m": 29,
                "relative_humidity_2m": 75,
                "wind_speed_10m": 12,
                "weather_code": 2,
            },
            "current_units": {
                "temperature_2m": "°C",
                "wind_speed_10m": "km/h",
            },
        },
    ]

    def fake_fetch_json(url, params):
        return responses.pop(0)

    monkeypatch.setattr(weather, "fetch_json", fake_fetch_json)

    result = get_weather("Goa")

    assert result == {
        "destination": "Goa",
        "temperature": 29,
        "condition": "Partly cloudy",
        "humidity": 75,
        "wind_speed": 12,
        "units": {"temperature": "°C", "wind_speed": "km/h"},
    }


def test_get_weather_handles_unknown_destination(monkeypatch):
    monkeypatch.setattr(
        weather, "fetch_json", lambda url, params: {"results": []}
    )

    with pytest.raises(WeatherUnavailableError):
        get_weather("Unknown place")


def test_get_weather_handles_missing_coordinates(monkeypatch):
    monkeypatch.setattr(
        weather,
        "fetch_json",
        lambda url, params: {"results": [{"name": "Goa"}]},
    )

    with pytest.raises(WeatherUnavailableError):
        get_weather("Goa")


def test_get_weather_handles_invalid_forecast(monkeypatch):
    responses = [
        {"results": [{"name": "Goa", "latitude": 15.5, "longitude": 73.8}]},
        {"current": None},
    ]

    monkeypatch.setattr(
        weather, "fetch_json", lambda url, params: responses.pop(0)
    )

    with pytest.raises(WeatherUnavailableError):
        get_weather("Goa")


def test_fetch_json_handles_invalid_json(monkeypatch):
    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def read(self):
            return b"not valid JSON"

    monkeypatch.setattr(weather, "urlopen", lambda *args, **kwargs: FakeResponse())

    with pytest.raises(WeatherUnavailableError):
        weather.fetch_json("https://example.com/weather", {})


def test_weather_description_handles_unknown_code():
    assert weather_description(999) == "Unknown conditions"
