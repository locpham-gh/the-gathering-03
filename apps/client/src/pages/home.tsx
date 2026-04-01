import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Video,
  Keyboard,
  Trash2,
  ExternalLink,
  Shield,
  Users,
  Settings,
  X,
  LogOut,
} from "lucide-react";
import { nanoid } from "nanoid";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { apiFetch } from "../lib/api";

interface RoomData {
  _id: string;
  name: string;
  code: string;
  ownerId: { _id: string; displayName: string; avatarUrl: string };
  members: string[];
  createdAt: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomCode, setRoomCode] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [creating, setCreating] = useState(false);
  const [managingRoom, setManagingRoom] = useState<RoomData | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    const res = await apiFetch("/api/rooms");
    if (res.success) {
      setRooms(res.rooms);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchRooms();
  }, [user]);

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

  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    const res = await apiFetch(`/api/rooms/${id}`, { method: "DELETE" });
    if (res.success) {
      fetchRooms();
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      navigate(`/room/${roomCode.trim()}`);
    }
  };

  if (!user) return null;

  // Sub-views based on path
  const isRoomsView = location.pathname === "/home/rooms";
  const isProfileView = location.pathname === "/home/profile";

  return (
    <DashboardLayout>
      {isRoomsView ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
              Your Workspaces
            </h3>
            <span className="text-sm text-slate-400 font-medium bg-slate-100 px-3 py-1 rounded-full">
              {rooms.length} Rooms
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {rooms.length === 0 && !loading && (
              <div className="col-span-2 py-20 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
                <p className="text-slate-400">
                  You haven't created or joined any rooms yet.
                </p>
              </div>
            )}

            {rooms.map((room) => {
              const isOwner = room.ownerId?._id === user.id;
              return (
                <div
                  key={room._id}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden"
                >
                  {isOwner && (
                    <div className="absolute top-4 right-4 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded flex items-center gap-1 uppercase tracking-tighter">
                      <Shield size={10} /> Owner
                    </div>
                  )}

                  <div className="mb-4">
                    <h4 className="text-lg font-bold text-slate-800 mb-1">
                      {room.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      {room.code}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Users size={14} className="text-slate-400" />
                      <span>{room.members.length} members</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/room/${room.code}`)}
                      className="flex-1 bg-slate-50 text-slate-700 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                      <ExternalLink size={16} /> Enter
                    </button>
                    {isOwner && (
                      <>
                        <button
                          onClick={() => setManagingRoom(room)}
                          className="p-2 bg-slate-50 hover:bg-slate-200 text-slate-600 rounded-xl transition-all shadow-sm"
                          title="Manage Room"
                        >
                          <Settings size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room._id)}
                          className="p-2 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all shadow-sm"
                          title="Delete Room"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : isProfileView ? (
        <ProfileSettings user={user} />
      ) : (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-700">
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
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-primary/20 transition-all group">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 transition-transform group-hover:scale-110">
                <Video size={28} />
              </div>
              <h3 className="text-xl font-bold bg-white mb-2">
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
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Start Meeting"}
                </button>
              </form>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-slate-300 transition-all group">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-6 transition-transform group-hover:scale-110">
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
                  className="px-6 bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      {managingRoom && (
        <RoomManageModal
          room={managingRoom}
          onClose={() => {
            setManagingRoom(null);
            fetchRooms();
          }}
        />
      )}
    </DashboardLayout>
  );
}

function ProfileSettings({ user }: { user: any }) {
  const { updateUser } = useAuth();
  const [name, setName] = useState(user.displayName);
  const [avatar, setAvatar] = useState(user.avatarUrl);
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify({ displayName: name, avatarUrl: avatar }),
    });

    if (res.success) {
      updateUser(res.user);
      alert("Profile updated successfully!");
    } else {
      alert("Failed to update profile: " + res.error);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-xl animate-in fade-in slide-in-from-right duration-500">
      <h3 className="text-2xl font-bold text-slate-800 mb-8">
        Personal Information
      </h3>
      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-primary transition-all shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500">Avatar URL</label>
          <input
            type="text"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-primary transition-all shadow-sm font-mono text-xs"
          />
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
          <img
            src={avatar}
            className="w-16 h-16 rounded-full border border-white shadow-xl"
            alt="Preview"
          />
          <p className="text-xs text-slate-400 leading-relaxed italic">
            Changes will reflect across all your virtual rooms and activity.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 shadow-xl shadow-primary/20 transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

function RoomManageModal({
  room,
  onClose,
}: {
  room: RoomData;
  onClose: () => void;
}) {
  const [name, setName] = useState(room.name);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    const res = await apiFetch(`/api/rooms/${room._id}/members`);
    if (res.success) {
      // Deduplicate for UI safety (especially for legacy data)
      const unique = Array.from(
        new Map(res.members.map((m: any) => [m._id, m])).values(),
      );
      setMembers(unique);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [room._id]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch(`/api/rooms/${room._id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    if (res.success) {
      alert("Room name updated!");
    } else {
      alert("Error: " + res.error);
    }
    setSaving(false);
  };

  const handleKick = async (userId: string) => {
    if (!confirm("Remove this member from the room?")) return;
    const res = await apiFetch(`/api/rooms/${room._id}/kick`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
    if (res.success) {
      fetchMembers();
    } else {
      alert("Error: " + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">Manage Room</h3>
            <p className="text-slate-400 text-sm font-mono mt-1">{room.code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {/* Settings Section */}
          <section className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Room Settings
            </h4>
            <form onSubmit={handleUpdateName} className="flex gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary transition-all text-sm"
              />
              <button
                type="submit"
                disabled={saving || name === room.name}
                className="px-6 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all disabled:opacity-50"
              >
                Update
              </button>
            </form>
          </section>

          {/* Members Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Members
              </h4>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                {members.length}
              </span>
            </div>

            <div className="space-y-2">
              {loading ? (
                <div className="py-8 text-center text-slate-400 animate-pulse">
                  Loading members...
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member._id}
                    className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {member.displayName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    {member._id !== room.ownerId._id && (
                      <button
                        onClick={() => handleKick(member._id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Kick Member"
                      >
                        <LogOut size={18} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
