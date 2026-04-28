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
    <DashboardLayout>
      <div className="space-y-10 py-4 pb-20">
        {/* Navigation Bar - Local to Admin */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-3 rounded-[2rem] border border-slate-200/60 shadow-sm sticky top-0 z-40 backdrop-blur-sm bg-white/90">
           <nav className="flex items-center gap-1">
                {[
                  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                  { id: "whitelist", label: "Whitelist", icon: UserPlus },
                  { id: "library", label: "Library", icon: BookOpen },
                  { id: "users", label: "Users", icon: Users },
                  { id: "rooms", label: "Rooms", icon: Map },
                  { id: "forum", label: "Forum", icon: MessageSquare },
                ].map((tab) => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id ? "bg-slate-900 text-white shadow-lg shadow-slate-200 translate-y-[-1px]" : "text-slate-400 hover:text-slate-800 hover:bg-slate-50"}`}
                  >
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
            </nav>
            <div className="flex items-center gap-4 px-4">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    Last Update: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button 
                    onClick={fetchData}
                    disabled={loading}
                    className={`p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all ${loading ? 'animate-spin text-indigo-600' : ''}`}
                >
                    <RefreshCw size={18} />
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === "dashboard" && stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard label="Entities" value={stats.totalUsers} icon={Users} color="bg-indigo-600" />
                <StatCard label="Matrices" value={stats.totalRooms} icon={Map} color="bg-emerald-600" />
                <StatCard label="Clusters" value={stats.totalTopics} icon={MessageSquare} color="bg-orange-600" />
                <StatCard label="Purged" value={stats.bannedUsers} icon={UserX} color="bg-rose-600" />
            </div>
            ) : null}

            {activeTab === "whitelist" && <WhitelistManager />}
            
            {activeTab === "library" && <LibraryManager />}

            {activeTab !== "dashboard" && activeTab !== "whitelist" && activeTab !== "library" && (
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-900 rounded-2xl text-white">
                            {activeTab === "users" ? <Users size={24} /> : activeTab === "rooms" ? <Map size={24} /> : <MessageSquare size={24} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                {activeTab === "users" ? "Directory" : activeTab === "rooms" ? "Registry" : "Archives"}
                            </h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Managing Global Intelligence</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {activeTab === "users" && (
                            <div className="relative flex-1 md:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search identity..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all shadow-sm font-bold text-xs"
                            />
                            </div>
                        )}

                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-xl text-slate-400 disabled:opacity-30 hover:bg-slate-50 hover:text-indigo-600 transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="px-3 flex flex-col items-center">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Page</span>
                                <span className="text-[11px] font-black text-slate-600">{page} / {pagination.totalPages}</span>
                            </div>
                            <button 
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="p-2 rounded-xl text-slate-400 disabled:opacity-30 hover:bg-slate-50 hover:text-indigo-600 transition-all"
                            >
                                <ChevronRight size={16} />
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
                />
            </div>
            )}
        </div>
      </div>
    </DashboardLayout>
  );
}
