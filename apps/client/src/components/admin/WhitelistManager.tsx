import { useState, useEffect } from "react";
import { Trash2, UserPlus, Shield, Loader2, AlertCircle } from "lucide-react";
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

export const WhitelistManager: React.FC = () => {
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Admin Whitelist
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Emails added to this list will automatically be granted Admin
            permissions.
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleAddEmail} className="flex gap-3 max-w-md mb-8">
            <div className="relative flex-1">
              <input
                type="email"
                placeholder="Enter email to authorize..."
                className="w-full pl-4 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Add Admin
            </button>
          </form>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 border-b border-slate-100">
                    Email Address
                  </th>
                  <th className="px-4 py-3 border-b border-slate-100">
                    Added By
                  </th>
                  <th className="px-4 py-3 border-b border-slate-100 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {whitelist.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-slate-400 text-sm italic"
                    >
                      No admins in whitelist yet.
                    </td>
                  </tr>
                ) : (
                  whitelist.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-slate-700">
                          {item.email}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-600">
                            {item.addedBy?.displayName || "System"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleRemoveEmail(item.email)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Remove from whitelist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
