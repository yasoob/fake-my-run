import {
  useRef,
  useEffect,
  useReducer,
  useCallback,
  useMemo,
  useState,
} from "react";
import mapboxgl from "mapbox-gl";
import { LocationSearch } from "./components/LocationSearch";
import RunDetailsPanel from "./components/RunDetailsPanel";
import DrawTool, { type DrawMode } from "./components/DrawTool";
import "mapbox-gl/dist/mapbox-gl.css";
import "./App.css";
import ProfileCharts from "./components/ProfileCharts";
import { FAQ } from "./components/FAQ";
import { buildGPX, StravaBuilder } from "gpx-builder";
import keyIcon from "./assets/key.svg";
import githubIcon from "./assets/github.svg";
import TokenDialog from "./components/TokenDialog";
import MapErrorBoundary from "./components/MapErrorBoundary";
import {
  haversineDistance,
  calculateVariablePace,
  generateCircleCoordinates,
  generateHeartCoordinates,
  chunkCoordinates,
} from "./lib/utils";
import { trackEvent } from "./lib/gtag";

const { Point, Metadata, Track, Segment } = StravaBuilder.MODELS;

const INITIAL_CENTER: [number, number] = [-74.0242, 40.6941];
const INITIAL_ZOOM = 13;
const DEFAULT_ACCESS_TOKEN =
  (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string) ||
  "pk.eyJ1IjoieWFzb29iIiwiYSI6ImNtZHBtMGl3djBlZ2oyaW43ZDZ1MzE5M2YifQ.PLBwTXqAkzkX2EW5Kp67uw";

// Centralized state interface (pure data, zero DOM instances)
interface AppState {
  coordinates: [number, number][];
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
  | { type: "UNDO_COORDINATE" }
  | { type: "SET_LOADING_ROUTE"; payload: boolean }
  | { type: "SET_PACE"; payload: number }
  | { type: "SET_PACE_VARIABILITY"; payload: number }
  | { type: "SET_ELEVATIONS"; payload: number[] }
  | { type: "ADD_ELEVATION"; payload: number }
  | { type: "SET_DRAW_MODE"; payload: DrawMode }
  | { type: "SET_SHOW_MARKERS"; payload: boolean }
  | { type: "CLEAR_ALL" }
  | {
      type: "UPDATE_ROUTE";
      payload: {
        coordinates: [number, number][];
        elevations: number[];
      };
    };

// Initial state
const initialState: AppState = {
  coordinates: [],
  isLoadingRoute: false,
  pace: 5.5,
  paceVariability: 0,
  elevations: [],
  drawMode: "manual" as DrawMode,
  showMarkers: true,
};

// Pure reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_COORDINATES":
      return { ...state, coordinates: action.payload };
    case "ADD_COORDINATE":
      return { ...state, coordinates: [...state.coordinates, action.payload] };
    case "UNDO_COORDINATE": {
      if (state.coordinates.length === 0) return state;
      const nextCoords = state.coordinates.slice(0, -1);
      const nextElevations = state.elevations.slice(0, nextCoords.length);
      return { ...state, coordinates: nextCoords, elevations: nextElevations };
    }
    case "SET_LOADING_ROUTE":
      return { ...state, isLoadingRoute: action.payload };
    case "SET_PACE":
      return { ...state, pace: action.payload };
    case "SET_PACE_VARIABILITY":
      return { ...state, paceVariability: action.payload };
    case "SET_ELEVATIONS":
      return { ...state, elevations: action.payload };
    case "ADD_ELEVATION":
      return { ...state, elevations: [...state.elevations, action.payload] };
    case "SET_DRAW_MODE":
      return { ...state, drawMode: action.payload };
    case "SET_SHOW_MARKERS":
      return { ...state, showMarkers: action.payload };
    case "CLEAR_ALL":
      return { ...state, coordinates: [], elevations: [] };
    case "UPDATE_ROUTE":
      return {
        ...state,
        coordinates: action.payload.coordinates,
        elevations: action.payload.elevations,
      };
    default:
      return state;
  }
}

