import React from "react";
import { Users, Shield, UserX, UserCheck, Trash2, AlertCircle } from "lucide-react";
import type { AdminDataItem, TabType, PaginationInfo } from "../../types/admin";

interface AdminDataTableProps {
  activeTab: TabType;
  data: AdminDataItem[];
  loading: boolean;
  pagination: PaginationInfo | null;
  onUpdateRole?: (id: string, currentRole: string) => void;
  onUpdateStatus?: (id: string, currentStatus: string) => void;
  onDelete?: (id: string) => void;
}

export const AdminDataTable: React.FC<AdminDataTableProps> = ({
  activeTab,
  data,
  loading,
  pagination,
  onUpdateRole,
  onUpdateStatus,
  onDelete,
}) => {
  return (
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
                        onClick={() => onUpdateRole?.(item._id, item.role || "")}
                        className="p-2.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                        title={item.role === "admin" ? "Demote to User" : "Promote to Admin"}
                      >
                        <Shield size={20} />
                      </button>
                      <button 
                        onClick={() => onUpdateStatus?.(item._id, item.status || "")}
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
                      onClick={() => onDelete?.(item._id)}
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
                      onClick={() => onDelete?.(item._id)}
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
      
      <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
        <div>Items shown: {data.length}</div>
        {pagination && <div>Total Records: {pagination.total}</div>}
      </div>
    </div>
  );
};
