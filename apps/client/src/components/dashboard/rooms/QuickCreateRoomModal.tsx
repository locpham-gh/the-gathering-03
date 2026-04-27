import React, { useState } from "react";
import { X, Plus, Video } from "lucide-react";
import { nanoid } from "nanoid";
import { apiFetch } from "../../../lib/api";
import { useNavigate } from "react-router-dom";

interface QuickCreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  userDisplayName: string;
}

export const QuickCreateRoomModal: React.FC<QuickCreateRoomModalProps> = ({ 
  isOpen, 
  onClose,
  userDisplayName
}) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [selectedMap, setSelectedMap] = useState("office_combined");
  const [loading, setLoading] = useState(false);

  const maps = [
    { id: "office", name: "Modern Office" },
    { id: "classroom", name: "Classroom" },
    { id: "office_combined", name: "Map Office 2" },
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const roomName = name || `${userDisplayName}'s Room`;
    const code = nanoid(10);

    const res = await apiFetch("/api/rooms", {
      method: "POST",
      body: JSON.stringify({ name: roomName, code, map: selectedMap }),
    });

    if (res.success) {
      navigate(`/room/${code}`);
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
                <Video size={20} />
             </div>
             <h3 className="text-xl font-bold">Quick Create Room</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Room Name</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Awesome Office"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-all font-medium"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Map</label>
            <div className="grid grid-cols-1 gap-2">
              {maps.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMap(m.id)}
                  className={`px-4 py-3 rounded-xl border-2 transition-all text-left flex justify-between items-center ${
                    selectedMap === m.id ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-100 bg-slate-50 text-slate-500"
                  }`}
                >
                  <span className="font-bold">{m.name}</span>
                  {selectedMap === m.id && <div className="w-2 h-2 bg-teal-500 rounded-full"></div>}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-black shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Creating..." : <><Plus size={20} /> Create and Join</>}
          </button>
        </form>
      </div>
    </div>
  );
};
