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

interface RunDetailsPanelProps {
  pace: number;
  setPace: (v: number) => void;
  paceVariability: number;
  setPaceVariability: (v: number) => void;
  distance: number;
  duration: number;
  elevation: number;
  onDownload: (runDetails: {
    name: string;
    date: Date;
    time: string;
    description: string;
  }) => void;
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

  const handleDownload = () => {
    onDownload({
      name: runName,
      date,
      time,
      description,
    });
  };

  return (
    <>
      <h2 className="text-xl font-bold">Run Details</h2>
      <div className="bg-gray-100 p-4 rounded">
        {/* <h3 className="text-md font-medium mb-2">Run Stats</h3> */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-4">
            <img src={distanceIcon} alt="Distance" className="w-9 h-9" />
            <div>
              Distance
              <br />
              <p className="font-bold text-lg">
                {(distance / 1000).toFixed(2)} km
              </p>{" "}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <img src={durationIcon} alt="Duration" className="w-9 h-9" />
            <div>
              Duration
              <br />
              <p className="font-bold text-lg">
                {Math.floor(duration / 60)}:
                {Math.floor(duration % 60)
                  .toString()
                  .padStart(2, "0")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <img src={elevationIcon} alt="Elevation" className="w-9 h-9" />
            <div>
              Elevation Gain
              <br />
              <p className="font-bold text-lg">{Math.round(elevation)}m</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <img src={paceIcon} alt="Pace" className="w-9 h-9" />
            <div>
              Avg Pace
              <br />
              <p className="font-bold text-lg">{pace.toFixed(2)} min/km</p>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block mb-1 font-medium">Pace</label>
          <p className="text-sm text-right">{pace.toFixed(2)} min/km</p>
        </div>
        <Slider
          value={[pace]}
          onValueChange={(values) => setPace(values[0])}
          max={10}
          min={3}
          step={0.1}
          className="w-full"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block mb-1 font-medium">Pace Variability</label>
          <p className="text-sm text-right">{paceVariability.toFixed(0)}%</p>
        </div>
        <Slider
          value={[paceVariability]}
          onValueChange={(values) => setPaceVariability(values[0])}
          max={50}
          min={0}
          step={1}
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Run Name</label>
        <input
          type="text"
          placeholder="Morning Run"
          value={runName}
          onChange={(e) => setRunName(e.target.value)}
          className="border px-2 py-1 w-full rounded"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Date</label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal border px-2 py-1 rounded"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
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
        <label className="block mb-1 font-medium">Time</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="border px-2 py-1 w-full rounded"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Description</label>
        <textarea
          className="border px-2 py-1 w-full rounded"
          rows={3}
          placeholder="Great morning run through the park..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <button
          className="w-full bg-red-500 text-white font-bold py-2 rounded hover:bg-red-600 hover:cursor-pointer"
          onClick={handleDownload}
        >
          Download GPX file
        </button>
        <p className="text-xs text-gray-600 text-center mt-2">
          By clicking download you accept our{" "}
          <button
            onClick={() => setIsTermsOpen(true)}
            className="text-red-500 underline hover:text-red-600 hover:cursor-pointer"
          >
            T&C
          </button>
        </p>

        <TermsDialog open={isTermsOpen} onOpenChange={setIsTermsOpen} />
      </div>
    </>
  );
};

export default RunDetailsPanel;
