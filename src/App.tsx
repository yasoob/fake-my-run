import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { SearchBox } from "@mapbox/search-js-react";

import "mapbox-gl/dist/mapbox-gl.css";
import "./App.css";

const INITIAL_CENTER: [number, number] = [-74.0242, 40.6941];
const INITIAL_ZOOM = 10.12;
const ACCESS_TOKEN =
  "pk.eyJ1IjoieWFzb29iIiwiYSI6ImNqdXVlbHRwcjBoenE0ZXAxYTF6azR3emcifQ.yGqW286LUR4dX9Y-pVeLFQ";

function haversineDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371e3;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function App() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [center, setCenter] = useState<[number, number]>(INITIAL_CENTER);
  const [zoom, setZoom] = useState<number>(INITIAL_ZOOM);
  const [value, setValue] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  const handleRetrieve = (res: any) => {
    const coords = res.features[0].geometry.coordinates;
    mapRef.current?.flyTo({
      center: coords,
      zoom: zoom,
      essential: true,
    });
  };

  const drawLine = (points: [number, number][]) => {
    const map = mapRef.current;
    if (!map) return;

    if (map.getSource("line")) {
      const source = map.getSource("line") as mapboxgl.GeoJSONSource;
      source.setData({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: points,
        },
        properties: {},
      });
    } else {
      map.addSource("line", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: points,
          },
          properties: {},
        },
      });

      map.addLayer({
        id: "line",
        type: "line",
        source: "line",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#ff0000",
          "line-width": 3,
        },
      });
    }
  };

  const alignPathToRoad = async () => {
    if (coordinates.length < 2) return;
    const coordsStr = coordinates.map((c) => `${c[0]},${c[1]}`).join(";");

    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordsStr}?geometries=geojson&access_token=${ACCESS_TOKEN}`;

    setIsLoadingRoute(true);

    try {
      const response = await fetch(url);
      const data = await response.json();

      const routeCoords: [number, number][] =
        data.routes[0].geometry.coordinates;

      // Remove old markers
      markers.forEach((m) => m.remove());

      // Add new snapped markers
      const map = mapRef.current;
      const newMarkers: mapboxgl.Marker[] = [];
      routeCoords.forEach((coord) => {
        const marker = new mapboxgl.Marker().setLngLat(coord).addTo(map!);
        newMarkers.push(marker);
      });
      setMarkers(newMarkers);
      setCoordinates(routeCoords);

      // Draw snapped route
      drawLine(routeCoords);

      // Log total distance
      let total = 0;
      for (let i = 1; i < routeCoords.length; i++) {
        total += haversineDistance(routeCoords[i - 1], routeCoords[i]);
      }
      console.log(
        `🚶‍♂️ Road-aligned path length: ${(total / 1000).toFixed(2)} km`
      );
    } catch (err) {
      console.error("Failed to align path:", err);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  useEffect(() => {
    mapboxgl.accessToken = ACCESS_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: "mapbox://styles/mapbox/streets-v12",
      center: center,
      zoom: zoom,
    });

    mapRef.current = map;

    map.on("move", () => {
      const mapCenter = map.getCenter();
      const mapZoom = map.getZoom();
      setCenter([mapCenter.lng, mapCenter.lat]);
      setZoom(mapZoom);
    });

    map.on("click", (e) => {
      const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      const marker = new mapboxgl.Marker().setLngLat(lngLat).addTo(map);
      setMarkers((prev) => [...prev, marker]);

      setCoordinates((prev) => {
        const updated = [...prev, lngLat];
        drawLine(updated);

        let total = 0;
        for (let i = 1; i < updated.length; i++) {
          total += haversineDistance(updated[i - 1], updated[i]);
        }
        console.log(`🧭 Total path length: ${(total / 1000).toFixed(2)} km`);

        return updated;
      });
    });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl min-h-screen relative">
      <div className="px-4 py-2 absolute w-full z-10 flex gap-2 items-center">
        <div className="flex-1">
          <SearchBox
            options={{
              proximity: {
                lng: -122.431297,
                lat: 37.773972,
              },
            }}
            value={value}
            onChange={(d) => setValue(d)}
            onRetrieve={handleRetrieve}
            placeholder="Search for a location"
            accessToken={ACCESS_TOKEN}
          />
        </div>
        <button
          onClick={() => {
            markers.forEach((m) => m.remove());
            setMarkers([]);
            setCoordinates([]);
            setValue("");

            const map = mapRef.current;
            if (map && map.getSource("line")) {
              map.removeLayer("line");
              map.removeSource("line");
            }
          }}
          className="bg-red-500 text-white px-3 rounded hover:bg-red-600 self-stretch hover:cursor-pointer"
        >
          Clear
        </button>
      </div>

      <div id="map-container" className="min-h-screen" ref={mapContainerRef} />

      {coordinates.length >= 2 && (
        <div className="absolute bottom-4 left-4 z-10">
          <button
            onClick={alignPathToRoad}
            className="bg-red-500 text-white px-4 py-2 rounded shadow-md hover:bg-red-600 hover:cursor-pointer"
            disabled={isLoadingRoute}
          >
            {isLoadingRoute ? "Aligning..." : "✨ Align Path to Road"}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
