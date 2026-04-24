import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { ScheduleEventModal } from "./ScheduleEventModal";
import type { EventItem } from "./events/types";
import { isUpcoming } from "./events/utils";
import { EventCard } from "./events/EventCard";
import { EventDetailModal } from "./events/EventDetailModal";
import { EventsEmptyState } from "./events/EventsEmptyState";

export function EventsManager({
  user,
  initialRoomId,
}: {
  user: { id: string };
  initialRoomId?: string;
}) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/events");
      if (res.success) {
        // Sort ascending by startTime
        const sorted = [...res.events].sort(
          (a: EventItem, b: EventItem) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        );
        setEvents(sorted);
      }
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const upcomingEvents = events.filter((e) => isUpcoming(e.startTime));
  const pastEvents = events.filter((e) => !isUpcoming(e.startTime)).reverse();
  const displayedEvents = tab === "upcoming" ? upcomingEvents : pastEvents;

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.success) {
        setSelectedEvent(null);
        fetchEvents();
      } else {
        alert("Error: " + res.error);
      }
    } catch (err) {
      alert("Error while deleting: " + String(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 relative">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
            Event Schedule
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            {upcomingEvents.length} upcoming · {pastEvents.length} past
          </p>
        </div>
        <button
          onClick={() => setIsScheduleModalOpen(true)}
          className="bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-teal-700 transition-all shadow-sm"
        >
          <Plus size={16} /> Schedule Event
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === t
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "upcoming" ? "Upcoming" : "Past"}
            <span
              className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                tab === t
                  ? "bg-teal-100 text-teal-700"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {t === "upcoming" ? upcomingEvents.length : pastEvents.length}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-slate-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : displayedEvents.length === 0 ? (
        <EventsEmptyState
          tab={tab}
          onSchedule={() => setIsScheduleModalOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {displayedEvents.map((evt) => (
            <EventCard
              key={evt._id}
              event={evt}
              userId={user.id}
              onClick={() => setSelectedEvent(evt)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          userId={user.id}
          onClose={() => setSelectedEvent(null)}
          onDelete={handleDelete}
        />
      )}

      {/* Schedule Modal */}
      <ScheduleEventModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          fetchEvents();
        }}
        initialRoomId={initialRoomId}
      />

      {deleting && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-medium text-slate-700">Deleting...</span>
          </div>
        </div>
      )}
    </div>
  );
}
