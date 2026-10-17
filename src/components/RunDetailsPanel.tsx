import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import distanceIcon from "../assets/distance.svg";
import durationIcon from "../assets/duration.svg";
import elevationIcon from "../assets/elevation.svg";
import paceIcon from "../assets/pace.svg";
import TermsDialog from "./TermsDialog";
import { trackEvent } from "../lib/gtag";

interface RunDetailsPanelProps {
  pace: number;
  setPace: (v: number) => void;
  paceVariability: number;
  setPaceVariability: (v: number) => void;
  distance: number;
  duration: number; // in minutes
  elevation: number;
  onDownload: (runDetails: {
    name: string;
    date: Date;
    time: string;
    description: string;
  }) => void;
}

function formatDuration(durationMinutes: number): string {
  if (!durationMinutes || durationMinutes <= 0) return "00:00";
  const totalSeconds = Math.round(durationMinutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

const RunDetailsPanel: React.FC<RunDetailsPanelProps> = ({
  pace,
  setPace,
  paceVariability,
  setPaceVariability,
  distance,
  duration,
  elevation,
  onDownload,
}) => {
  const [date, setDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [runName, setRunName] = useState("Morning Run");
  const [time, setTime] = useState("07:00");
  const [description, setDescription] = useState("");
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const isRouteReady = distance > 0;

  const handleDownload = () => {
    if (!isRouteReady) return;
    trackEvent("download_gpx", { run_name: runName });
    onDownload({
      name: runName.trim() || "Morning Run",
      date,
      time,
      description,
    });
  };

  return (
    <>
      <h2 className="text-xl font-bold text-gray-900">Run Details</h2>
      <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <img src={distanceIcon} alt="Distance" className="w-8 h-8 shrink-0" />
            <div>
              <span className="text-xs text-gray-500 font-medium">Distance</span>
              <p className="font-bold text-base text-gray-900">
                {(distance / 1000).toFixed(2)} km
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <img src={durationIcon} alt="Duration" className="w-8 h-8 shrink-0" />
            <div>
              <span className="text-xs text-gray-500 font-medium">Duration</span>
              <p className="font-bold text-base text-gray-900">
                {formatDuration(duration)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <img src={elevationIcon} alt="Elevation" className="w-8 h-8 shrink-0" />
            <div>
              <span className="text-xs text-gray-500 font-medium">Elevation Gain</span>
              <p className="font-bold text-base text-gray-900">
                {Math.round(elevation)}m
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <img src={paceIcon} alt="Pace" className="w-8 h-8 shrink-0" />
            <div>
              <span className="text-xs text-gray-500 font-medium">Avg Pace</span>
              <p className="font-bold text-base text-gray-900">
                {pace.toFixed(2)} min/km
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm font-medium text-gray-700">
          <label htmlFor="pace-slider">Target Pace</label>
          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
            {pace.toFixed(2)} min/km
          </span>
        </div>
        <Slider
          id="pace-slider"
          value={[pace]}
          onValueChange={(values) => setPace(values[0])}
          max={10}
          min={3}
          step={0.1}
          className="w-full pt-1"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm font-medium text-gray-700">
          <label htmlFor="variability-slider">Pace Variability</label>
          <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
            {paceVariability.toFixed(0)}%
          </span>
        </div>
        <Slider
          id="variability-slider"
          value={[paceVariability]}
          onValueChange={(values) => setPaceVariability(values[0])}
          max={50}
          min={0}
          step={1}
          className="w-full pt-1"
        />
      </div>

      <div>
        <label htmlFor="run-name-input" className="block text-xs font-medium text-gray-700 mb-1">
          Run Name
        </label>
        <input
          id="run-name-input"
          type="text"
          placeholder="Morning Run"
          value={runName}
          onChange={(e) => setRunName(e.target.value)}
          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Date
          </label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal border-gray-200 px-3 py-1.5 h-auto text-xs rounded-lg hover:bg-gray-50"
              >
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                {date ? format(date, "MMM dd, yyyy") : <span>Pick date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(selectedDate) => {
                  setDate(selectedDate || new Date());
                  setIsCalendarOpen(false);
                }}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label htmlFor="time-input" className="block text-xs font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <input
            id="time-input"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description-input" className="block text-xs font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          id="description-input"
          rows={2}
          placeholder="Great morning run through the park..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all resize-none"
        />
      </div>

      <div className="pt-2">
        <button
          disabled={!isRouteReady}
          className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all shadow-sm ${
            isRouteReady
              ? "bg-red-500 hover:bg-red-600 text-white cursor-pointer hover:shadow"
              : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
          }`}
          onClick={handleDownload}
        >
          {isRouteReady ? "Download GPX file" : "Plot Route to Download"}
        </button>
        <p className="text-[11px] text-gray-500 text-center mt-2">
          By downloading you accept our{" "}
          <button
            type="button"
            onClick={() => setIsTermsOpen(true)}
            className="text-red-500 underline hover:text-red-600 cursor-pointer"
          >
            Terms & Conditions
          </button>
        </p>

        <TermsDialog open={isTermsOpen} onOpenChange={setIsTermsOpen} />
      </div>
    </>
  );
};

export default RunDetailsPanel;
