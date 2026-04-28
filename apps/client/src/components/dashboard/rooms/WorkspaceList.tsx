import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ExternalLink, Calendar, Settings, Trash2, Shield, Map } from "lucide-react";
import { apiFetch } from "../../../lib/api";
import { ScheduleEventModal } from "../ScheduleEventModal";
import { RoomManageModal } from "./RoomManageModal";
import type { RoomData } from "./types";

export function WorkspaceList({
  user,
  rooms,
  loading,
  fetchRooms,
}: {
  user: { id: string };
  rooms: RoomData[];
  loading: boolean;
  fetchRooms: () => void;
}) {
  const navigate = useNavigate();
  const [managingRoom, setManagingRoom] = useState<RoomData | null>(null);
  const [scheduleRoomId, setScheduleRoomId] = useState<string | null>(null);

  const getMapImage = (mapType: string = "office") => {
    switch (mapType.toLowerCase().replace(/[\s_]/g, "")) {
      case "classroom":
      case "school":
        return "/school_img.png";
      case "officecombined":
      case "office2":
      case "merged":
        return "/office_2_img.png";
      case "cafe":
      case "café":
      case "lounge":
        return "/cafe_img.png";
      case "office":
      default:
        return "/office_img.png";
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    const res = await apiFetch(`/api/rooms/${id}`, { method: "DELETE" });
    if (res.success) {
      fetchRooms();
    }
  };

  const [activeTab, setActiveTab] = useState<"all" | "owned" | "joined">("all");

  const filteredRooms = rooms.filter((room) => {
    const isOwner = (typeof room.ownerId === 'string' ? room.ownerId : room.ownerId?._id) === user.id;
    if (activeTab === "owned") return isOwner;
    if (activeTab === "joined") return !isOwner;
    return true;
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
              Your Workspaces
            </h3>
            <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2.5 py-1 rounded-full">
              {rooms.length} Total
            </span>
          </div>
          
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(["all", "owned", "joined"] as const).map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {filteredRooms.length === 0 && !loading && (
            <div className="col-span-2 py-20 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
              <p className="text-slate-400">
                No rooms found in this category.
              </p>
            </div>
          )}

          {filteredRooms.map((room) => {
            const isOwner = (typeof room.ownerId === 'string' ? room.ownerId : room.ownerId?._id) === user.id;
            return (
              <div
                key={room._id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-teal-500/50 transition-all group relative overflow-hidden flex flex-col"
              >
                {/* Map Thumbnail */}
                <div className="h-40 w-full bg-slate-100 relative overflow-hidden border-b border-slate-100 shrink-0">
                  <img 
                    src={getMapImage(room.map)} 
                    alt={`${room.map || 'default'} map`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    {isOwner ? (
                      <div className="text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded flex items-center gap-1 uppercase tracking-tighter">
                        <Shield size={10} className="text-teal-400" /> Owner
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-white bg-blue-600/80 backdrop-blur-md px-2 py-1 rounded flex items-center gap-1 uppercase tracking-tighter">
                        <Users size={10} /> Member
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="mb-4">
                    <h4 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1">
                      {room.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      {room.code}
                    </p>
                  </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Users size={14} className="text-slate-400" />
                    <span>{room.members?.length || 0} members</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium capitalize">
                    <Map size={14} className="text-slate-400" />
                    <span>{room.map || "office"} map</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/room/${room.code}`)}
                    className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-teal-600 transition-all shadow-sm"
                  >
                    <ExternalLink size={16} /> Enter
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => setScheduleRoomId(room._id)}
                      className="flex-1 bg-teal-50 text-teal-700 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-teal-100 hover:text-teal-800 transition-all shadow-sm"
                    >
                      <Calendar size={16} /> Lên lịch
                    </button>
                  )}
                  {isOwner && (
                    <>
                      <button
                        onClick={() => setManagingRoom(room)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-all border border-slate-200 shadow-sm"
                        title="Manage Room"
                      >
                        <Settings size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room._id)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all shadow-sm"
                        title="Delete Room"
                      >
                        <Trash2 size={20} />
                      </button>
                    </>
                  )}
                </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ScheduleEventModal 
        isOpen={!!scheduleRoomId}
        onClose={() => setScheduleRoomId(null)}
        initialRoomId={scheduleRoomId}
      />

      {managingRoom && (
        <RoomManageModal
          room={managingRoom}
          onClose={() => {
            setManagingRoom(null);
            fetchRooms();
          }}
        />
      )}
    </>
  );
}
