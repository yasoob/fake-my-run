import { useRef, useEffect, useReducer, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import { SearchBox } from "@mapbox/search-js-react";
import RunDetailsPanel from "./RunDetailsPanel";
import DrawTool, { type DrawMode } from "./DrawTool";
import "mapbox-gl/dist/mapbox-gl.css";
import "./App.css";
import ProfileCharts from "./ProfileCharts";
import { buildGPX, StravaBuilder } from "gpx-builder";
const { Point, Metadata, Track, Segment } = StravaBuilder.MODELS;

const INITIAL_CENTER: [number, number] = [-74.0242, 40.6941];
const INITIAL_ZOOM = 13;
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

function calculateVariablePace(
  coords: [number, number][],
  targetPace: number,
  variabilityPercent: number
): number[] {
  if (coords.length === 0) return [];

  const variablePaces = coords.map((_, i) => {
    // Create deterministic but varied pace based on position
    const seed = i * 0.1;
    const noise = Math.sin(seed) * Math.cos(seed * 1.7) * Math.sin(seed * 2.3);
    const variability = (variabilityPercent / 100) * targetPace;
    return targetPace + noise * variability;
  });

  return variablePaces;
}

function generateCircleCoordinates(
  center: [number, number],
  zoom: number,
  baseRadiusKm: number = 1
): [number, number][] {
  const points = 20; // Reduced to meet Mapbox API limitation
  const coordinates: [number, number][] = [];

  // Adjust radius based on zoom level - higher zoom = smaller radius
  // Zoom 10 = base radius, each zoom level halves/doubles the radius
  const zoomFactor = Math.pow(2, 13 - zoom);
  const radiusKm = baseRadiusKm * zoomFactor;

  // Convert radius from km to degrees (approximate)
  const radiusLng = radiusKm / (111.32 * Math.cos((center[1] * Math.PI) / 180));
  const radiusLat = radiusKm / 110.54;

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const lng = center[0] + radiusLng * Math.cos(angle);
    const lat = center[1] + radiusLat * Math.sin(angle);
    coordinates.push([lng, lat]);
  }

  return coordinates;
}

function generateHeartCoordinates(
  center: [number, number],
  zoom: number,
  baseSize: number = 0.01
): [number, number][] {
  const coordinates: [number, number][] = [];
  const points = 20; // Reduced to meet Mapbox API limitation

  // Adjust size based on zoom level - higher zoom = smaller size
  // Zoom 10 = base size, each zoom level halves/doubles the size
  const zoomFactor = Math.pow(2, 13 - zoom);
  const size = baseSize * zoomFactor;

  for (let i = 0; i <= points; i++) {
    const t = (i / points) * 2 * Math.PI;

    // Heart equation: x = 16sin³(t), y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);

    // Scale and translate to the center
    const lng = center[0] + (x * size) / 16;
    const lat = center[1] + (y * size) / 16;
    coordinates.push([lng, lat]);
  }

  return coordinates;
}

// Centralized state interface
interface AppState {
  coordinates: [number, number][];
  markers: mapboxgl.Marker[];
  isLoadingRoute: boolean;
  pace: number;
  paceVariability: number;
  elevations: number[];
  drawMode: DrawMode;
  showMarkers: boolean;
}

// Action types
type AppAction =
  | { type: "SET_COORDINATES"; payload: [number, number][] }
  | { type: "ADD_COORDINATE"; payload: [number, number] }
  | { type: "SET_MARKERS"; payload: mapboxgl.Marker[] }
  | { type: "ADD_MARKER"; payload: mapboxgl.Marker }
  | { type: "SET_LOADING_ROUTE"; payload: boolean }
  | { type: "SET_PACE"; payload: number }
  | { type: "SET_PACE_VARIABILITY"; payload: number }
  | { type: "SET_ELEVATIONS"; payload: number[] }
  | { type: "SET_DRAW_MODE"; payload: DrawMode }
  | { type: "SET_SHOW_MARKERS"; payload: boolean }
  | { type: "CLEAR_ALL" }
  | {
      type: "UPDATE_ROUTE";
      payload: {
        coordinates: [number, number][];
        markers: mapboxgl.Marker[];
        elevations: number[];
      };
    };

