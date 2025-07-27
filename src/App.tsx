import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { SearchBox } from "@mapbox/search-js-react";

import "mapbox-gl/dist/mapbox-gl.css";
import "./App.css";

const INITIAL_CENTER: [number, number] = [-74.0242, 40.6941];

const INITIAL_ZOOM = 10.12;
const ACCESS_TOKEN =
  "pk.eyJ1IjoieWFzb29iIiwiYSI6ImNqdXVlbHRwcjBoenE0ZXAxYTF6azR3emcifQ.yGqW286LUR4dX9Y-pVeLFQ";

function App() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [center, setCenter] = useState<[number, number]>(INITIAL_CENTER);
  const [zoom, setZoom] = useState<number>(INITIAL_ZOOM);
  const [value, setValue] = useState("");

  const handleRetrieve = (res: any) => {
    mapRef.current?.flyTo({
      center: res.features[0].geometry.coordinates,
      zoom: zoom, // Adjust zoom level as needed
      essential: true, // This ensures the animation is not interrupted
    });
  };

  useEffect(() => {
    mapboxgl.accessToken = ACCESS_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      center: center,
      zoom: zoom,
    });

    mapRef.current.on("move", () => {
      // get the current center coordinates and zoom level from the map
      const mapCenter = mapRef.current?.getCenter();
      const mapZoom = mapRef.current?.getZoom();

      // update state
      if (mapCenter) {
        setCenter([mapCenter.lng, mapCenter.lat]);
      }
      if (mapZoom) {
        setZoom(mapZoom);
      }
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl min-h-screen relative">
      <div className="px-4 py-2 absolute  w-full z-10">
        <SearchBox
          options={{
            proximity: {
              lng: -122.431297,
              lat: 37.773972,
            },
          }}
          value={value}
          onChange={(d) => {
            setValue(d);
          }}
          onRetrieve={handleRetrieve}
          placeholder="Search for a location"
          accessToken={ACCESS_TOKEN}
        />
      </div>
      <div id="map-container" className="min-h-screen" ref={mapContainerRef} />
    </div>
  );
}

export default App;
