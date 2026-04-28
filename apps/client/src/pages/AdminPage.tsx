import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { 
  Users, 
  Map, 
  MessageSquare, 
  Shield, 
  Search, 
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Activity,
  AlertCircle,
  UserPlus,
  UserX
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { WhitelistManager } from "../components/admin/WhitelistManager";
import { StatCard } from "../components/admin/StatCard";
import { AdminDataTable } from "../components/admin/AdminDataTable";
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
    if (activeTab === "whitelist") return; 
    
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
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 0);
    return () => clearTimeout(timer);
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
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Admin Control Panel</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Enterprise Management System</p>
              </div>
            </div>
          </div>
          
          <nav className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto">
            {[
              { id: "dashboard", label: "Overview", icon: LayoutDashboard },
              { id: "whitelist", label: "Whitelist", icon: UserPlus },
              { id: "users", label: "Users", icon: Users },
              { id: "rooms", label: "Rooms", icon: Map },
              { id: "forum", label: "Forum", icon: MessageSquare },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${activeTab === tab.id ? "bg-white text-indigo-600 shadow-lg shadow-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {activeTab === "dashboard" && stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="bg-indigo-500" />
            <StatCard label="Active Rooms" value={stats.totalRooms} icon={Map} color="bg-emerald-500" />
            <StatCard label="Forum Topics" value={stats.totalTopics} icon={MessageSquare} color="bg-orange-500" />
            <StatCard label="Banned Users" value={stats.bannedUsers} icon={UserX} color="bg-rose-500" />
          </div>
        ) : null}

        {activeTab === "whitelist" && <WhitelistManager />}

        {activeTab !== "dashboard" && activeTab !== "whitelist" && (
          <>
            <div className="flex justify-between items-center mb-8">
              {activeTab === "users" ? (
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all shadow-sm"
                  />
                </div>
              ) : <div />}

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm font-bold text-slate-500 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button 
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>

            <AdminDataTable 
              activeTab={activeTab}
              data={data}
              loading={loading}
              pagination={pagination}
              onUpdateRole={handleUpdateUserRole}
              onUpdateStatus={handleUpdateUserStatus}
              onDelete={handleDeleteItem}
            />
          </>
        )}
      </main>

      {/* Global Status Bar */}
      <footer className="bg-white border-t border-slate-200 px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Engine: Active</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Protocol: v2.4</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            The Gathering Admin Dashboard &copy; 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
