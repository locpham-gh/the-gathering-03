import React from "react";
import {
  Users,
  Shield,
  UserX,
  UserCheck,
  Trash2,
  AlertCircle,
  Map,
  MessageSquare,
  ExternalLink,
  Hash,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
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
    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-200 overflow-hidden animate-in fade-in duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {activeTab === "users" ? (
                <>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Digital Identity
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Authorization
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Network Status
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Operations
                  </th>
                </>
              ) : activeTab === "rooms" ? (
                <>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Room Matrix
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Administrative Owner
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Encryption Key
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Protocol
                  </th>
                </>
              ) : (
                <>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Content Thread
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Intel Author
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Timestamp
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Moderation
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-8 py-32 text-center">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <span className="text-slate-400 font-black uppercase tracking-widest text-xs">
                      Syncing with Mainframe...
                    </span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-32 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-30">
                    <AlertCircle size={64} className="text-slate-300" />
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-black text-slate-500 uppercase tracking-widest">
                        No Intelligence Data
                      </span>
                      <p className="text-xs text-slate-400 font-bold mt-1">
                        No entries found matching your security clearance.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item._id}
                  className="group hover:bg-slate-50/50 transition-all duration-200"
                >
                  {activeTab === "users" ? (
                    <>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden ring-4 ring-white shadow-xl shadow-slate-200">
                              <img
                                src={
                                  item.avatarUrl ||
                                  `https://ui-avatars.com/api/?name=${item.displayName || item.email}&background=6366f1&color=fff&bold=true`
                                }
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            </div>
                            {item.status === "active" && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-black text-slate-800 text-lg tracking-tight leading-none mb-1">
                              {item.displayName || "Anonymous Entity"}
                            </div>
                            <div className="text-xs text-slate-400 font-bold flex items-center gap-1">
                              <Hash size={10} />
                              {item.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${item.role === "admin" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-slate-100 text-slate-500 border border-slate-200"}`}
                        >
                          <Shield size={10} />
                          {item.role}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div
                          className={`flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest ${item.status === "active" ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${item.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
                          ></div>
                          {item.status}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                          <button
                            onClick={() =>
                              onUpdateRole?.(item._id, item.role || "")
                            }
                            className="p-3 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all"
                            title={
                              item.role === "admin"
                                ? "Demote Privilege"
                                : "Elevate Privilege"
                            }
                          >
                            <Shield size={20} />
                          </button>
                          <button
                            onClick={() =>
                              onUpdateStatus?.(item._id, item.status || "")
                            }
                            className={`p-3 rounded-2xl transition-all ${item.status === "active" ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600" : "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"}`}
                            title={
                              item.status === "active"
                                ? "Terminate Access"
                                : "Restore Access"
                            }
                          >
                            {item.status === "active" ? (
                              <UserX size={20} />
                            ) : (
                              <UserCheck size={20} />
                            )}
                          </button>
                        </div>
                      </td>
                    </>
                  ) : activeTab === "rooms" ? (
                    <>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                            <Map size={24} />
                          </div>
                          <div className="font-black text-slate-800 text-lg tracking-tight">
                            {item.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <Users size={14} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-700 leading-none">
                              {item.ownerId?.displayName || "System Process"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {item.ownerId?.email || "internal@system"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                          <Hash size={12} className="text-slate-300" />
                          <span className="text-xs font-black font-mono text-slate-500 tracking-tighter uppercase">
                            {item.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                          <button
                            className="p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-900 rounded-2xl transition-all"
                            title="Inspect Matrix"
                          >
                            <ExternalLink size={20} />
                          </button>
                          <button
                            onClick={() => onDelete?.(item._id)}
                            className="p-3 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all"
                            title="Purge Matrix"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm">
                            <MessageSquare size={24} />
                          </div>
                          <div className="font-black text-slate-800 text-lg tracking-tight max-w-md truncate">
                            {item.title}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-black text-slate-600">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <Users size={14} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-700 leading-none">
                              {item.authorId?.displayName || "Deleted Ghost"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {item.authorId?.email || "unknown@identity"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Calendar size={10} />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                          <button
                            className="p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-900 rounded-2xl transition-all"
                            title="Quick Moderation"
                          >
                            <MoreHorizontal size={20} />
                          </button>
                          <button
                            onClick={() => onDelete?.(item._id)}
                            className="p-3 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all"
                            title="Expunge Content"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50/50 px-8 py-5 border-t border-slate-100 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Hash size={10} className="text-slate-300" />
            Segments Loaded: {data.length}
          </span>
          {pagination && (
            <span className="flex items-center gap-1.5">
              <Shield size={10} className="text-slate-300" />
              Global Records: {pagination.total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
          Data Feed Synchronized
        </div>
      </div>
    </div>
  );
};
