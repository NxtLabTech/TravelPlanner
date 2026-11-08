function getMapUrl(latitude, longitude) {
  const delta = 0.08;
  const left = longitude - delta;
  const right = longitude + delta;
  const bottom = latitude - delta;
  const top = latitude + delta;
  const params = new URLSearchParams({
    bbox: `${left},${bottom},${right},${top}`,
    layer: "mapnik",
    marker: `${latitude},${longitude}`,
  });
  return `https://www.openstreetmap.org/export/embed.html?${params}`;
}

export default function DestinationMap({ destination, location }) {
  return (
    <div>
      <p className="mt-1 text-sm text-gray-600">{destination}</p>
      <div className="mt-3 aspect-video overflow-hidden rounded border border-gray-200">
        <iframe
          title={`Map showing ${destination}`}
          src={getMapUrl(location.latitude, location.longitude)}
          className="h-full w-full border-0"
          loading="lazy"
        />
      </div>
      <a
        href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=12/${location.latitude}/${location.longitude}`}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-sm text-blue-600 hover:underline"
      >
        View larger map
      </a>
    </div>
  );
}
