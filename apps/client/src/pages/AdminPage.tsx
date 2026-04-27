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
  Trash2
} from "lucide-react";
import { apiFetch } from "../lib/api";

type TabType = "users" | "rooms" | "forum";

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect if not admin
  if (!user || user.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  const fetchData = async () => {
    setLoading(true);
    let endpoint = "";
    if (activeTab === "users") endpoint = `/api/admin/users?search=${searchTerm}`;
    else if (activeTab === "rooms") endpoint = "/api/admin/rooms";
    else if (activeTab === "forum") endpoint = "/api/admin/forum/topics";

    const res = await apiFetch(endpoint);
    if (res.success) {
      setData(activeTab === "users" ? res.users : activeTab === "rooms" ? res.rooms : res.topics);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
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
      <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Admin Control Panel</h1>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Management & Governance</p>
            </div>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "users" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Users size={18} /> Users
            </button>
            <button 
              onClick={() => setActiveTab("rooms")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "rooms" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Map size={18} /> Rooms
            </button>
            <button 
              onClick={() => setActiveTab("forum")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "forum" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <MessageSquare size={18} /> Forum
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {/* Search Bar */}
        {activeTab === "users" && (
          <div className="mb-8 relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search users by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        )}

        {/* Content Table */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              {activeTab === "users" ? (
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              ) : activeTab === "rooms" ? (
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Room Name</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Owner</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Code</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Topic Title</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Author</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Created At</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-medium">Loading data...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-medium">No results found.</td>
                </tr>
              ) : data.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                  {activeTab === "users" ? (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                            <img src={item.avatarUrl || `https://ui-avatars.com/api/?name=${item.displayName || item.email}`} alt="" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{item.displayName || "No Name"}</div>
                            <div className="text-xs text-slate-400">{item.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${item.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${item.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleUpdateUserRole(item._id, item.role)}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            title={item.role === "admin" ? "Demote to User" : "Promote to Admin"}
                          >
                            <Shield size={18} />
                          </button>
                          <button 
                            onClick={() => handleUpdateUserStatus(item._id, item.status)}
                            className={`p-2 transition-colors ${item.status === "active" ? "text-slate-400 hover:text-red-600" : "text-emerald-500 hover:text-emerald-600"}`}
                            title={item.status === "active" ? "Ban User" : "Unban User"}
                          >
                            {item.status === "active" ? <UserX size={18} /> : <UserCheck size={18} />}
                          </button>
                        </div>
                      </td>
                    </>
                  ) : activeTab === "rooms" ? (
                    <>
                      <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                      <td className="px-6 py-4 text-slate-600">{item.ownerId?.displayName || "Unknown"}</td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">{item.code}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteItem(item._id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-bold text-slate-800">{item.title}</td>
                      <td className="px-6 py-4 text-slate-600">{item.authorId?.displayName || "Unknown"}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteItem(item._id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Stats Footer */}
      <footer className="bg-white border-t border-slate-200 px-8 py-4">
        <div className="max-w-7xl mx-auto flex gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Online</span>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Total Results: <span className="text-slate-800 font-bold">{data.length}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
