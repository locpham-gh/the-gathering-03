import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { eventsApi, apiFetch } from "../../lib/api";
import { X, Clock, AlignLeft, MapPin, Save, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { Toast } from "../ui/Toast";
import { GuestListManager } from "./events/GuestListManager";

interface RoomOption {
  _id: string;
  name: string;
  code: string;
}

interface ScheduleEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoomId?: string | null;
}

export function ScheduleEventModal({
  isOpen,
  onClose,
  initialRoomId,
}: ScheduleEventModalProps) {
  const { user } = useAuth();

  // Form state
  const [title, setTitle] = useState("New Meeting");
  const [description, setDescription] = useState("");

  const roundToNext30 = () => {
    const d = new Date();
    d.setMinutes(Math.ceil(d.getMinutes() / 30) * 30, 0, 0);
    return d;
  };

  const toLocalISO = (d: Date) =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

  const [startTime, setStartTime] = useState(toLocalISO(roundToNext30()));
  const [endTime, setEndTime] = useState(
    toLocalISO(new Date(roundToNext30().getTime() + 60 * 60 * 1000)),
  );
  const [guests, setGuests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Room selection
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("new");
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Toast
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error") =>
    setToast({ msg, type });

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setTitle("New Meeting");
      setDescription("");
      setStartTime(toLocalISO(roundToNext30()));
      setEndTime(
        toLocalISO(new Date(roundToNext30().getTime() + 60 * 60 * 1000)),
      );
      setGuests([]);
      setSelectedRoomId(initialRoomId || "new");

      if (!initialRoomId || initialRoomId === "new") {
        setLoadingRooms(true);
        apiFetch("/api/rooms")
          .then((res) => {
            if (res.success) setRooms(res.rooms);
          })
          .catch(console.error)
          .finally(() => setLoadingRooms(false));
      }
    }
  }, [isOpen, initialRoomId]);

  if (!isOpen || !user) return null;

  const validate = () => {
    if (!title.trim()) return "Please enter the event title.";
    if (new Date(startTime) >= new Date(endTime))
      return "End time must be after start time.";
    return null;
  };

  const handleSave = async () => {
    if (!user) return;
    const err = validate();
    if (err) {
      showToast(err, "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        roomId: selectedRoomId,
        hostId: user.id,
        title: title.trim(),
        description: description.trim(),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        guestEmails: guests,
      };
      await eventsApi.scheduleMeeting(payload);
      showToast("✅ Scheduled and emails sent successfully!", "success");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast("Error: " + msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const resolvedRoomLabel =
    initialRoomId && initialRoomId !== "new"
      ? `Room: ${initialRoomId}`
      : selectedRoomId === "new"
        ? "Auto-create new room"
        : rooms.find((r) => r._id === selectedRoomId)?.name || "Select room";

  return createPortal(
    <div className="fixed inset-0 z-[999] flex justify-center items-start bg-black/60 p-4 font-sans text-slate-800 overflow-y-auto backdrop-blur-sm">
      <div
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col my-auto border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition"
          >
            <X size={22} />
          </button>

          <p className="text-sm font-bold text-slate-500 tracking-wide">
            Schedule Event
          </p>

          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row flex-1">
          {/* ── Left — Event Details ── */}
          <div className="flex-1 p-8 md:pr-6 border-r border-slate-100 space-y-7">
            {/* Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                placeholder="Event Title"
                className="w-full text-3xl md:text-4xl font-extrabold outline-none border-b-2 border-transparent focus:border-teal-500 pb-2 transition-colors placeholder:text-slate-200 text-slate-900"
              />
            </div>

            {/* Time */}
            <div className="flex items-start gap-4">
              <div className="w-5 flex justify-center pt-3 text-teal-500 shrink-0">
                <Clock size={18} />
              </div>
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Start
                    </label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        const newStart = new Date(e.target.value);
                        if (newStart >= new Date(endTime)) {
                          setEndTime(
                            toLocalISO(
                              new Date(newStart.getTime() + 60 * 60 * 1000),
                            ),
                          );
                        }
                      }}
                      className="text-sm font-medium px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg outline-none border border-slate-200 focus:border-teal-400 transition-colors"
                    />
                  </div>
                  <span className="text-slate-400 text-sm pt-4">→</span>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      End
                    </label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      min={startTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="text-sm font-medium px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg outline-none border border-slate-200 focus:border-teal-400 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Room */}
            <div className="flex items-start gap-4">
              <div className="w-5 flex justify-center pt-2 text-teal-500 shrink-0">
                <MapPin size={18} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="bg-teal-50 border border-teal-100 text-teal-700 p-3 rounded-xl text-sm font-medium">
                  Join via The Gathering Metaverse
                  <p className="text-xs font-normal text-teal-500 mt-0.5">
                    Supports up to 100 people · Proximity video · 2D Breakout rooms
                  </p>
                </div>

                {!initialRoomId ? (
                  <div className="relative">
                    <select
                      value={selectedRoomId}
                      onChange={(e) => setSelectedRoomId(e.target.value)}
                      disabled={loadingRooms}
                      className="w-full appearance-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-teal-400 transition-colors pr-10 disabled:opacity-50"
                    >
                      <option value="new">✨ Auto-create new room</option>
                      {rooms.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.name} ({r.code})
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic px-1">
                    {resolvedRoomLabel}
                  </p>
                )}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Description */}
            <div className="flex items-start gap-4">
              <div className="w-5 flex justify-center pt-2 text-slate-400 shrink-0">
                <AlignLeft size={18} />
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description, agenda or document links..."
                rows={4}
                className="flex-1 text-sm outline-none bg-slate-50 border border-slate-200 rounded-xl p-4 resize-none focus:border-teal-400 focus:bg-white transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* ── Right — Guests ── */}
          <GuestListManager
            user={{ displayName: user.displayName, avatarUrl: user.avatarUrl || "" }}
            guests={guests}
            onGuestsChange={setGuests}
          />
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>,
    document.body
  ) as React.ReactElement;
}
