import React from "react";

interface RunDetailsPanelProps {
  pace: number;
  setPace: (v: number) => void;
  distance: number;
  duration: number;
  elevation: number;
}

const RunDetailsPanel: React.FC<RunDetailsPanelProps> = ({
  pace,
  setPace,
  distance,
  duration,
  elevation,
}) => {
  return (
    <>
      <h2 className="text-xl font-bold">Run Details</h2>
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="text-md font-medium mb-2">Run Stats</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>{(distance / 1000).toFixed(2)}</strong> km
            <br />
            Distance
          </div>
          <div>
            <strong>
              {Math.floor(duration / 60)}:
              {Math.floor(duration % 60)
                .toString()
                .padStart(2, "0")}
            </strong>
            <br />
            Duration
          </div>
          <div>
            <strong>{Math.round(elevation)}m</strong>
            <br />
            Elevation Gain
          </div>
          <div>
            <strong>{pace.toFixed(2)}</strong>
            <br />
            min/km
          </div>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block mb-1 font-medium">Pace</label>
          <p className="text-sm text-right">{pace.toFixed(2)} min/km</p>
        </div>
        <input
          type="range"
          min="3"
          max="10"
          step="0.1"
          value={pace}
          onChange={(e) => setPace(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Run Name</label>
        <input
          type="text"
          placeholder="Morning Run"
          className="border px-2 py-1 w-full rounded"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Date</label>
        <input
          type="date"
          className="border px-2 py-1 w-full rounded"
          defaultValue={new Date().toISOString().split("T")[0]}
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Time</label>
        <input
          type="time"
          className="border px-2 py-1 w-full rounded"
          defaultValue="07:00"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Description</label>
        <textarea
          className="border px-2 py-1 w-full rounded"
          rows={3}
          placeholder="Great morning run through the park..."
        />
      </div>
      <button className="w-full bg-red-500 text-white font-bold py-2 rounded hover:bg-red-600 hover:cursor-pointer">
        Download GPX file
      </button>
    </>
  );
};

export default RunDetailsPanel;
