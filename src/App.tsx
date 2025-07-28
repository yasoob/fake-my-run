import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { SearchBox } from "@mapbox/search-js-react";
import RunDetailsPanel from "./RunDetailsPanel";
import "mapbox-gl/dist/mapbox-gl.css";
import "./App.css";
import ProfileCharts from "./ProfileCharts";

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
  const φ1 = toRad(lat1),
    φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1),
    Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function App() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [value, setValue] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [pace, setPace] = useState(5.5);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [elevations, setElevations] = useState<number[]>([]);
  const [elevation, setElevation] = useState(0);

  // Recalculate duration when pace or distance changes
  useEffect(() => {
    if (distance > 0) {
      setDuration(distance / ((pace * 1000) / 60));
    }
  }, [pace, distance]);

  const handleRetrieve = (res: any) => {
    const coords = res.features[0].geometry.coordinates;
    mapRef.current?.flyTo({
      center: coords,
      zoom: mapRef.current!.getZoom(),
      essential: true,
    });
  };

  const drawLine = (pts: [number, number][]) => {
    const map = mapRef.current;
    if (!map) return;
    const data = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: pts },
      properties: {},
    };
    if (map.getSource("line")) {
      (map.getSource("line") as mapboxgl.GeoJSONSource).setData(data);
    } else {
      map.addSource("line", { type: "geojson", data });
      map.addLayer({
        id: "line",
        type: "line",
        source: "line",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#ff0000", "line-width": 3 },
      });
    }
  };

  async function updateElevationGain(coords: [number, number][]) {
    const map = mapRef.current!;
    const elevs = await Promise.all(
      coords.map((c) => map.queryTerrainElevation(c))
    );
    const clean = elevs.map((e) => e ?? 0);
    setElevations(clean);

    const gain = clean.reduce((sum, curr, i) => {
      const prev = clean[i - 1];
      const diff = i > 0 && curr > prev ? curr - prev : 0;
      return sum + diff;
    }, 0);
    setElevation(gain);
  }

  const alignPathToRoad = async () => {
    if (coordinates.length < 2) return;
    const coordsStr = coordinates.map((c) => `${c[0]},${c[1]}`).join(";");
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordsStr}?geometries=geojson&access_token=${ACCESS_TOKEN}`;

    setIsLoadingRoute(true);
    try {
      const res = await fetch(url);
      const data = await res.json();
      const routeCoords = data.routes[0].geometry.coordinates;

      markers.forEach((m) => m.remove());
      const map = mapRef.current!;
      const newMs: mapboxgl.Marker[] = routeCoords.map((c) =>
        new mapboxgl.Marker().setLngLat(c).addTo(map)
      );
      setMarkers(newMs);
      setCoordinates(routeCoords);
      drawLine(routeCoords);

      let total = 0;
      for (let i = 1; i < routeCoords.length; i++) {
        total += haversineDistance(routeCoords[i - 1], routeCoords[i]);
      }
      setDistance(total);
      setDuration(total / ((pace * 1000) / 60));
      await updateElevationGain(routeCoords);

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
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });
    mapRef.current = map;

    map.on("move", () => {
      /* no-op */
    });

    map.on("load", () => {
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.terrain-rgb",
        tileSize: 512,
        maxzoom: 14,
      });
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
    });

    map.on("click", async (e) => {
      const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      new mapboxgl.Marker().setLngLat(lngLat).addTo(map);

      setCoordinates((prev) => {
        const updated = [...prev, lngLat];
        drawLine(updated);

        let total = 0;
        for (let i = 1; i < updated.length; i++) {
          total += haversineDistance(updated[i - 1], updated[i]);
        }
        setDistance(total);
        setDuration(total / ((pace * 1000) / 60));

        updateElevationGain(updated);

        return updated;
      });
    });

    return () => map.remove();
  }, []);

  return (
    <div className="grid grid-cols-12 min-h-screen">
      <div className="col-span-12 md:col-span-8 relative">
        <div className="h-[800px] w-full relative">
          <div className="absolute top-2 left-2 z-10 w-[calc(100%-1rem)] flex gap-2">
            <div className="flex-1">
              <SearchBox
                options={{ proximity: { lng: -122.43, lat: 37.77 } }}
                value={value}
                onChange={setValue}
                onRetrieve={handleRetrieve}
                placeholder="Search location"
                accessToken={ACCESS_TOKEN}
              />
            </div>
            <button
              onClick={() => {
                markers.forEach((m) => m.remove());
                setMarkers([]);
                setCoordinates([]);
                setElevations([]);
                setDistance(0);
                setDuration(0);
                setElevation(0);
              }}
              className="bg-red-500 text-white px-3 rounded hover:cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div id="map-container" className="w-full" ref={mapContainerRef} />

          {coordinates.length >= 2 && (
            <button
              onClick={alignPathToRoad}
              disabled={isLoadingRoute}
              className="absolute bottom-4 left-4 z-10 bg-red-500 text-white px-4 py-2 rounded shadow-md"
            >
              {isLoadingRoute ? "Aligning…" : "✨ Align Path to Road"}
            </button>
          )}
        </div>

        <ProfileCharts
          coords={coordinates}
          pace={pace}
          distanceTotal={distance}
          elevations={elevations}
        />
      </div>
      <div className="col-span-12 md:col-span-4 bg-white p-6 space-y-4 overflow-y-auto">
        <RunDetailsPanel
          pace={pace}
          setPace={setPace}
          distance={distance}
          duration={duration}
          elevation={elevation}
        />
      </div>
    </div>
  );
}

export default App;
