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
    <DashboardLayout fullWidth>
      <div className="flex h-full bg-slate-50/30 font-sans">
        {/* SLIM SECONDARY SIDEBAR */}
        <aside className="w-20 lg:w-24 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col h-[calc(100vh-64px)] sticky top-0">
          <div className="flex-1 flex flex-col items-center py-10 gap-8">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl shadow-slate-200 mb-4">A</div>

              <nav className="flex flex-col gap-4">
                  {[
                      { id: "dashboard", label: "Stats", icon: LayoutDashboard },
                      { id: "users", label: "Users", icon: Users },
                      { id: "rooms", label: "Rooms", icon: Map },
                      { id: "forum", label: "Forum", icon: MessageSquare },
                      { id: "library", label: "Files", icon: BookOpen },
                      { id: "whitelist", label: "Auth", icon: UserPlus },
                  ].map((item) => (
                      <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id as TabType)}
                          className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 relative group ${activeTab === item.id ? "bg-slate-900 text-white shadow-xl shadow-slate-300" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"}`}
                      >
                          <item.icon size={20} />
                          <span className="text-[8px] font-black uppercase tracking-tighter mt-1">{item.label}</span>
                          {activeTab === item.id && (
                            <div className="absolute -left-3 w-1.5 h-6 bg-indigo-500 rounded-r-full" />
                          )}
                      </button>
                  ))}
              </nav>
          </div>

          <div className="p-6 border-t border-slate-100 flex justify-center">
              <button 
                  onClick={fetchData}
                  className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all border border-slate-100"
              >
                  <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
              </button>
          </div>
        </aside>

        {/* MINIMALIST CONTENT AREA */}
        <div className="flex-1 overflow-y-auto h-[calc(100vh-64px)] custom-scrollbar">
          {/* HEADER */}
          <div className="bg-white/40 backdrop-blur-md border-b border-slate-200/60 h-20 flex items-center justify-between px-10 sticky top-0 z-10">
              <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{activeTab}</h2>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Gathering OS v2.4</span>
              </div>
          </div>

          {/* PAGE CONTENT */}
          <div className="p-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              {activeTab === "dashboard" && stats ? (
              <div className="space-y-12">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                      <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="bg-indigo-600" />
                      <StatCard label="Active Rooms" value={stats.totalRooms} icon={Map} color="bg-emerald-600" />
                      <StatCard label="Forum Topics" value={stats.totalTopics} icon={MessageSquare} color="bg-orange-600" />
                      <StatCard label="Banned" value={stats.bannedUsers} icon={UserX} color="bg-rose-600" />
                  </div>

                  {/* Visual Chart Area */}
                  <div className="bg-white rounded-[3rem] border border-slate-200/60 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.08)] overflow-hidden">
                      <div className="p-10 flex justify-between items-center">
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Throughput Metrics</h3>
                          <div className="h-1 w-20 bg-indigo-500 rounded-full" />
                      </div>

                      <div className="px-10 pb-10 relative">
                          <svg className="w-full h-72 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 400">
                              <defs>
                                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                  </linearGradient>
                              </defs>
                              <path 
                                  d="M 0 400 C 100 350, 200 380, 300 150 C 400 120, 500 250, 600 280 C 700 100, 800 80, 900 120, 1000 50 L 1000 400 Z" 
                                  fill="url(#chartGradient)"
                              />
                              <path 
                                  d="M 0 400 C 100 350, 200 380, 300 150 C 400 120, 500 250, 600 280 C 700 100, 800 80, 900 120, 1000 50" 
                                  fill="none" 
                                  stroke="#6366f1" 
                                  strokeWidth="6" 
                                  strokeLinecap="round" 
                              />
                          </svg>
                      </div>

                      <div className="grid grid-cols-3 border-t border-slate-100">
                          {[
                            { label: "Stability", value: "99.9%" },
                            { label: "Efficiency", value: "42.4%" },
                            { label: "Latency", value: "24ms" }
                          ].map((item, i) => (
                            <div key={i} className="p-10 text-center border-r last:border-0 border-slate-100 hover:bg-slate-50 transition-colors">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
                              <p className="text-3xl font-black text-slate-900">{item.value}</p>
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
              <div className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
                      <div className="flex items-center gap-4">
                          <div className="p-4 bg-slate-900 rounded-2xl text-white">
                              {activeTab === "users" ? <Users size={20} /> : activeTab === "rooms" ? <Map size={20} /> : <MessageSquare size={20} />}
                          </div>
                          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{activeTab} Registry</h2>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto">
                          {activeTab === "users" && (
                              <div className="relative flex-1 md:w-72 group">
                                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                  <input 
                                      type="text" 
                                      placeholder="Search..."
                                      value={searchTerm}
                                      onChange={(e) => setSearchTerm(e.target.value)}
                                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all font-bold text-xs"
                                  />
                              </div>
                          )}

                          {pagination && pagination.totalPages > 1 && (
                              <div className="flex items-center bg-slate-50 rounded-2xl border border-slate-200 p-1">
                                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-3 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"><ChevronLeft size={20} /></button>
                                  <span className="px-4 text-xs font-black text-slate-600">{page} / {pagination.totalPages}</span>
                                  <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="p-3 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"><ChevronRight size={20} /></button>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl overflow-hidden">
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
              </div>
              )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
