import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { apiFetch } from "../../lib/api";

export function ProfileSettings({ 
  user 
}: { 
  user: { displayName: string; avatarUrl: string } 
}) {
  const { updateUser } = useAuth();
  const [name, setName] = useState(user.displayName);
  const [avatar, setAvatar] = useState(user.avatarUrl);
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify({ displayName: name, avatarUrl: avatar }),
    });

    if (res.success) {
      updateUser(res.user);
      alert("Profile updated successfully!");
    } else {
      alert("Failed to update profile: " + res.error);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-xl animate-in fade-in slide-in-from-right duration-500">
      <h3 className="text-2xl font-bold text-slate-800 mb-8">
        Personal Information
      </h3>
      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-primary transition-all shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500">Avatar URL</label>
          <input
            type="text"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-primary transition-all shadow-sm font-mono text-xs"
          />
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
          <img
            src={avatar}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-full border border-white shadow-xl object-cover"
            alt="Preview"
          />
          <p className="text-xs text-slate-400 leading-relaxed italic">
            Changes will reflect across all your virtual rooms and activity.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 shadow-xl shadow-primary/20 transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