function App() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem("mapboxAccessToken") || DEFAULT_ACCESS_TOKEN;
  });

  const [state, dispatch] = useReducer(appReducer, initialState);
  const coordinatesRef = useRef(state.coordinates);
  coordinatesRef.current = state.coordinates;

  // Memoized derived values - distance in meters
  const distance = useMemo(() => {
    if (state.coordinates.length < 2) return 0;
    return state.coordinates.reduce((total, coord, i) => {
      if (i === 0) return 0;
      return total + haversineDistance(state.coordinates[i - 1], coord);
    }, 0);
  }, [state.coordinates]);

  // Duration in minutes: (distance in km) * (pace in min/km)
  const duration = useMemo(() => {
    return distance > 0 ? (distance / 1000) * state.pace : 0;
  }, [distance, state.pace]);

  // Total elevation gain in meters
  const elevation = useMemo(() => {
    if (state.elevations.length === 0) return 0;
    return state.elevations.reduce((sum, curr, i) => {
      const prev = state.elevations[i - 1] ?? curr;
      const diff = i > 0 && curr > prev ? curr - prev : 0;
      return sum + diff;
    }, 0);
  }, [state.elevations]);

  // Synchronize GeoJSON layers (line & markers) with Mapbox WebGL canvas
  const drawLine = useCallback(
    (pts: [number, number][]) => {
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;

      const lineData = {
        type: "Feature" as const,
        geometry: { type: "LineString" as const, coordinates: pts },
        properties: {},
      };

      if (map.getSource("line")) {
        (map.getSource("line") as mapboxgl.GeoJSONSource).setData(lineData);
      } else {
        map.addSource("line", { type: "geojson", data: lineData });
        map.addLayer({
          id: "line",
          type: "line",
          source: "line",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#ef4444", "line-width": 4 },
        });
      }

      // GeoJSON point features for markers layer
      const markerData = {
        type: "FeatureCollection" as const,
        features: pts.map((coord, index) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: coord,
          },
          properties: {
            isEndpoint: index === 0 || index === pts.length - 1,
            isStart: index === 0,
          },
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
            "circle-radius": [
              "case",
              ["get", "isEndpoint"],
              7,
              4.5,
            ],
            "circle-color": [
              "case",
              ["get", "isStart"],
              "#22c55e",
              "#ef4444",
            ],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
          },
        });
      }

      if (map.getLayer("markers")) {
        map.setLayoutProperty(
          "markers",
          "visibility",
          state.showMarkers ? "visible" : "none"
        );
      }
    },
    [state.showMarkers]
  );

  const drawLineRef = useRef(drawLine);
  drawLineRef.current = drawLine;

  // GPX generation with single-pass O(N) timestamp accumulation
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
    if (coords.length < 2) return;

    const gpxData = new StravaBuilder();

    // Combine date and time into a single Date object
    const [hours, minutes] = runDetails.time.split(":").map(Number);
    const runDateTime = new Date(runDetails.date);
    runDateTime.setHours(hours || 7, minutes || 0, 0, 0);

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

    // Build track points with single-pass O(N) sequential timing
    let cumulativeSeconds = 0;
    const trackPoints = coords.map((c, i) => {
      const [lng, lat] = c;
      const ele = elevations[i] ?? 0;

      if (i > 0) {
        const segmentDistanceMeters = haversineDistance(coords[i - 1], c);
        const segmentPaceMinPerKm = variablePaces[i - 1] ?? state.pace;
        const segmentSeconds = (segmentDistanceMeters / 1000) * segmentPaceMinPerKm * 60;
        cumulativeSeconds += segmentSeconds;
      }

      const pointTime = new Date(runDateTime.getTime() + cumulativeSeconds * 1000);
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

    // Trigger download with sanitized filename
    const safeName =
      runDetails.name
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()
        .replace(/^_+|_+$/g, "") || "morning_run";

    const blob = new Blob([xmlString], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const handleRetrieve = (coords: [number, number]) => {
    mapRef.current?.flyTo({
      center: coords,
      zoom: 14,
      essential: true,
    });
  };

  const OPEN_MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

  const initializeMap = useCallback(async () => {
    if (!mapContainerRef.current) return;

    try {
      setMapError(null);
      mapboxgl.accessToken = accessToken;

      // Detect if using author's production-restricted token on localhost
      const isRestrictedLocal =
        accessToken === DEFAULT_ACCESS_TOKEN &&
        typeof window !== "undefined" &&
        !window.location.hostname.includes("yasoob.me");

      const initialStyle = isRestrictedLocal
        ? OPEN_MAP_STYLE
        : "mapbox://styles/mapbox/streets-v12";

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: initialStyle,
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
        cooperativeGestures: true,
      });

      mapRef.current = map;

      map.on("error", (e) => {
        const msg = (e.error?.message || "").toLowerCase();
        if (
          msg.includes("unauthorized") ||
          msg.includes("401") ||
          msg.includes("forbidden") ||
          msg.includes("403")
        ) {
          // Switch to open vector map layer if Mapbox tiles are forbidden or unauthorized
          try {
            map.setStyle(OPEN_MAP_STYLE);
          } catch {
            // style switch fallback
          }
        }
      });

      map.on("style.load", () => {
        if (coordinatesRef.current.length > 0) {
          drawLineRef.current(coordinatesRef.current);
        }
      });

      map.on("load", () => {
        map.resize();
        if (!isRestrictedLocal && accessToken) {
          try {
            map.addSource("mapbox-dem", {
              type: "raster-dem",
              url: "mapbox://mapbox.terrain-rgb",
              tileSize: 512,
              maxzoom: 14,
            });
            map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
          } catch {
            // Non-critical, continue without terrain
          }
        }
      });

      // Handle window resize
      const handleResize = () => map.resize();
      window.addEventListener("resize", handleResize);

      try {
        map.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: false },
            trackUserLocation: false,
            showUserHeading: false,
            showAccuracyCircle: false,
            showUserLocation: false,
          })
        );
      } catch {
        // Non-critical
      }
    } catch {
      setMapError("Failed to initialize the map. Loading fallback map.");
    }
  }, [accessToken]);

  const alignPathToRoad = useCallback(
    async (coords?: [number, number][]) => {
      const targetCoords = coords || state.coordinates;
      if (!Array.isArray(targetCoords) || targetCoords.length < 2) return;

      trackEvent("align_path_to_road", { points: targetCoords.length });
      dispatch({ type: "SET_LOADING_ROUTE", payload: true });

      try {
        // Chunk coordinates into groups of 25 with 1-point overlap to overcome Mapbox API limit
        const chunks = chunkCoordinates(targetCoords, 25);
        const chunkPromises = chunks.map(async (chunk) => {
          const coordsStr = chunk.map((c) => `${c[0]},${c[1]}`).join(";");

          // Try Mapbox walking directions first
          if (accessToken) {
            try {
              const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordsStr}?geometries=geojson&access_token=${accessToken}`;
              const res = await fetch(url);
              if (res.ok) {
                const data = await res.json();
                if (data.routes && data.routes[0] && data.routes[0].geometry) {
                  return data.routes[0].geometry.coordinates as [number, number][];
                }
              }
            } catch {
              // Fall through to OSRM
            }
          }

          // Fallback to free Open Source Routing Machine (OSRM) pedestrian routing
          try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${coordsStr}?geometries=geojson&overview=full`;
            const osrmRes = await fetch(osrmUrl);
            if (osrmRes.ok) {
              const osrmData = await osrmRes.json();
              if (osrmData.routes && osrmData.routes[0] && osrmData.routes[0].geometry) {
                return osrmData.routes[0].geometry.coordinates as [number, number][];
              }
            }
          } catch {
            // Fall through to straight chunk
          }

          return chunk;
        });

        const chunkResults = await Promise.all(chunkPromises);

        // Stitch road segments together without duplicating junction overlap coordinates
        let combinedCoords: [number, number][] = [];
        chunkResults.forEach((routeCoords, idx) => {
          if (idx === 0) {
            combinedCoords = [...routeCoords];
          } else {
            combinedCoords = combinedCoords.concat(routeCoords.slice(1));
          }
        });

        if (combinedCoords.length < 2) return;

        const map = mapRef.current;
        let cleanElevs: number[] = [];
        if (map) {
          const elevs = await Promise.all(
            combinedCoords.map((c) => map.queryTerrainElevation(c))
          );
          cleanElevs = elevs.map((e) => e ?? 0);
        }

        drawLine(combinedCoords);
        dispatch({
          type: "UPDATE_ROUTE",
          payload: {
            coordinates: combinedCoords,
            elevations: cleanElevs,
          },
        });
      } catch {
        setMapError("Failed to connect to routing service. Please try again.");
      } finally {
        dispatch({ type: "SET_LOADING_ROUTE", payload: false });
      }
    },
    [state.coordinates, accessToken, drawLine]
  );

  const handleMapClick = useCallback(
    async (e: mapboxgl.MapMouseEvent) => {
      const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const map = mapRef.current;
      if (!map) return;
      const currentZoom = map.getZoom();

      if (state.drawMode === "manual") {
        const newCoords: [number, number][] = [...state.coordinates, lngLat];
        dispatch({ type: "ADD_COORDINATE", payload: lngLat });
        drawLine(newCoords);

        // Incremental elevation querying for newly clicked point
        try {
          const elev = (await map.queryTerrainElevation(lngLat)) ?? 0;
          dispatch({ type: "ADD_ELEVATION", payload: elev });
        } catch {
          dispatch({ type: "ADD_ELEVATION", payload: 0 });
        }
      } else if (state.drawMode === "circle") {
        dispatch({ type: "CLEAR_ALL" });
        const circleCoords = generateCircleCoordinates(lngLat, currentZoom, 1);
        await alignPathToRoad(circleCoords);
      } else if (state.drawMode === "heart") {
        dispatch({ type: "CLEAR_ALL" });
        const heartCoords = generateHeartCoordinates(lngLat, currentZoom, 0.01);
        await alignPathToRoad(heartCoords);
      }
    },
    [state.coordinates, state.drawMode, alignPathToRoad, drawLine]
  );

  const undoLastPoint = useCallback(() => {
    if (state.coordinates.length === 0) return;
    const newCoords = state.coordinates.slice(0, -1);
    dispatch({ type: "UNDO_COORDINATE" });
    drawLine(newCoords);
  }, [state.coordinates, drawLine]);

  // Keyboard shortcut listener for Ctrl+Z / Cmd+Z undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        if (state.drawMode === "manual" && state.coordinates.length > 0) {
          e.preventDefault();
          undoLastPoint();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.drawMode, state.coordinates.length, undoLastPoint]);

  const handleSaveToken = (newToken: string) => {
    setAccessToken(newToken);
    localStorage.setItem("mapboxAccessToken", newToken);
    mapboxgl.accessToken = newToken;
    setMapError(null);
  };

  // Initialize map once
  useEffect(() => {
    initializeMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [initializeMap]);

  // Click handler listener
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const clickHandler = (e: mapboxgl.MapMouseEvent) => handleMapClick(e);
    map.on("click", clickHandler);
    return () => {
      map.off("click", clickHandler);
    };
  }, [handleMapClick]);

  // Visibility changes for GeoJSON marker layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("markers")) return;

    map.setLayoutProperty(
      "markers",
      "visibility",
      state.showMarkers ? "visible" : "none"
    );
  }, [state.showMarkers]);

  const clearMarkers = () => {
    trackEvent("clear_markers");
    const map = mapRef.current;
    if (map) {
      if (map.getSource("line")) {
        (map.getSource("line") as mapboxgl.GeoJSONSource).setData({
          type: "Feature",
          geometry: { type: "LineString", coordinates: [] },
          properties: {},
        });
      }
      if (map.getSource("markers")) {
        (map.getSource("markers") as mapboxgl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features: [],
        });
      }
    }
    dispatch({ type: "CLEAR_ALL" });
  };

  return (
    <>
      <header className="w-full flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🏃‍♂️</span>
          <h1 className="text-xl font-bold tracking-tight">Fake My Run</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTokenDialog(true)}
            className="p-2 hover:bg-white/15 rounded-full transition-colors cursor-pointer"
            title="Set Mapbox Access Token"
          >
            <img
              src={keyIcon}
              alt="Set Access Token"
              className="w-5 h-5 filter brightness-0 invert"
            />
          </button>
          <a
            href="https://github.com/yasoob/fake-my-run"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-white/15 rounded-full transition-colors cursor-pointer"
            title="View on GitHub"
          >
            <img
              src={githubIcon}
              alt="View on GitHub"
              className="w-5 h-5 filter brightness-0 invert"
            />
          </a>
        </div>
      </header>

      <TokenDialog
        isOpen={showTokenDialog}
        currentToken={accessToken}
        onClose={() => setShowTokenDialog(false)}
        onSave={handleSaveToken}
      />

      <main className="grid grid-cols-12 min-h-[calc(100vh-60px)]">
        <div className="col-span-12 md:col-span-8 relative flex flex-col">
          <div className="h-[460px] md:h-[680px] w-full relative">
            <div className="absolute top-3 left-3 z-10 w-[calc(100%-1.5rem)] max-w-md flex items-center gap-2">
              <div className="flex-1">
                <LocationSearch
                  onSelect={handleRetrieve}
                  accessToken={accessToken}
                  placeholder="Search location or city..."
                />
              </div>
              {state.coordinates.length > 0 && (
                <>
                  <button
                    onClick={undoLastPoint}
                    className="bg-white/95 backdrop-blur-sm text-gray-700 hover:text-gray-900 border border-gray-200 px-3 py-2 text-xs font-semibold rounded-lg shadow-sm hover:bg-gray-50 cursor-pointer transition-all"
                    title="Undo last point (Cmd+Z)"
                  >
                    Undo
                  </button>
                  <button
                    onClick={clearMarkers}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-all"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>

            <MapErrorBoundary onTokenError={() => setShowTokenDialog(true)}>
              <div
                id="map-container"
                className="w-full h-full"
                ref={mapContainerRef}
              >
                {mapError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs z-20 p-4">
                    <div className="bg-white text-center p-6 rounded-xl shadow-2xl max-w-md border border-gray-200">
                      <p className="text-red-600 font-medium mb-4 text-sm">{mapError}</p>
                      <button
                        onClick={() => setShowTokenDialog(true)}
                        className="bg-red-500 text-white px-4 py-2 text-sm font-semibold rounded-lg hover:bg-red-600 cursor-pointer shadow-sm"
                      >
                        Update Access Token
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </MapErrorBoundary>

            {state.coordinates.length >= 2 && (
              <button
                onClick={() => alignPathToRoad()}
                disabled={state.isLoadingRoute}
                className="absolute bottom-5 left-5 z-10 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg cursor-pointer transition-all flex items-center gap-2"
              >
                {state.isLoadingRoute ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Aligning to roads…</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Align Path to Road</span>
                  </>
                )}
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

        <div className="col-span-12 md:col-span-4 bg-white p-6 space-y-5 border-l border-gray-100 md:sticky md:top-0 md:self-start md:max-h-screen md:overflow-y-auto">
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
      </main>

      <FAQ />
    </>
  );
}

export default App;
