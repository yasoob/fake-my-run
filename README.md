# 🏃‍♂️ Fake My Run

**Generate realistic GPX files for Strava**

## ✨ Features

- 🗺️ **Interactive Map Interface** - Click to create custom running routes on Mapbox
- 🛣️ **Road Alignment** - Automatically snap your route to real roads and paths
- ⚡ **Variable Pace Control** - Set target pace with realistic variability (0-50%)
- 📈 **Real-time Elevation** - Live elevation profiles with terrain data
- 📊 **Profile Charts** - Visual pace and elevation charts
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 💾 **GPX Export** - Download Strava-compatible GPX files with realistic timing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- bun
- Mapbox API token

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/fake-my-run.git
   cd fake-my-run
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up Mapbox token**

   - Get your free API token from [Mapbox](https://account.mapbox.com/)
   - Replace the `DEFAULT_ACCESS_TOKEN` in `src/App.tsx`

4. **Start development server**
   ```bash
   bun run dev
   ```

## 🎯 How to Use

1. **Create Your Route**

   - Use the search box to find specific locations
   - Click on the map to add waypoints
   - Click "Align Path to Road" for realistic routing

2. **Customize Your Run**

   - Adjust target pace (3-10 min/km)
   - Set pace variability (0-50%) for realism
   - View real-time distance, duration, and elevation

3. **Download GPX**
   - Set run name, date, and time
   - Add optional description
   - Download your GPX file for Strava/Garmin

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Mapping**: Mapbox GL JS
- **Charts**: Recharts
- **UI Components**: Shadcn
- **GPX Generation**: [gpx-builder](https://www.npmjs.com/package/gpx-builder)

## 🎨 Key Components

### Map Features

- Interactive point-and-click route creation
- Real-time road snapping via Mapbox Directions API
- Live elevation data from Mapbox Terrain

### Pace Simulation

- Deterministic variability algorithm
- Realistic timing based on distance segments
- Export with GPS timestamps for authenticity

### Data Export

- Standard GPX format
- Compatible with Strava
- Includes elevation, timing, and metadata

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the GPLv3 License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is for educational and testing purposes. Please use responsibly and in accordance with the terms of service of fitness tracking platforms.

## 🙏 Acknowledgments

- [Mapbox](https://mapbox.com) for mapping services
- [gpx-builder](https://github.com/gpx-builder/gpx-builder) for GPX generation
- [Recharts](https://recharts.org) for data visualization