// Initial state
const initialState: AppState = {
  coordinates: [],
  markers: [],
  isLoadingRoute: false,
  pace: 5.5,
  paceVariability: 15,
  elevations: [],
  drawMode: "manual" as DrawMode,
  showMarkers: true,
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_COORDINATES":
      return { ...state, coordinates: action.payload };
    case "ADD_COORDINATE":
      return { ...state, coordinates: [...state.coordinates, action.payload] };
    case "SET_MARKERS":
      return { ...state, markers: action.payload };
    case "ADD_MARKER":
      return { ...state, markers: [...state.markers, action.payload] };
    case "SET_LOADING_ROUTE":
      return { ...state, isLoadingRoute: action.payload };
    case "SET_PACE":
      return { ...state, pace: action.payload };
    case "SET_PACE_VARIABILITY":
      return { ...state, paceVariability: action.payload };
    case "SET_ELEVATIONS":
      return { ...state, elevations: action.payload };
    case "SET_DRAW_MODE":
      return { ...state, drawMode: action.payload };
    case "SET_SHOW_MARKERS":
      return { ...state, showMarkers: action.payload };
    case "CLEAR_ALL":
      // Clear markers from map
      state.markers.forEach((m) => m.remove());
      return { ...state, coordinates: [], markers: [], elevations: [] };
    case "UPDATE_ROUTE":
      // Clear old markers from map
      state.markers.forEach((m) => m.remove());
      return {
        ...state,
        coordinates: action.payload.coordinates,
        markers: action.payload.markers,
        elevations: action.payload.elevations,
      };
    default:
      return state;
  }
}

