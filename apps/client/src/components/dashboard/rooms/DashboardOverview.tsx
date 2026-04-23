import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Keyboard, Calendar } from "lucide-react";
import { nanoid } from "nanoid";
import { apiFetch } from "../../../lib/api";
import { ScheduleEventModal } from "../ScheduleEventModal";
import type { RoomData } from "./types";

export function DashboardOverview({
  user,
  fetchRooms,
}: {
  user: { displayName: string };
  rooms: RoomData[];
  fetchRooms: () => void;
}) {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [creating, setCreating] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const name = newRoomName || `${user?.displayName}'s Room`;
    const code = nanoid(10);

    const res = await apiFetch("/api/rooms", {
      method: "POST",
      body: JSON.stringify({ name, code }),
    });

    if (res.success) {
      setNewRoomName("");
      fetchRooms();
      navigate(`/room/${code}`);
    }
    setCreating(false);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      navigate(`/room/${roomCode.trim()}`);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-700 relative">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Welcome back,{" "}
          <span className="text-primary italic">{user.displayName}</span>
        </h1>
        <p className="text-slate-500 font-medium">
          What's on your agenda today?
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all group">
          <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 mb-6 transition-transform group-hover:scale-105">
            <Video size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Create New Meeting
          </h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Start an instant session with a professional virtual room code.
          </p>

          <form onSubmit={handleCreateRoom} className="space-y-3">
            <input
              type="text"
              placeholder="Room Name (Optional)"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary text-sm transition-all"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-primary text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50"
              >
                {creating ? "Creating..." : "Start Instant"}
              </button>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(true)}
                className="w-full bg-teal-50 text-teal-700 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-teal-100 transition-all shadow-sm"
              >
                <Calendar size={18} /> Schedule
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all group">
          <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 mb-6 transition-transform group-hover:scale-105">
            <Keyboard size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Join with Code
          </h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Have a code from a colleague? Enter it below to jump in.
          </p>

          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              placeholder="abc-defg-hij"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary text-sm transition-all text-center font-mono tracking-widest"
            />
            <button
              type="submit"
              disabled={!roomCode.trim()}
              className="px-6 bg-slate-800 text-white py-2.5 rounded-lg font-bold hover:bg-slate-900 transition-all shadow-sm disabled:opacity-50"
            >
              Join
            </button>
          </form>
        </div>
      </div>

      <ScheduleEventModal 
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
      />
    </div>
  );
}
