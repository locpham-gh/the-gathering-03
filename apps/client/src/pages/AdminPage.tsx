import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { 
  Users, 
  Map, 
  MessageSquare, 
  Shield, 
  Search, 
  UserX, 
  UserCheck, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Activity,
  AlertCircle
} from "lucide-react";
import { apiFetch } from "../lib/api";

type TabType = "dashboard" | "users" | "rooms" | "forum";

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  // Redirect if not admin
  if (!user || user.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  const fetchData = async () => {
    setLoading(true);
    let endpoint = "";
    
    if (activeTab === "dashboard") {
      const res = await apiFetch("/api/admin/stats");
      if (res.success) setStats(res.stats);
      setLoading(false);
      return;
    }

    if (activeTab === "users") endpoint = `/api/admin/users?search=${searchTerm}&page=${page}&limit=10`;
    else if (activeTab === "rooms") endpoint = `/api/admin/rooms?page=${page}&limit=10`;
    else if (activeTab === "forum") endpoint = `/api/admin/forum/topics?page=${page}&limit=10`;

    const res = await apiFetch(endpoint);
    if (res.success) {
      setData(activeTab === "users" ? res.users : activeTab === "rooms" ? res.rooms : res.topics);
      setPagination(res.pagination);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, searchTerm, page]);

  useEffect(() => {
    setPage(1); // Reset page when tab or search changes
  }, [activeTab, searchTerm]);

  const handleUpdateUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "banned" : "active";
    const res = await apiFetch(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus })
    });
    if (res.success) fetchData();
  };

  const handleUpdateUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "user" ? "admin" : "user";
    const res = await apiFetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role: newRole })
    });
    if (res.success) fetchData();
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    
    let endpoint = "";
    if (activeTab === "rooms") endpoint = `/api/admin/rooms/${id}`;
    else if (activeTab === "forum") endpoint = `/api/admin/forum/topics/${id}`;
    
    const res = await apiFetch(endpoint, { method: "DELETE" });
    if (res.success) fetchData();
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
          
          <nav className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {[
              { id: "dashboard", label: "Overview", icon: LayoutDashboard },
              { id: "users", label: "Users", icon: Users },
              { id: "rooms", label: "Rooms", icon: Map },
              { id: "forum", label: "Forum", icon: MessageSquare },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === tab.id ? "bg-white text-indigo-600 shadow-lg shadow-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
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

        {activeTab !== "dashboard" && (
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

            {/* Content Table */}
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  {activeTab === "users" ? (
                    <tr>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">User Details</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Permissions</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Account Status</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  ) : activeTab === "rooms" ? (
                    <tr>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Identity</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Administrator</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Access Key</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Management</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Topic Content</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Creator</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Published</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Moderation</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                          <span className="text-slate-400 font-bold tracking-tight">Retrieving secure data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-32 text-center flex flex-col items-center gap-3">
                        <AlertCircle className="text-slate-200" size={48} />
                        <span className="text-slate-400 font-bold">No entries found matching criteria.</span>
                      </td>
                    </tr>
                  ) : data.map((item) => (
                    <tr key={item._id} className="group hover:bg-slate-50/50 transition-all">
                      {activeTab === "users" ? (
                        <>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden ring-2 ring-white shadow-md">
                                <img src={item.avatarUrl || `https://ui-avatars.com/api/?name=${item.displayName || item.email}&background=random`} alt="" />
                              </div>
                              <div>
                                <div className="font-black text-slate-800 text-base">{item.displayName || "Anonymous User"}</div>
                                <div className="text-xs text-slate-400 font-medium">{item.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${item.role === "admin" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                              {item.role}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${item.status === "active" ? "text-emerald-600" : "text-rose-600"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${item.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleUpdateUserRole(item._id, item.role)}
                                className="p-2.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                                title={item.role === "admin" ? "Demote to User" : "Promote to Admin"}
                              >
                                <Shield size={20} />
                              </button>
                              <button 
                                onClick={() => handleUpdateUserStatus(item._id, item.status)}
                                className={`p-2.5 rounded-xl transition-all ${item.status === "active" ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600" : "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"}`}
                                title={item.status === "active" ? "Ban User" : "Unban User"}
                              >
                                {item.status === "active" ? <UserX size={20} /> : <UserCheck size={20} />}
                              </button>
                            </div>
                          </td>
                        </>
                      ) : activeTab === "rooms" ? (
                        <>
                          <td className="px-8 py-6 font-black text-slate-800 text-base">{item.name}</td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                <Users size={12} />
                              </div>
                              <span className="text-sm font-bold text-slate-600">{item.ownerId?.displayName || "System"}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-xs font-black font-mono text-slate-400 tracking-tighter uppercase">{item.code}</td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => handleDeleteItem(item._id)}
                              className="p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={20} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-8 py-6 font-black text-slate-800 text-base">{item.title}</td>
                          <td className="px-8 py-6 text-sm font-bold text-slate-600">{item.authorId?.displayName || "Deleted User"}</td>
                          <td className="px-8 py-6 text-slate-400 text-xs font-bold uppercase tracking-widest">{new Date(item.createdAt).toLocaleDateString()}</td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => handleDeleteItem(item._id)}
                              className="p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={20} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Table Footer / Total Count */}
              <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div>Items shown: {data.length}</div>
                {pagination && <div>Total Records: {pagination.total}</div>}
              </div>
            </div>
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

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col gap-4">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-100`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value.toLocaleString()}</h3>
      </div>
    </div>
  );
}
