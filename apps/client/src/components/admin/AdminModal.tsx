import { useState, useEffect, useCallback } from "react";
import { 
  X, 
  LayoutDashboard, 
  Users, 
  Map, 
  MessageSquare, 
  BookOpen, 
  UserPlus, 
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserX
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiFetch } from "../../lib/api";
import { WhitelistManager } from "./WhitelistManager";
import { LibraryManager } from "./LibraryManager";
import { AdminDataTable } from "./AdminDataTable";
import { StatCard } from "./StatCard";
import type { TabType, AdminStats, PaginationInfo, AdminDataItem } from "../../types/admin";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdminDataItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    if (activeTab === "whitelist" || activeTab === "library") return; 
    
    setLoading(true);
    let endpoint = "";
    
    if (activeTab === "dashboard") {
      try {
        const res = await apiFetch("/api/admin/stats");
        if (res.success) setStats(res.stats);
      } catch {
        console.error("Failed to fetch stats");
      }
      setLoading(false);
      setLastRefreshed(new Date());
      return;
    }

    if (activeTab === "users") endpoint = `/api/admin/users?search=${searchTerm}&page=${page}&limit=10`;
    else if (activeTab === "rooms") endpoint = `/api/admin/rooms?page=${page}&limit=10`;
    else if (activeTab === "forum") endpoint = `/api/admin/forum/topics?page=${page}&limit=10`;

    try {
      const res = await apiFetch(endpoint);
      if (res.success) {
        setData(activeTab === "users" ? res.users : activeTab === "rooms" ? res.rooms : res.topics);
        setPagination(res.pagination);
      }
    } catch {
      console.error("Failed to fetch data");
    }
    setLoading(false);
    setLastRefreshed(new Date());
  }, [activeTab, searchTerm, page]);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm]);

  if (!isOpen || !user || user.role !== "admin") return null;

  const handleUpdateUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: currentStatus === "active" ? "banned" : "active" })
      });
      if (res.success) fetchData();
    } catch {
      alert("Failed to update status");
    }
  };

  const handleUpdateUserRole = async (userId: string, currentRole: string) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: currentRole === "user" ? "admin" : "user" })
      });
      if (res.success) fetchData();
    } catch {
      alert("Failed to update role");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Confirm expunge operation? This action is irreversible.")) return;
    let endpoint = "";
    if (activeTab === "rooms") endpoint = `/api/admin/rooms/${id}`;
    else if (activeTab === "forum") endpoint = `/api/admin/forum/topics/${id}`;
    try {
      const res = await apiFetch(endpoint, { method: "DELETE" });
      if (res.success) fetchData();
    } catch {
      alert("Failed to delete item");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-7xl h-[90vh] bg-slate-50 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/20">
        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Mainframe Access</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Administrative Control Panel v2.4</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 mr-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System Live</span>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-900 transition-all shadow-sm"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* MINI SIDEBAR */}
          <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col p-4 gap-2">
            {[
              { id: "dashboard", label: "Stats", icon: LayoutDashboard },
              { id: "users", label: "Entities", icon: Users },
              { id: "rooms", label: "Matrices", icon: Map },
              { id: "forum", label: "Archives", icon: MessageSquare },
              { id: "library", label: "Resources", icon: BookOpen },
              { id: "whitelist", label: "Auth", icon: UserPlus },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${activeTab === item.id ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"}`}
              >
                <item.icon size={20} />
                <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              </button>
            ))}

            <button 
              onClick={fetchData}
              className="mt-auto flex items-center gap-4 p-4 rounded-2xl text-slate-400 hover:bg-slate-50 transition-all"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
              <span className="hidden lg:block text-[9px] font-black uppercase tracking-widest">Refresh Feed</span>
            </button>
          </aside>

          {/* MAIN MODAL CONTENT */}
          <main className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-10 custom-scrollbar">
            {activeTab === "dashboard" && stats ? (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard label="Entities" value={stats.totalUsers} icon={Users} color="bg-indigo-600" />
                  <StatCard label="Matrices" value={stats.totalRooms} icon={Map} color="bg-emerald-600" />
                  <StatCard label="Clusters" value={stats.totalTopics} icon={MessageSquare} color="bg-orange-600" />
                  <StatCard label="Purged" value={stats.bannedUsers} icon={UserX} color="bg-rose-600" />
                </div>

                {/* Community Engagement Area */}
                <div className="bg-white rounded-[3rem] border border-slate-200/60 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-end">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">User Presence Density</h3>
                            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Active participants over the last 24 hours</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Users</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 relative bg-slate-50/10">
                        {/* Realistic Activity Chart */}
                        <svg className="w-full h-64 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 400">
                            <defs>
                                <linearGradient id="presenceGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            {/* Time markers */}
                            {[0, 200, 400, 600, 800, 1000].map(x => (
                                <line key={x} x1={x} y1="0" x2={x} y2="400" stroke="#f1f5f9" strokeWidth="1" />
                            ))}
                            {/* The Area */}
                            <path 
                                d="M 0 400 L 0 380 L 100 390 L 200 350 L 300 280 L 400 150 L 500 120 L 600 180 L 700 250 L 800 320 L 900 360 L 1000 380 L 1000 400 Z" 
                                fill="url(#presenceGradient)"
                                className="animate-in fade-in duration-700"
                            />
                            {/* The Line */}
                            <path 
                                d="M 0 380 L 100 390 L 200 350 L 300 280 L 400 150 L 500 120 L 600 180 L 700 250 L 800 320 L 900 360 L 1000 380" 
                                fill="none" 
                                stroke="#6366f1" 
                                strokeWidth="3" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            />
                        </svg>
                        
                        <div className="flex justify-between mt-4 px-2">
                            {["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"].map(t => (
                                <span key={t} className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{t}</span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-8 border-t border-slate-100 grid grid-cols-3 gap-8">
                        {[
                          { label: "Retention Rate", value: "84%", detail: "Return Users", color: "bg-indigo-500" },
                          { label: "Engagement", value: "12.5m", detail: "Avg. Session", color: "bg-emerald-500" },
                          { label: "Weekly Growth", value: "+12.4%", detail: "New Entities", color: "bg-orange-500" },
                        ].map((item, i) => (
                          <div key={i} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col gap-1 transition-transform hover:-translate-y-1">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</span>
                             <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-800 tracking-tight">{item.value}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{item.detail}</span>
                             </div>
                             <div className="w-full h-1 bg-white rounded-full mt-2 overflow-hidden">
                                <div className={`h-full ${item.color} w-2/3 rounded-full opacity-60`} />
                             </div>
                          </div>
                        ))}
                    </div>
                </div>
              </div>
            ) : null}

            {activeTab === "whitelist" && (
              <WhitelistManager 
                currentUserId={user.id}
                currentUserEmail={user.email}
                whitelistedByEmail={user.whitelistedByEmail}
              />
            )}
            
            {activeTab === "library" && <LibraryManager />}

            {activeTab !== "dashboard" && activeTab !== "whitelist" && activeTab !== "library" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                    {activeTab === "users" ? <Users size={18} /> : activeTab === "rooms" ? <Map size={18} /> : <MessageSquare size={18} />}
                    {activeTab} Management
                  </h3>
                  
                  <div className="flex items-center gap-4">
                    {activeTab === "users" && (
                      <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input 
                          type="text" 
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-[10px] w-48 transition-all"
                        />
                      </div>
                    )}
                    
                    {pagination && pagination.totalPages > 1 && (
                      <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 p-1">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ChevronLeft size={16} /></button>
                        <span className="px-2 text-[10px] font-black text-slate-600">{page}/{pagination.totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ChevronRight size={16} /></button>
                      </div>
                    )}
                  </div>
                </div>

                <AdminDataTable 
                  activeTab={activeTab as TabType}
                  data={data}
                  loading={loading}
                  pagination={pagination}
                  onUpdateRole={handleUpdateUserRole}
                  onUpdateStatus={handleUpdateUserStatus}
                  onDelete={handleDeleteItem}
                  currentUserId={user.id}
                  currentUserEmail={user.email}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
