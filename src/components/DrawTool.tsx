import React from "react";
import ManualIcon from "../assets/manual.svg?react";
import CircleIcon from "../assets/circle.svg?react";
import HeartIcon from "../assets/heart.svg?react";

export type DrawMode = "manual" | "circle" | "heart";

interface DrawToolProps {
  selectedMode: DrawMode;
  onModeChange: (mode: DrawMode) => void;
  showMarkers: boolean;
  onShowMarkersChange: (show: boolean) => void;
}

const DrawTool: React.FC<DrawToolProps> = ({
  selectedMode,
  onModeChange,
  showMarkers,
  onShowMarkersChange,
}) => {
  const modes = [
    { id: "manual" as const, label: "Manual", icon: ManualIcon },
    { id: "circle" as const, label: "Circle", icon: CircleIcon },
    { id: "heart" as const, label: "Heart", icon: HeartIcon },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-3">Draw Tool</h2>
      <div className="grid grid-cols-3 gap-2">
        {modes.map((mode) => {
          const IconComponent = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`group flex flex-col items-center justify-center p-3 rounded border-2 transition-colors bg-white text-gray-700 hover:cursor-pointer ${
                selectedMode === mode.id
                  ? "border-red-500"
                  : "border-gray-300 hover:border-red-300"
              }`}
            >
              <IconComponent
                className={`w-8 h-8 mb-1 ${
                  mode.id === "manual"
                    ? selectedMode === mode.id
                      ? "fill-red-500"
                      : "fill-gray-300 group-hover:fill-red-300"
                    : selectedMode === mode.id
                    ? "stroke-red-500"
                    : "stroke-gray-300 group-hover:stroke-red-300"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  selectedMode === mode.id
                    ? "text-red-500"
                    : "text-gray-300 group-hover:text-red-300"
                }`}
              >
                {mode.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <label
          htmlFor="show-markers"
          className="block font-medium text-gray-700"
        >
          Show markers
        </label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            id="show-markers"
            type="checkbox"
            className="sr-only peer"
            checked={showMarkers}
            onChange={(e) => onShowMarkersChange(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
        </label>
      </div>
    </div>
  );
};

export default DrawTool;
