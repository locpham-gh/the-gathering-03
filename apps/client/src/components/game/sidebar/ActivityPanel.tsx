import { Bell, CalendarDays, Crown } from "lucide-react";
import type { RoomActivityEvent } from "../../../hooks/useMultiplayer";

interface ActivityPanelProps {
  events: RoomActivityEvent[];
}

export function ActivityPanel({ events }: ActivityPanelProps) {
  const grouped = [...events]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 40)
    .reduce(
      (acc, event) => {
        const dayKey = new Date(event.ts).toLocaleDateString();
        if (!acc[dayKey]) acc[dayKey] = [];
        acc[dayKey].push(event);
        return acc;
      },
      {} as Record<string, RoomActivityEvent[]>,
    );

  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-xl p-3">
        <p className="text-sm font-semibold text-slate-800">Recent Activity</p>
        {Object.keys(grouped).length === 0 && (
          <p className="text-xs text-slate-400 mt-2">Chưa có hoạt động realtime.</p>
        )}
        <div className="mt-2 space-y-3">
          {Object.entries(grouped).map(([day, dayEvents]) => (
            <div key={day}>
              <p className="text-[11px] font-semibold text-slate-500 mb-1">{day}</p>
              <ul className="text-xs text-slate-600 space-y-1.5">
                {dayEvents.map((event) => (
                  <li key={event.id} className="flex items-start gap-2">
                    {event.type === "chat" ? (
                      <Bell size={12} className="text-amber-500 mt-0.5" />
                    ) : event.type === "presence" ? (
                      <Crown size={12} className="text-rose-500 mt-0.5" />
                    ) : (
                      <CalendarDays size={12} className="text-sky-500 mt-0.5" />
                    )}
                    <span>
                      <strong>{event.actorName}</strong> {event.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
