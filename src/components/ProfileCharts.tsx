import React, { useMemo, memo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { calculateVariablePace, haversineDistance } from "@/lib/utils";

interface ProfileChartsProps {
  coords: [number, number][];
  pace: number;
  paceVariability: number;
  distanceTotal: number;
  elevations: number[];
}

interface ElevationChartProps {
  coords: [number, number][];
  elevations: number[];
}

interface PaceChartProps {
  coords: [number, number][];
  pace: number;
  paceVariability: number;
}

interface TooltipPayloadItem {
  color?: string;
  dataKey?: string | number;
  value?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2.5 border border-gray-200 rounded-md shadow-md text-xs">
        <p className="font-semibold text-gray-800 mb-1">{`Distance: ${Number(label).toFixed(
          2
        )} km`}</p>
        {payload.map((entry, index) => (
          <p key={index} className="font-medium" style={{ color: entry.color }}>
            {entry.dataKey === "pace"
              ? `Pace: ${Number(entry.value).toFixed(2)} min/km`
              : `Elevation: ${Number(entry.value).toFixed(0)} m`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Compute cumulative distances along coordinates in kilometers
function getCumulativeDistancesKm(coords: [number, number][]): number[] {
  let acc = 0;
  const result: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    acc += haversineDistance(coords[i - 1], coords[i]);
    result.push(acc / 1000);
  }
  return result;
}

// Memoized elevation chart component
const ElevationChart = memo<ElevationChartProps>(({ coords, elevations }) => {
  const { elevationChartData, elevationGain } = useMemo(() => {
    const distances = getCumulativeDistancesKm(coords);
    const data = coords.map((_, i) => ({
      distance: distances[i] ?? 0,
      elevation: Math.round(elevations[i] ?? 0),
    }));

    const gain = elevations.reduce((sum, curr, i) => {
      const prev = elevations[i - 1] ?? curr;
      return sum + (i > 0 && curr > prev ? curr - prev : 0);
    }, 0);

    return { elevationChartData: data, elevationGain: gain };
  }, [coords, elevations]);

  return (
    <div className="w-full h-[220px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-800">
          Elevation Profile
        </h3>
        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
          Total Gain: {Math.round(elevationGain)} m
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={elevationChartData}>
          <XAxis
            dataKey="distance"
            tickFormatter={(value: number) => `${value.toFixed(1)} km`}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6b7280", fontSize: 11 }}
          />
          <YAxis
            tickFormatter={(value: number) => `${value.toFixed(0)} m`}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6b7280", fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="elevation"
            stroke="#f97316"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

// Memoized pace chart component
const PaceChart = memo<PaceChartProps>(
  ({ coords, pace, paceVariability }) => {
    const paceChartData = useMemo(() => {
      const variablePaces = calculateVariablePace(
        coords,
        pace,
        paceVariability
      );
      const distances = getCumulativeDistancesKm(coords);

      return coords.map((_, i) => ({
        distance: distances[i] ?? 0,
        pace: variablePaces[i] ?? pace,
      }));
    }, [coords, pace, paceVariability]);

    return (
      <div className="w-full h-[220px] mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-800">Pace Profile</h3>
          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
            Target Pace: {pace.toFixed(2)} min/km
          </span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={paceChartData}>
            <XAxis
              dataKey="distance"
              tickFormatter={(value: number) => `${value.toFixed(1)} km`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 11 }}
            />
            <YAxis
              tickFormatter={(value: number) => `${value.toFixed(2)}`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="pace"
              stroke="#ef4444"
              strokeWidth={2.5}
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
  elevations,
}) => {
  const n = coords.length;
  const hasData = n >= 2 && elevations.length === n;

  return (
    <div className="w-full p-4 bg-white border-t border-gray-100">
      {!hasData ? (
        <div className="py-8 px-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-500 mb-2">
            📍
          </div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">
            Route Profile Visualizer
          </h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Click on the map to plot at least 2 points. Live elevation terrain
            data and variable pace curves will be rendered here.
          </p>
        </div>
      ) : (
        <>
          <PaceChart
            coords={coords}
            pace={pace}
            paceVariability={paceVariability}
          />
          <ElevationChart coords={coords} elevations={elevations} />
        </>
      )}
    </div>
  );
};

export default ProfileCharts;
