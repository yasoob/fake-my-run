import { useState, useRef, useEffect, useCallback } from "react";

interface SearchResult {
  display_name: string;
  lat: number;
  lon: number;
}

interface LocationSearchProps {
  onSelect: (coords: [number, number]) => void;
  placeholder?: string;
  accessToken?: string;
}

export function LocationSearch({
  onSelect,
  placeholder = "Search location",
  accessToken,
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (trimmed.length < 3) {
        setResults([]);
        setIsOpen(false);
        setSelectedIndex(-1);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      try {
        let items: SearchResult[] = [];

        if (accessToken) {
          // Use Mapbox Geocoding API
          try {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
              trimmed
            )}.json?access_token=${accessToken}&limit=5&types=place,locality,neighborhood,address,poi`;
            const res = await fetch(url, { signal: controller.signal });
            if (res.ok) {
              const data = await res.json();
              interface MapboxFeature {
                place_name: string;
                center: [number, number];
              }
              items = (data.features || []).map((f: MapboxFeature) => ({
                display_name: f.place_name,
                lon: f.center[0],
                lat: f.center[1],
              }));
            }
          } catch {
            // Fall through to Nominatim
          }
        }

        if (items.length === 0) {
          // Fallback to OSM Nominatim
          try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              trimmed
            )}&limit=5`;
            const res = await fetch(url, { signal: controller.signal });
            if (res.ok) {
              interface NominatimItem {
                display_name: string;
                lat: string;
                lon: string;
              }
              const data: NominatimItem[] = await res.json();
              items = data.map((item) => ({
                display_name: item.display_name,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
              }));
            }
          } catch {
            // Non-critical search error
          }
        }

        setResults(items);
        setIsOpen(items.length > 0);
        setSelectedIndex(-1);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken]
  );

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (result: SearchResult) => {
    setQuery(result.display_name);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect([result.lon, result.lat]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-label={placeholder}
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto py-1"
        >
          {results.map((result, i) => (
            <li
              key={i}
              role="option"
              aria-selected={selectedIndex === i}
              onClick={() => handleSelect(result)}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                selectedIndex === i
                  ? "bg-red-50 text-red-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {result.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
