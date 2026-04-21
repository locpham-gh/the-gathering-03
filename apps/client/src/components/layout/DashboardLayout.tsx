import React, { useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { getDefaultAvatarByGender, resolveAvatarUrl } from "../../lib/profile";
import { apiFetch } from "../../lib/api";
import { nanoid } from "nanoid";
import { MAP_OPTIONS, type MapVersion } from "../game/config";
import { 
  Home, 
  Layout, 
  Settings, 
  LogOut, 
  PlusCircle,
  ChevronRight,
  Calendar,
  MessageCircle,
  X
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [mapVersion, setMapVersion] = useState<MapVersion>("v3");
  const [createError, setCreateError] = useState<string | null>(null);

  const menuItems = [
    { name: "Overview", path: "/home", icon: <Home size={20} /> },
    { name: "My Rooms", path: "/home/rooms", icon: <Layout size={20} /> },
    { name: "My Events", path: "/home/events", icon: <Calendar size={20} /> },
    { name: "Community", path: "/home/forum", icon: <MessageCircle size={20} /> },
    { name: "Profile", path: "/home/profile", icon: <Settings size={20} /> },
  ];

  if (!user) return null;
  const avatarUrl = resolveAvatarUrl(user.avatarUrl, user.gender);
  const fallbackAvatar = getDefaultAvatarByGender(user.gender);
  const previewCode = useMemo(() => nanoid(10), [createOpen]);

  const handleCreateRoom = async () => {
    if (creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const code = nanoid(10);
      const name = roomName.trim() || `${user.displayName}'s Room`;
      const res = await apiFetch("/api/rooms", {
        method: "POST",
        body: JSON.stringify({ name, code, mapVersion }),
      });
      if (!res?.success) {
        setCreateError(res?.error || "Create room failed.");
        return;
      }
      setCreateOpen(false);
      setRoomName("");
      setMapVersion("v3");
      navigate(`/room/${code}`);
    } catch (error: any) {
      setCreateError(error?.message || "Create room failed.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">G</div>
            <span className="text-xl font-bold tracking-tight text-slate-800">The Gathering</span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? "bg-primary/10 text-primary font-bold shadow-sm" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight size={16} />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
             <div className="flex items-center gap-3">
                <img 
                  src={avatarUrl}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border border-white shadow-sm object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackAvatar;
                  }}
                />
                <div className="overflow-hidden">
                   <p className="text-sm font-bold truncate">{user.displayName}</p>
                   <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
             </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10">
           <h2 className="text-lg font-bold text-slate-700">
             {menuItems.find(i => i.path === location.pathname)?.name || "Dashboard"}
           </h2>
           <button 
             onClick={() => setCreateOpen(true)}
             className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-teal-700 transition-all shadow-sm"
           >
             <PlusCircle size={18} />
             <span>Create Room</span>
           </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative">
           {/* Background Decorations */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none -z-10"></div>
           
           <div className="relative z-0 max-w-5xl mx-auto">
              {children}
           </div>
        </div>
      </main>

      {createOpen && (
        <div className="fixed inset-0 z-100 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Create Room</h3>
              <button
                onClick={() => setCreateOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Room code will be auto-generated when creating.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs text-slate-500 font-medium">Room name (optional)</span>
                <input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder={`${user.displayName}'s Room`}
                  className="mt-2 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-500 font-medium">Room code (preview)</span>
                <input
                  readOnly
                  value={previewCode}
                  className="mt-2 w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono text-slate-600"
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-500 font-medium">Map</span>
                <select
                  value={mapVersion}
                  onChange={(e) => setMapVersion(e.target.value as MapVersion)}
                  className="mt-2 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary text-sm"
                >
                  {MAP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              {createError && (
                <p className="text-xs rounded-lg bg-red-50 text-red-600 px-3 py-2">{createError}</p>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setCreateOpen(false)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={creating}
                className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create & Join"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