function App() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [state, dispatch] = useReducer(appReducer, initialState);

  // Memoized derived values
  const distance = useMemo(() => {
    if (state.coordinates.length < 2) return 0;
    return state.coordinates.reduce((total, coord, i) => {
      if (i === 0) return 0;
      return total + haversineDistance(state.coordinates[i - 1], coord);
    }, 0);
  }, [state.coordinates]);

  const duration = useMemo(() => {
    return distance > 0 ? distance / ((state.pace * 1000) / 60) : 0;
  }, [distance, state.pace]);

  const elevation = useMemo(() => {
    if (state.elevations.length === 0) return 0;
    return state.elevations.reduce((sum, curr, i) => {
      const prev = state.elevations[i - 1];
      const diff = i > 0 && curr > prev ? curr - prev : 0;
      return sum + diff;
    }, 0);
  }, [state.elevations]);

  function downloadGpx(
    coords: [number, number][],
    elevations: number[],
    runDetails: {
      name: string;
      date: Date;
      time: string;
      description: string;
    }
  ) {
    const gpxData = new StravaBuilder();

    // Combine date and time into a single Date object
    const [hours, minutes] = runDetails.time.split(":").map(Number);
    const runDateTime = new Date(runDetails.date);
    runDateTime.setHours(hours, minutes, 0, 0);

    const metadata = new Metadata({
      name: runDetails.name,
      desc: runDetails.description,
      time: runDateTime,
    });

    gpxData.setMetadata(metadata);

    // Calculate variable pace for each segment
    const variablePaces = calculateVariablePace(
      coords,
      state.pace,
      state.paceVariability
    );

    // Build track points with realistic timing based on variable pace
    const trackPoints = coords.map((c, i) => {
      const [lng, lat] = c;
      const ele = elevations[i] ?? 0;

      // Calculate cumulative time based on distance and variable pace
      let cumulativeTime = 0;
      if (i > 0) {
        for (let j = 1; j <= i; j++) {
          const segmentDistance = haversineDistance(coords[j - 1], coords[j]);
          const segmentPace = variablePaces[j - 1]; // Use pace from previous point
          const segmentTimeMinutes = (segmentDistance / 1000) * segmentPace;
          cumulativeTime += segmentTimeMinutes * 60; // convert to seconds
        }
      }

      // Create timestamp for this point
      const pointTime = new Date(runDateTime.getTime() + cumulativeTime * 1000);

      return new Point(lat, lng, {
        ele: ele,
        time: pointTime,
      });
    });

    const segment = new Segment(trackPoints);
    const track = new Track([segment], {
      name: runDetails.name,
      type: "running",
    });
    gpxData.setTracks([track]);

    const xmlString = buildGPX(gpxData.toObject());
    console.log(xmlString);

    // Trigger download
    const blob = new Blob([xmlString], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${runDetails.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const handleRetrieve = (res: any) => {
    const coords = res.features[0].geometry.coordinates;
    mapRef.current?.flyTo({
      center: coords,
      essential: true,
    });
  };

  const drawLine = (pts: [number, number][]) => {
    console.log("Drawing line with points:", pts);
    const map = mapRef.current;
    if (!map) return;
    const data = {
      type: "Feature" as const,
      geometry: { type: "LineString" as const, coordinates: pts },
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

    // Draw markers as a layer
    const markerData = {
      type: "FeatureCollection" as const,
      features: pts.map((coord) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: coord,
        },
        properties: {},
      })),
    };

    if (map.getSource("markers")) {
      (map.getSource("markers") as mapboxgl.GeoJSONSource).setData(markerData);
    } else {
      map.addSource("markers", { type: "geojson", data: markerData });
      map.addLayer({
        id: "markers",
        type: "circle",
        source: "markers",
        paint: {
          "circle-radius": 6,
          "circle-color": "#fb2c36",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });
    }

    // Control marker layer visibility
    if (map.getLayer("markers")) {
      map.setLayoutProperty(
        "markers",
        "visibility",
        state.showMarkers ? "visible" : "none"
      );
    }
  };

  async function updateElevationGain(coords: [number, number][]) {
    const map = mapRef.current;
    if (!map) return;

    const elevs = await Promise.all(
      coords.map((c) => map.queryTerrainElevation(c))
    );
    const clean = elevs.map((e) => e ?? 0);
    dispatch({ type: "SET_ELEVATIONS", payload: clean });
  }

  const alignPathToRoad = useCallback(
    async (coords?: [number, number][]) => {
      const targetCoords = coords || state.coordinates;
      if (!Array.isArray(targetCoords) || targetCoords.length < 2) return;

      const coordsStr = targetCoords.map((c) => `${c[0]},${c[1]}`).join(";");
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordsStr}?geometries=geojson&access_token=${ACCESS_TOKEN}`;

      dispatch({ type: "SET_LOADING_ROUTE", payload: true });
      try {
        const res = await fetch(url);
        const data = await res.json();

        if (!data.routes || !data.routes[0] || !data.routes[0].geometry) {
          console.error("Invalid route response from Mapbox API");
          return;
        }

        const routeCoords = data.routes[0].geometry.coordinates;
        const map = mapRef.current!;

        // Update elevations for new route
        const elevs = await Promise.all(
          routeCoords.map((c: [number, number]) => map.queryTerrainElevation(c))
        );
        const cleanElevs = elevs.map((e) => e ?? 0);

        // Create markers but don't add them to map directly
        const newMarkers: mapboxgl.Marker[] = routeCoords.map(
          (c: [number, number]) => {
            const marker = new mapboxgl.Marker({ color: "#fb2c36" }).setLngLat(
              c
            );
            if (state.showMarkers) {
              marker.addTo(map);
            }
            return marker;
          }
        );

        drawLine(routeCoords);

        dispatch({
          type: "UPDATE_ROUTE",
          payload: {
            coordinates: routeCoords,
            markers: newMarkers,
            elevations: cleanElevs,
          },
        });
      } catch (err) {
        console.error("Failed to align path:", err);
      } finally {
        dispatch({ type: "SET_LOADING_ROUTE", payload: false });
      }
    },
    [state.coordinates, state.showMarkers]
  );

  const handleMapClick = useCallback(
    async (e: mapboxgl.MapMouseEvent) => {
      const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const map = mapRef.current!;
      const currentZoom = map.getZoom();

      if (state.drawMode === "manual") {
        const marker = new mapboxgl.Marker({ color: "#fb2c36" }).setLngLat(
          lngLat
        );

        if (state.showMarkers) {
          marker.addTo(map);
        }

        dispatch({ type: "ADD_COORDINATE", payload: lngLat });
        dispatch({ type: "ADD_MARKER", payload: marker });

        // Use the updated coordinates
        const newCoords = [...state.coordinates, lngLat];
        drawLine(newCoords);
        updateElevationGain(newCoords);
      } else if (state.drawMode === "circle") {
        // Clear first, then generate new shape
        state.markers.forEach((m) => m.remove());
        dispatch({ type: "CLEAR_ALL" });

        const circleCoords = generateCircleCoordinates(lngLat, currentZoom, 1);
        await alignPathToRoad(circleCoords);
      } else if (state.drawMode === "heart") {
        // Clear first, then generate new shape
        state.markers.forEach((m) => m.remove());
        dispatch({ type: "CLEAR_ALL" });

        const heartCoords = generateHeartCoordinates(lngLat, currentZoom, 0.01);
        await alignPathToRoad(heartCoords);
      }
    },
    [
      state.coordinates,
      state.drawMode,
      state.markers,
      state.showMarkers,
      alignPathToRoad,
    ]
  );

  // Initialize map only once
  useEffect(() => {
    mapboxgl.accessToken = ACCESS_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: "mapbox://styles/mapbox/streets-v12",
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.terrain-rgb",
        tileSize: 512,
        maxzoom: 14,
      });
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
    });

    // Add geolocate control to the map.
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: false,
        },
        trackUserLocation: false,
        showUserHeading: false,
        showAccuracyCircle: false,
        showUserLocation: false,
      })
    );

    return () => map.remove();
  }, []);

  // Update click handler when needed
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const clickHandler = (e: mapboxgl.MapMouseEvent) => handleMapClick(e);

    map.on("click", clickHandler);
    return () => {
      map.off("click", clickHandler);
    };
  }, [handleMapClick]);

  // Handle marker visibility changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Toggle individual marker visibility
    state.markers.forEach((marker) => {
      if (state.showMarkers) {
        marker.addTo(map);
      } else {
        marker.remove();
      }
    });

    // Toggle marker layer visibility
    if (map.getLayer("markers")) {
      map.setLayoutProperty(
        "markers",
        "visibility",
        state.showMarkers ? "visible" : "none"
      );
    }
  }, [state.showMarkers, state.markers]);

  const clearMarkers = () => {
    const map = mapRef.current;
    if (map) {
      if (map.getLayer("line")) {
        map.removeLayer("line");
        map.removeSource("line");
      }
      if (map.getLayer("markers")) {
        map.removeLayer("markers");
        map.removeSource("markers");
      }
    }
    dispatch({ type: "CLEAR_ALL" });
  };

  return (
    <>
      <div className="w-full flex items-center justify-items-center p-4 bg-red-500 text-white shadow-md">
        <h1 className="text-3xl font-bold mx-auto">Fake My Run</h1>
      </div>
      <div className="grid grid-cols-12 min-h-screen">
        <div className="col-span-12 md:col-span-8 relative">
          <div className="h-[400px] md:h-[800px] w-full relative">
            <div className="absolute top-2 left-2 z-10 w-[calc(100%-1rem-39px)] flex gap-2">
              <div className="flex-1">
                {/* @ts-ignore */}
                <SearchBox
                  options={{ proximity: { lng: -122.43, lat: 37.77 } }}
                  onRetrieve={handleRetrieve}
                  placeholder="Search location"
                  accessToken={ACCESS_TOKEN}
                />
              </div>
              <button
                onClick={() => clearMarkers()}
                className="bg-red-500 text-white px-3 rounded hover:cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div id="map-container" className="w-full" ref={mapContainerRef} />

            {state.coordinates.length >= 2 && (
              <button
                onClick={() => alignPathToRoad()}
                disabled={state.isLoadingRoute}
                className="absolute bottom-4 left-4 z-10 bg-red-500 text-white px-4 py-2 rounded shadow-md hover:cursor-pointer"
              >
                {state.isLoadingRoute ? "Aligning…" : "✨ Align Path to Road"}
              </button>
            )}
          </div>

          <ProfileCharts
            coords={state.coordinates}
            pace={state.pace}
            paceVariability={state.paceVariability}
            distanceTotal={distance}
            elevations={state.elevations}
          />
        </div>
        <div className="col-span-12 md:col-span-4 bg-white p-6 space-y-4 overflow-y-auto">
          <DrawTool
            selectedMode={state.drawMode}
            onModeChange={(mode) =>
              dispatch({ type: "SET_DRAW_MODE", payload: mode })
            }
            showMarkers={state.showMarkers}
            onShowMarkersChange={(show) =>
              dispatch({ type: "SET_SHOW_MARKERS", payload: show })
            }
          />
          <RunDetailsPanel
            pace={state.pace}
            setPace={(pace) => dispatch({ type: "SET_PACE", payload: pace })}
            paceVariability={state.paceVariability}
            setPaceVariability={(variability) =>
              dispatch({ type: "SET_PACE_VARIABILITY", payload: variability })
            }
            distance={distance}
            duration={duration}
            elevation={elevation}
            onDownload={(runDetails) =>
              downloadGpx(state.coordinates, state.elevations, runDetails)
            }
          />
        </div>
      </div>
    </>
  );
}

export default App;
