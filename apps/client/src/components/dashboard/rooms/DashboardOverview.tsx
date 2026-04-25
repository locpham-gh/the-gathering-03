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
  const [selectedMap, setSelectedMap] = useState("office");
  const [creating, setCreating] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const maps = [
    { id: "office", name: "Modern Office", image: "/maps/office_preview.png" },
    { id: "classroom", name: "Classroom", image: "/maps/classroom_preview.png" },
    { id: "office_2", name: "Office (Floor 1)", image: "/maps/office_2_preview.png" },
    { id: "conference", name: "Conference (Floor 2)", image: "/maps/conference_preview.png" },
  ];

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const name = newRoomName || `${user?.displayName}'s Room`;
    const code = nanoid(10);

    const res = await apiFetch("/api/rooms", {
      method: "POST",
      body: JSON.stringify({ name, code, map: selectedMap }),
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
            Create New Room
          </h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Start a new session with a custom map and name.
          </p>

          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Room Name</label>
              <input
                type="text"
                placeholder="E.g. Morning Standup"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary text-sm transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Map</label>
              <div className="grid grid-cols-2 gap-3">
                {maps.map((map) => (
                  <button
                    key={map.id}
                    type="button"
                    onClick={() => setSelectedMap(map.id)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      selectedMap === map.id
                        ? "border-primary bg-teal-50 text-primary"
                        : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                    }`}
                  >
                    <div className="font-bold text-sm">{map.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-all shadow-md shadow-teal-100 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Room"}
              </button>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(true)}
                className="px-4 bg-teal-50 text-teal-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-100 transition-all"
              >
                <Calendar size={20} />
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
