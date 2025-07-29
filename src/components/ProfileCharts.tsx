import React, { useMemo, memo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ProfileChartsProps {
  coords: [number, number][];
  pace: number;
  paceVariability: number;
  distanceTotal: number;
  elevations: number[];
}

interface ElevationChartProps {
  coords: [number, number][];
  distanceTotal: number;
  elevations: number[];
}

interface PaceChartProps {
  coords: [number, number][];
  pace: number;
  paceVariability: number;
  distanceTotal: number;
  elevations: number[];
}

function calculateVariablePace(
  coords: [number, number][],
  targetPace: number,
  variabilityPercent: number
): number[] {
  if (coords.length === 0) return [];

  const variablePaces = coords.map((_, i) => {
    const seed = i * 0.1;
    const noise = Math.sin(seed) * Math.cos(seed * 1.7) * Math.sin(seed * 2.3);
    const variability = (variabilityPercent / 100) * targetPace;
    return targetPace + noise * variability;
  });

  return variablePaces;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow-lg">
        <p className="text-sm font-medium">{`Distance: ${Number(label).toFixed(
          1
        )} km`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.dataKey === "pace"
              ? `Pace: ${entry.value.toFixed(2)} min/km`
              : `Elevation: ${entry.value.toFixed(0)} m`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Memoized elevation chart component - only re-renders when its specific props change
const ElevationChart = memo<ElevationChartProps>(
  ({ coords, distanceTotal, elevations }) => {
    const n = coords.length;
    const hasData = n >= 2 && elevations.length === n;

    const { elevationChartData, elevationGain } = useMemo(() => {
      if (!hasData) {
        // Generate dummy elevation data for preview
        const dummyData = Array.from({ length: 20 }, (_, i) => ({
          distance: (i * 5) / 19, // 5km total
          elevation: 100 + Math.sin(i * 0.5) * 50 + Math.random() * 20,
        }));
        return { elevationChartData: dummyData, elevationGain: 125 };
      }

      const data = coords.map((_, i) => ({
        distance: ((distanceTotal / 1000) * i) / (n - 1),
        elevation: elevations[i],
      }));

      const gain = elevations.reduce((sum, curr, i) => {
        const prev = elevations[i - 1] ?? curr;
        return sum + (i > 0 && curr > prev ? curr - prev : 0);
      }, 0);

      return { elevationChartData: data, elevationGain: gain };
    }, [coords, distanceTotal, elevations, hasData, n]);

    return (
      <div style={{ height: "200px", width: "100%" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-700 mb-2">
            Elevation Profile
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            Total Gain: {Math.round(elevationGain)} m
          </p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={elevationChartData}>
            <XAxis
              dataKey="distance"
              tickFormatter={(value) => `${value.toFixed(1)} km`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#666", fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => `${value.toFixed(0)} m`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#666", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="elevation"
              stroke="orange"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

// Memoized pace chart component - only re-renders when its specific props change
const PaceChart = memo<PaceChartProps>(
  ({ coords, pace, paceVariability, distanceTotal, elevations }) => {
    const n = coords.length;
    const hasData = n >= 2 && elevations.length === n;

    const paceChartData = useMemo(() => {
      if (!hasData) {
        // Generate dummy pace data for preview
        return Array.from({ length: 20 }, (_, i) => ({
          distance: (i * 5) / 19, // 5km total
          pace: 5.2 + Math.sin(i * 0.3) * 0.8 + (Math.random() - 0.5) * 0.4,
        }));
      }

      const variablePaces = calculateVariablePace(
        coords,
        pace,
        paceVariability
      );

      return coords.map((_, i) => ({
        distance: ((distanceTotal / 1000) * i) / (n - 1),
        pace: variablePaces[i],
      }));
    }, [coords, pace, paceVariability, distanceTotal, hasData, n]);

    return (
      <div style={{ height: "200px", width: "100%" }} className="mb-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-700 mb-2">Pace Profile</h3>
          <p className="text-sm text-gray-600 mb-2">
            Average Pace: {pace.toFixed(2)} min/km
          </p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={paceChartData}>
            <XAxis
              dataKey="distance"
              tickFormatter={(value) => `${value.toFixed(1)} km`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#666", fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => `${value.toFixed(2)}`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#666", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="pace"
              stroke="orange"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

const ProfileCharts: React.FC<ProfileChartsProps> = ({
  coords,
  pace,
  paceVariability,
  distanceTotal,
  elevations,
}) => {
  const n = coords.length;
  const hasData = n >= 2 && elevations.length === n;

  return (
    <div className="w-full grid gap-6 p-4 bg-white">
      {!hasData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
          <p className="text-sm text-blue-700">
            📍 Preview data shown below. Select points on the map to see real
            elevation and pace data.
          </p>
        </div>
      )}

      <PaceChart
        coords={coords}
        pace={pace}
        paceVariability={paceVariability}
        distanceTotal={distanceTotal}
        elevations={elevations}
      />

      <ElevationChart
        coords={coords}
        distanceTotal={distanceTotal}
        elevations={elevations}
      />
    </div>
  );
};

export default ProfileCharts;
