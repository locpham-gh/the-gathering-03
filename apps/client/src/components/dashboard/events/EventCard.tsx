import { Clock, MapPin, Users, ChevronRight } from "lucide-react";
import type { EventItem } from "./types";
import { formatTime, getDuration, isUpcoming } from "./utils";

interface EventCardProps {
  event: EventItem;
  userId: string;
  onClick: () => void;
}

export function EventCard({ event, userId, onClick }: EventCardProps) {
  const isHost = event.hostId?._id === userId;
  const startDate = new Date(event.startTime);
  const upcoming = isUpcoming(event.startTime);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white border rounded-xl p-5 flex items-center gap-5 hover:shadow-md transition-all group ${
        upcoming
          ? "border-slate-200 hover:border-teal-200"
          : "border-slate-100 opacity-60 hover:opacity-80"
      }`}
    >
      {/* Date Block */}
      <div
        className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg border shrink-0 ${
          upcoming
            ? "bg-teal-50 border-teal-100 text-teal-700"
            : "bg-slate-50 border-slate-200 text-slate-400"
        }`}
      >
        <span className="text-[10px] font-bold uppercase">
          {startDate.toLocaleString("en-US", { month: "short" })}
        </span>
        <span className="text-2xl font-black leading-none">
          {startDate.getDate()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-slate-800 truncate">{event.title}</h4>
          {isHost && (
            <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0">
              Host
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1 font-sans">
            <Clock size={11} />
            {formatTime(event.startTime)} — {formatTime(event.endTime)}
            <span className="text-slate-400 ml-1">
              ({getDuration(event.startTime, event.endTime)})
            </span>
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            <span className="font-mono">{event.roomId?.code || "—"}</span>
          </span>
          {event.guestEmails?.length > 0 && (
            <span className="flex items-center gap-1">
              <Users size={11} />
              {event.guestEmails.length} guests
            </span>
          )}
        </div>
      </div>

      <ChevronRight
        size={18}
        className="text-slate-300 group-hover:text-teal-400 transition-colors shrink-0"
      />
    </button>
  );
}
