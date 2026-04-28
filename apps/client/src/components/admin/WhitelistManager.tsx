import { useState, useEffect } from "react";
import { Trash2, UserPlus, Shield, Loader2, AlertCircle, Mail, Search, RefreshCw, Calendar } from "lucide-react";
import { apiFetch } from "../../lib/api";

interface WhitelistItem {
  _id: string;
  email: string;
  addedBy?: {
    displayName: string;
    email: string;
  };
  createdAt: string;
}

interface WhitelistManagerProps {
  currentUserId?: string;
  currentUserEmail?: string;
  whitelistedByEmail?: string;
}

export const WhitelistManager: React.FC<WhitelistManagerProps> = ({
  currentUserId,
  currentUserEmail,
  whitelistedByEmail,
}) => {
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchWhitelist = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/admin/whitelist");
      if (data.success) {
        setWhitelist(data.list);
      } else {
        setError(data.error || "Failed to fetch whitelist");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhitelist();
  }, []);

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    try {
      setSubmitting(true);
      setError(null);
      const data = await apiFetch("/api/admin/whitelist", {
        method: "POST",
        body: JSON.stringify({ email: newEmail }),
      });
      if (data.success) {
        setWhitelist([data.item, ...whitelist]);
        setNewEmail("");
      } else {
        setError(data.error || "Failed to add email");
      }
    } catch {
      setError("Failed to add email");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveEmail = async (email: string) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${email} from admin whitelist?`,
      )
    )
      return;

    try {
      const data = await apiFetch(`/api/admin/whitelist/${email}`, {
        method: "DELETE",
      });
      if (data.success) {
        setWhitelist(whitelist.filter((item) => item.email !== email));
      } else {
        alert(data.error || "Failed to remove email");
      }
    } catch {
      alert("Failed to remove email");
    }
  };

  const filteredList = whitelist.filter(item => 
    item.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-32 gap-4">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <span className="text-slate-400 font-black uppercase tracking-widest text-xs">Accessing Secure Vault...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <Shield size={120} className="text-indigo-600" />
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                    <Shield size={24} />
                </div>
                Privileged Access Management
              </h3>
              <p className="text-slate-400 font-bold mt-2 max-w-lg">
                Authorize administrative control by adding verified emails to the global whitelist.
              </p>
            </div>
            <button 
                onClick={fetchWhitelist}
                className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                title="Refresh Whitelist"
            >
                <RefreshCw size={20} />
            </button>
          </div>

          <form onSubmit={handleAddEmail} className="flex gap-4 max-w-2xl">
            <div className="relative flex-1 group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input
                type="email"
                placeholder="Secure operator email (e.g. admin@thegathering.app)"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all text-base font-medium shadow-sm"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-slate-900 hover:bg-indigo-600 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl shadow-slate-200 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              Authorize Admin
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in shake duration-300">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <div className="relative max-w-xs w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                    type="text" 
                    placeholder="Search whitelist..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg">
                Total Authorized: {whitelist.length}
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorization Context</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                        <Search size={48} className="text-slate-400" />
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching authorizations found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item._id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Mail size={18} />
                        </div>
                        <span className="text-base font-black text-slate-800">
                          {item.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Shield size={12} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-600">
                                {item.addedBy?.displayName || "Root System"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={12} className="text-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {new Date(item.createdAt).toLocaleString()}
                            </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {(() => {
                        const isSelf = !!((currentUserId && String(item._id) === String(currentUserId)) || 
                                     (currentUserEmail && item.email === currentUserEmail));
                        const isGranter = !!(whitelistedByEmail && item.email === whitelistedByEmail);
                        const isDisabled = isSelf || isGranter;
                        
                        return (
                          <button
                            onClick={() => handleRemoveEmail(item.email)}
                            disabled={isDisabled}
                            className={`p-3 rounded-2xl transition-all ${
                              isDisabled 
                                ? "opacity-20 cursor-not-allowed text-slate-300" 
                                : "text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100"
                            }`}
                            title={
                              isSelf 
                                ? "Self-revocation restricted" 
                                : isGranter 
                                  ? "Authorization granter protection" 
                                  : "Revoke Access"
                            }
                          >
                            <Trash2 size={20} />
                          </button>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
