import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Leaflet's default marker image paths break when bundled with Vite,
// so we point them at the imported files.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function DestinationMap({ destination }) {
  const containerRef = useRef(null);
  // "loading" | "ready" | "notfound" | "error"
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    // Create the map showing the whole world until we find the destination.
    const map = L.map(containerRef.current).setView([20, 0], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    let cancelled = false;
    setStatus("loading");

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      destination
    )}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Lookup failed");
        return res.json();
      })
      .then((results) => {
        if (cancelled) return;
        if (results.length === 0) {
          setStatus("notfound");
          return;
        }
        const lat = Number(results[0].lat);
        const lon = Number(results[0].lon);
        map.setView([lat, lon], 11);
        L.marker([lat, lon]).addTo(map).bindPopup(destination).openPopup();
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    // Cleanup: runs when the destination changes or the page closes.
    return () => {
      cancelled = true;
      map.remove();
    };
  }, [destination]);

  return (
    <div>
      <div
        ref={containerRef}
        className="relative z-0 h-72 w-full rounded border border-gray-200"
      />
      {status === "loading" && (
        <p className="mt-2 text-sm text-gray-500">Finding destination on the map...</p>
      )}
      {status === "notfound" && (
        <p className="mt-2 text-sm text-gray-500">
          We could not find "{destination}" on the map.
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-sm text-red-700">
          The map could not load the location. Please try again later.
        </p>
      )}
    </div>
  );
}
