# Fake My Run

Synthetic GPS Route Simulator and GPX Activity Generator.

---

## Important Notice and Legal Disclaimer

This repository and application are developed and provided strictly for educational, scientific testing, route planning, and software simulation purposes.

1. **Non-Falsification & Ethical Use:** This software is not intended, designed, or licensed to falsify athletic achievements, manipulate competitive leaderboards, deceive event organizers, or obtain unearned financial, commercial, or challenge rewards.
2. **Third-Party Terms of Service:** Users are solely responsible for ensuring that their use of generated `.gpx` files complies with the Terms of Service, Community Standards, and API usage rules of third-party fitness tracking platforms (such as Strava, Garmin Connect, Apple Health, Nike Run Club, and Komoot).
3. **No Warranty & Limitation of Liability:** This application is provided "as is" without warranty of any kind, either expressed or implied. In no event shall the authors, original copyright holders, or contributors be liable for any claims, penalties, account suspensions, damages, or other liabilities arising from the use or misuse of this software.
4. **Trademark Notice:** Strava, Garmin, Mapbox, and all other brand names, product names, or trademarks mentioned in this documentation and application belong to their respective owners. Fake My Run is an independent open-source project and is not affiliated with, endorsed by, or sponsored by any fitness platform or service provider.

---

## Attribution and Original Work

This project builds upon the original work created by **Muhammad Yasoob Ullah Khalid** ([@yasoob](https://github.com/yasoob)).

- **Original Repository:** [https://github.com/yasoob/fake-my-run](https://github.com/yasoob/fake-my-run)
- **Author Website:** [https://yasoob.me](https://yasoob.me)

Credit and sincere gratitude are extended to the original author for developing the initial concept and open-sourcing the project.

---

## Features and Capabilities

- **Interactive Vector Mapping:** High-performance WebGL map canvas powered by Mapbox GL JS for drawing, navigating, and inspecting routes globally.
- **Unrestricted Road Alignment:** Snaps drawn paths directly to real-world pedestrian and street networks. Employs intelligent multi-chunk request stitching to bypass third-party API waypoint constraints.
- **Topographic Elevation Extraction:** Samples real terrain elevation data along coordinates using Mapbox Terrain-RGB DEM rasters to compute cumulative elevation gain.
- **Configurable Pacing Simulation:** Allows customization of target pace (min/km) with continuous, deterministic variability to emulate natural athletic speed fluctuations.
- **Telemetry and Metrics:** Live calculation of total distance (Haversine formula), accurate run duration, average speed, and elevation profiles.
- **Interactive Profile Visualizations:** SVG-based pace and elevation charts mapped against cumulative route distance.
- **Standards-Compliant GPX Export:** Generates validated GPX 1.1 documents containing track segments, elevation data, and sequential ISO-8601 timestamps.
- **Undo and Route Management:** Full undo/redo controls (keyboard shortcut `Ctrl+Z` / `Cmd+Z`) and forward geocoding location search.

---

## Technology Stack

- **Application Framework:** React 19, TypeScript
- **Build Tooling & Bundler:** Vite 7
- **Styling Architecture:** Tailwind CSS v4, Radix UI Primitives
- **Cartography & GIS:** Mapbox GL JS v3, Mapbox Directions API, Mapbox Geocoding API
- **Data Visualization:** Recharts
- **GPX Serialization:** gpx-builder
- **Testing Engine:** Native Node.js Test Runner (`node:test`)

---

## Getting Started

### Prerequisites

- Node.js 20 or later (or Bun 1.1+)
- Mapbox Public Access Token ([https://account.mapbox.com](https://account.mapbox.com))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fake-my-run.git
   cd fake-my-run
   ```

2. Install project dependencies:
   ```bash
   npm install
   # or: bun install
   ```

3. Configure your Mapbox Access Token:
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and assign your public Mapbox token:
     ```env
     VITE_MAPBOX_ACCESS_TOKEN=pk.your_token_here
     ```
   - *Note:* You can also launch the app without an environment file and configure your token at runtime using the Key icon dialog in the navigation bar. The token is stored locally in your browser's `localStorage`.

4. Start the development server:
   ```bash
   npm run dev
   # or: bun run dev
   ```

5. Run automated tests:
   ```bash
   npm test
   ```

6. Build for production:
   ```bash
   npm run build
   ```

---

## Usage Instructions

1. **Locate Starting Point:** Use the search bar in the map toolbar to navigate to any city, trail, or landmark.
2. **Plot Route Waypoints:**
   - **Manual Mode:** Click directly on the map to place consecutive waypoints. Use the "Undo" button (or `Ctrl+Z` / `Cmd+Z`) to revert accidental points.
   - **Template Shapes:** Select the Circle or Heart template to generate geometric route formations centered on your viewport.
3. **Align to Roads:** Click "Align Path to Road" to snap waypoints to existing roads, sidewalks, and pedestrian pathways.
4. **Configure Parameters:** In the right panel, configure target pace, variability percentage, run title, start date, and start time.
5. **Inspect Metrics:** Review total distance, expected duration, elevation gain, and visual charts.
6. **Export GPX:** Click "Download GPX file" to produce an authentic `.gpx` file for simulation or analysis.

---

## Project Structure

```text
fake-my-run/
├── .github/workflows/    # CI/CD deployment pipelines
├── public/               # Static assets, sitemap, and robots.txt
├── src/
│   ├── assets/           # Application icons and vector graphics
│   ├── components/       # Application views, charts, and dialogs
│   │   ├── ui/           # Radix/Shadcn accessible design primitives
│   │   ├── DrawTool.tsx
│   │   ├── FAQ.tsx
│   │   ├── LocationSearch.tsx
│   │   ├── MapErrorBoundary.tsx
│   │   ├── ProfileCharts.tsx
│   │   ├── RunDetailsPanel.tsx
│   │   ├── TermsDialog.tsx
│   │   └── TokenDialog.tsx
│   ├── lib/              # Core math, geocoding, and utility modules
│   │   ├── gtag.ts       # Analytics telemetry helper
│   │   ├── utils.ts      # Haversine distance, pacing, and chunking algorithms
│   │   └── utils.test.ts # Automated unit test suite
│   ├── App.css           # Global Tailwind tokens and theme definitions
│   ├── App.tsx           # Main application controller
│   └── main.tsx          # Application entry point
├── package.json          # Dependency manifest and scripts
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite configuration and aliases
```

---

## License

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**. See the [LICENSE](LICENSE) file for complete terms and conditions.

---

## Acknowledgments

- **Muhammad Yasoob Ullah Khalid** for the original concept and codebase ([yasoob/fake-my-run](https://github.com/yasoob/fake-my-run)).
- **Mapbox** for mapping, elevation DEM, and routing APIs.
- **gpx-builder** for GPX schema representation and XML generation.
- **Recharts** for responsive data charting components.
