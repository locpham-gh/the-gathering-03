import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { 
  Users, 
  Map, 
  MessageSquare, 
  Search, 
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  UserPlus,
  UserX,
  RefreshCw,
  BookOpen
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { WhitelistManager } from "../components/admin/WhitelistManager";
import { StatCard } from "../components/admin/StatCard";
import { AdminDataTable } from "../components/admin/AdminDataTable";
import { LibraryManager } from "../components/admin/LibraryManager";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import type { TabType, AdminStats, PaginationInfo, AdminDataItem } from "../types/admin";

export default function AdminPage() {
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
    Promise.resolve().then(() => fetchData());
  }, [fetchData]);

  useEffect(() => {
    Promise.resolve().then(() => setPage(1));
  }, [activeTab, searchTerm]);

  if (!user || user.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

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
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* SIDEBAR */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-50">
        <div className="p-8">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl">G</div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Gathering <span className="text-indigo-600">OS</span></h1>
            </div>

            <nav className="space-y-2">
                {[
                    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
                    { id: "users", label: "Entities Directory", icon: Users },
                    { id: "rooms", label: "Matrix Registry", icon: Map },
                    { id: "forum", label: "Archive Clusters", icon: MessageSquare },
                    { id: "library", label: "Resource Vault", icon: BookOpen },
                    { id: "whitelist", label: "Access Control", icon: UserPlus },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as TabType)}
                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${activeTab === item.id ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"}`}
                    >
                        <item.icon size={20} className={`${activeTab === item.id ? "text-indigo-400" : "group-hover:text-indigo-500"}`} />
                        <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>

        <div className="mt-auto p-8 border-t border-slate-100">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs uppercase">
                    {user.displayName.substring(0, 2)}
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{user.displayName}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Admin</span>
                </div>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-24 flex items-center justify-between px-10 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 rounded-2xl text-white">
                    {activeTab === "dashboard" ? <LayoutDashboard size={24} /> : activeTab === "users" ? <Users size={24} /> : <BookOpen size={24} />}
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{activeTab}</h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Mainframe Node v2.4.0</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Sync: Active</span>
                </div>
                <button 
                    onClick={fetchData}
                    className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                >
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {activeTab === "dashboard" && stats ? (
            <div className="space-y-10">
                {/* Summary Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard label="Entities" value={stats.totalUsers} icon={Users} color="bg-indigo-600" />
                    <StatCard label="Matrices" value={stats.totalRooms} icon={Map} color="bg-emerald-600" />
                    <StatCard label="Clusters" value={stats.totalTopics} icon={MessageSquare} color="bg-orange-600" />
                    <StatCard label="Purged" value={stats.bannedUsers} icon={UserX} color="bg-rose-600" />
                </div>

                {/* Data Visualization Area */}
                <div className="bg-white rounded-[3rem] border border-slate-200/60 shadow-2xl shadow-slate-200/30 overflow-hidden">
                    <div className="p-10 border-b border-slate-100 flex justify-between items-end">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">System Throughput</h3>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Historical engagement over 30 cycles</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {["1W", "1M", "6M", "1Y", "ALL"].map(t => (
                                <button key={t} className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${t === "ALL" ? "bg-slate-900 text-white shadow-lg" : "text-slate-300 hover:text-slate-600"}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-10 relative">
                        {/* Custom SVG Chart */}
                        <svg className="w-full h-80 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 400">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            {/* Grid Lines */}
                            {[0, 100, 200, 300, 400].map(y => (
                                <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#f1f5f9" strokeWidth="2" />
                            ))}
                            {/* The Area */}
                            <path 
                                d="M 0 400 L 0 350 L 100 320 L 200 380 L 300 150 L 400 120 L 500 250 L 600 280 L 700 100 L 800 80 L 900 120 L 1000 50 L 1000 400 Z" 
                                fill="url(#chartGradient)"
                                className="animate-in fade-in duration-1000"
                            />
                            {/* The Line */}
                            <path 
                                d="M 0 350 L 100 320 L 200 380 L 300 150 L 400 120 L 500 250 L 600 280 L 700 100 L 800 80 L 900 120 L 1000 50" 
                                fill="none" 
                                stroke="#6366f1" 
                                strokeWidth="4" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                className="animate-in slide-in-from-left duration-1000"
                            />
                            {/* Dots */}
                            {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((x, i) => {
                                const y = [350, 320, 380, 150, 120, 250, 280, 100, 80, 120, 50][i];
                                return (
                                    <circle key={i} cx={x} cy={y} r="6" fill="white" stroke="#6366f1" strokeWidth="3" className="hover:scale-150 transition-transform cursor-pointer" />
                                );
                            })}
                        </svg>
                        
                        <div className="flex justify-between mt-6 px-2">
                            {["01 Jan", "05 Jan", "10 Jan", "15 Jan", "20 Jan", "25 Jan", "30 Jan"].map(d => (
                                <span key={d} className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{d}</span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50/50 p-10 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Network Stability</h4>
                            <div className="flex items-center gap-4">
                                <div className="text-3xl font-black text-slate-800">99.98%</div>
                                <div className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black tracking-widest">+0.02%</div>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[99%] rounded-full" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Storage Efficiency</h4>
                            <div className="flex items-center gap-4">
                                <div className="text-3xl font-black text-slate-800">42.4%</div>
                                <div className="px-2 py-1 bg-orange-100 text-orange-600 rounded-lg text-[10px] font-black tracking-widest">Optimal</div>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 w-[42%] rounded-full" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Response Latency</h4>
                            <div className="flex items-center gap-4">
                                <div className="text-3xl font-black text-slate-800">24ms</div>
                                <div className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black tracking-widest">Fast</div>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[15%] rounded-full" />
                            </div>
                        </div>
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
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-slate-900 rounded-2xl text-white">
                            {activeTab === "users" ? <Users size={28} /> : activeTab === "rooms" ? <Map size={28} /> : <MessageSquare size={28} />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                {activeTab === "users" ? "Identity Directory" : activeTab === "rooms" ? "Matrix Registry" : "Archive Clusters"}
                            </h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Administrative Management Hub</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {activeTab === "users" && (
                            <div className="relative flex-1 md:w-80 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search identity signature..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all shadow-sm font-bold text-xs"
                                />
                            </div>
                        )}

                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-3 rounded-xl text-slate-400 disabled:opacity-30 hover:bg-slate-50 hover:text-indigo-600 transition-all"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="px-4 flex flex-col items-center">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Segment</span>
                                    <span className="text-sm font-black text-slate-600">{page} / {pagination.totalPages}</span>
                                </div>
                                <button 
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                    className="p-3 rounded-xl text-slate-400 disabled:opacity-30 hover:bg-slate-50 hover:text-indigo-600 transition-all"
                                >
                                    <ChevronRight size={18} />
                                </button>
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
        </div>
      </main>
    </div>
  );
}
