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
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  MessageSquare,
  Heart,
  Trash
} from "lucide-react";
import { nanoid } from "nanoid";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { apiFetch, forumApi } from "../lib/api";

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
  const isEventsView = location.pathname === "/home/events";
  const isForumView = location.pathname === "/home/forum";

  return (
    <DashboardLayout>
      {isEventsView ? (
        <EventsManager user={user} />
      ) : isForumView ? (
        <CommunityForum user={user} />
      ) : isRoomsView ? (
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
                      <button
                        onClick={() => navigate(`/schedule/${room._id}`)}
                        className="flex-1 bg-[#e8f0fe] text-[#1a73e8] py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#1a73e8] hover:text-white transition-all shadow-sm"
                      >
                        <Calendar size={16} /> Lên lịch
                      </button>
                    )}
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
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Start Instant"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/schedule/new')}
                    className="w-full bg-[#e8f0fe] text-[#1a73e8] py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1a73e8] hover:text-white transition-all shadow-sm"
                  >
                    <Calendar size={18} /> Schedule
                  </button>
                </div>
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

function EventsManager({ user }: { user: any }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await apiFetch("/api/events");
        if (res.success) {
          setEvents(res.events);
        }
      } catch (err) {
        console.error("Failed to load events", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
          Lịch Họp Của Bạn
        </h3>
        <button 
          onClick={() => navigate('/schedule/new')}
          className="bg-[#1a73e8] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#1557b0] transition-colors flex items-center gap-2"
        >
          <Calendar size={16} /> Lên lịch mới
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 animate-pulse font-medium">Bơm dữ liệu từ hệ thống...</div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
           <p className="text-slate-400">Bạn chưa có lịch họp hoặc sự kiện nào sắp diễn ra.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((evt) => {
            const startDate = new Date(evt.startTime);
            const endDate = new Date(evt.endTime);
            const isHost = evt.hostId?._id === user.id;

            return (
              <div key={evt._id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow group">
                <div className="flex flex-col items-center justify-center w-20 h-20 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                  <span className="text-xs font-bold text-red-500 uppercase">{startDate.toLocaleString('en-US', { month: 'short' })}</span>
                  <span className="text-2xl font-black text-slate-800">{startDate.getDate()}</span>
                </div>
                
                <div className="flex-[2]">
                  <h4 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                    {evt.title}
                    {isHost && <span className="text-[10px] bg-[#e8f0fe] text-[#1967d2] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Host</span>}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-slate-400" />
                      {startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-slate-400" />
                      <span className="font-mono text-xs">{evt.roomId?.code || 'Virtual Room'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden md:flex flex-col items-end mr-4">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Khách mời</span>
                    <span className="text-sm font-medium text-slate-700">{evt.guestEmails?.length || 0} Emails</span>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/room/${evt.roomId?.code}`)}
                    className="flex-1 md:flex-none px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-200 transition-transform active:scale-95 text-sm whitespace-nowrap"
                  >
                    Vào phòng
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}

function CommunityForum({ user }: { user: any }) {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopicContent, setNewTopicContent] = useState("");
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const res = await forumApi.getTopics();
      if (res.success) {
        setTopics(res.topics);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicContent.trim()) return;
    
    // Optimistic UI for topic
    setNewTopicContent("");
    
    const res = await forumApi.createTopic(newTopicContent);
    if (res.success) {
      loadTopics();
    }
  };

  const handleAddReply = async (topicId: string, e: React.FormEvent) => {
    e.preventDefault();
    const content = replyContent[topicId];
    if (!content?.trim()) return;
    
    setReplyContent({ ...replyContent, [topicId]: "" });
    setActiveReplyId(null);
    
    const res = await forumApi.addReply(topicId, content);
    if (res.success) {
      loadTopics();
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm("Are you sure you want to delete this thread?")) return;
    const res = await forumApi.deleteTopic(topicId);
    if (res.success) {
      loadTopics();
    }
  };

  const timeAgo = (dateStr: string) => {
    const min = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (min < 1) return 'now';
    if (min < 60) return `${min}m`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-slate-50/90 backdrop-blur-md z-10 py-4 border-b border-transparent">
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Cộng Đồng</h3>
      </div>

      {/* Composer */}
      <div className="bg-white rounded-t-3xl shadow-sm border border-slate-200 border-b-0 p-6 flex gap-4 relative z-0">
         <img src={user.avatarUrl} className="w-10 h-10 rounded-full object-cover shrink-0 z-10 bg-white" />
         <div className="flex-1">
            <form onSubmit={handleCreateTopic}>
              <p className="font-semibold text-slate-800 text-sm mb-1">{user.displayName}</p>
              <textarea 
                value={newTopicContent}
                onChange={(e) => {
                  setNewTopicContent(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                className="w-full text-slate-800 placeholder:text-slate-400 bg-transparent resize-none outline-none overflow-hidden min-h-[40px] text-sm mt-1"
                placeholder="Bắt đầu một thread..."
                rows={1}
              />
              <div className="flex justify-between items-center mt-3 pt-3">
                 <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors">
                 </button>
                 <button 
                  type="submit" 
                  disabled={!newTopicContent.trim()}
                  className="bg-black text-white px-5 py-1.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
                 >
                   Đăng
                 </button>
              </div>
            </form>
         </div>
      </div>
      
      <div className="h-px w-full bg-slate-200 shadow-sm" />

      {/* Feed */}
      <div className="bg-white rounded-b-3xl shadow-sm border border-slate-200 border-t-0 min-h-[50vh]">
         {loading ? (
            <div className="py-20 text-center text-slate-400 animate-pulse font-medium">Đang tải bảng tin...</div>
         ) : topics.length === 0 ? (
            <div className="py-20 text-center text-slate-400">Chưa có bài viết nào. Hãy là người đầu tiên!</div>
         ) : (
            topics.map((topic, i) => (
              <div key={topic._id} className="group border-b border-slate-100 last:border-b-0 p-6 pt-5 transition-colors hover:bg-slate-50/50">
                <div className="flex gap-4">
                  {/* Left Column Avatar and Thread Line */}
                  <div className="flex flex-col items-center shrink-0 relative">
                     <img src={topic.authorId.avatarUrl} className="w-10 h-10 rounded-full object-cover z-10 bg-white" />
                     {/* Thread vertical line going down - only if there are replies */}
                     {topic.replies.length > 0 && (
                        <div className="w-px bg-slate-200 absolute top-12 bottom-0 z-0 h-[calc(100%+32px)]" />
                     )}
                  </div>
                  
                  {/* Right Column Content */}
                  <div className="flex-1 pb-2">
                     <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-800 text-sm hover:underline cursor-pointer">{topic.authorId.displayName}</span>
                        <div className="flex items-center gap-3">
                           <span className="text-slate-400 text-sm">{timeAgo(topic.createdAt)}</span>
                           {topic.authorId._id === user.id && (
                             <button onClick={() => handleDeleteTopic(topic._id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Trash size={16} />
                             </button>
                           )}
                           <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={18} /></button>
                        </div>
                     </div>
                     <p className="text-slate-800 text-sm mt-1 mb-4 leading-relaxed whitespace-pre-wrap">{topic.title}</p>
                     
                     <div className="flex items-center gap-5 text-slate-500 mt-2">
                        <button className="hover:bg-slate-100 p-1.5 rounded-full transition-colors"><Heart size={18} /></button>
                        <button 
                          onClick={() => setActiveReplyId(activeReplyId === topic._id ? null : topic._id)}
                          className="hover:bg-slate-100 p-1.5 rounded-full transition-colors flex items-center gap-2"
                        >
                           <MessageSquare size={18} />
                           {topic.replies.length > 0 && <span className="text-xs font-semibold">{topic.replies.length}</span>}
                        </button>
                     </div>
                  </div>
                </div>

                {/* Replies Rendering Area */}
                {topic.replies.length > 0 && (
                  <div className="pl-6 pt-4 relative">
                    {topic.replies.map((reply: any, idx: number) => (
                      <div key={reply._id} className="flex gap-4 mt-4 first:mt-0 relative z-10">
                         {/* Reply Avatar Overlapping the line */}
                         <div className="flex flex-col items-center shrink-0">
                           <img src={reply.authorId?.avatarUrl || "https://api.dicebear.com/8.x/notionists/svg?seed=fallback"} className="w-8 h-8 rounded-full border-2 border-white object-cover bg-slate-100" />
                         </div>
                         <div className="flex-1 pb-1">
                           <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 text-sm hover:underline cursor-pointer">{reply.authorId?.displayName || "Unknown User"}</span>
                              <span className="text-slate-400 text-xs">{timeAgo(reply.createdAt)}</span>
                           </div>
                           <p className="text-slate-600 text-sm mt-0.5 leading-relaxed">{reply.content}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input Form (Appears when active) */}
                {activeReplyId === topic._id && (
                  <div className="flex gap-4 mt-6 items-start relative z-10 relative">
                     <img src={user.avatarUrl} className="w-8 h-8 rounded-full ml-[4px] border border-white" />
                     <form onSubmit={(e) => handleAddReply(topic._id, e)} className="flex-1 flex gap-2">
                        <input
                          autoFocus
                          value={replyContent[topic._id] || ""}
                          onChange={(e) => setReplyContent({...replyContent, [topic._id]: e.target.value})}
                          placeholder={`Trả lời ${topic.authorId.displayName}...`}
                          className="flex-1 text-sm bg-slate-100 px-4 py-2 rounded-full outline-none focus:bg-slate-200 transition-colors text-slate-800 placeholder:text-slate-500"
                        />
                        <button 
                          type="submit" 
                          disabled={!replyContent[topic._id]?.trim()}
                          className="bg-black text-white px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
                        >
                          Gửi
                        </button>
                     </form>
                  </div>
                )}
              </div>
            ))
         )}
      </div>
    </div>
  );
}
