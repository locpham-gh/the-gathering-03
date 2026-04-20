import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { apiFetch } from "../../lib/api";
import {
  CHARACTER_2D,
  GENDERS,
  getDefaultCharacterByGender,
  getDefaultAvatarByGender,
  type Character2D,
  resolveAvatarUrl,
  sanitizeCharacter2D,
  sanitizeGender,
} from "../../lib/profile";

export function ProfileSettings({ 
  user 
}: { 
  user: {
    displayName: string;
    avatarUrl: string;
    gender?: string;
    character2d?: string;
  };
}) {
  const { updateUser } = useAuth();
  const [name, setName] = useState(user.displayName);
  const [avatar, setAvatar] = useState(user.avatarUrl);
  const [gender, setGender] = useState(sanitizeGender(user.gender));
  const [character2d, setCharacter2d] = useState<Character2D>(
    sanitizeCharacter2D(user.character2d || getDefaultCharacterByGender(user.gender)),
  );
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify({
        displayName: name,
        avatarUrl: avatar,
        gender,
        character2d,
      }),
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
            placeholder={`${getDefaultAvatarByGender(gender)} (auto default nếu để trống)`}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-500">Gender</label>
          <select
            value={gender}
            onChange={(e) => {
              const nextGender = sanitizeGender(e.target.value);
              setGender(nextGender);
            }}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-primary transition-all shadow-sm"
          >
            {GENDERS.map((value) => (
              <option key={value} value={value}>
                {value === "male"
                  ? "Male"
                  : value === "female"
                    ? "Female"
                    : "Other"}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-500">
            2D Character
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CHARACTER_2D.map((character) => {
              const isSelected = character2d === character;
              return (
                <button
                  key={character}
                  type="button"
                  onClick={() => setCharacter2d(character)}
                  className={`p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <img
                    src={`/assets/Characters_free/${character}_idle_16x16.png`}
                    alt={character}
                    className="w-12 h-12 mx-auto object-contain image-rendering-pixelated"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <p className="text-xs mt-2 font-semibold text-slate-700">
                    {character}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
          <img
            src={resolveAvatarUrl(avatar, gender)}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-full border border-white shadow-xl object-cover"
            alt="Preview"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                getDefaultAvatarByGender(gender);
            }}
          />
          <div className="text-xs text-slate-400 leading-relaxed italic">
            <p>Changes will reflect across all your virtual rooms and activity.</p>
            <p className="mt-1 not-italic text-slate-500">
              Character 2D: <span className="font-semibold">{character2d}</span>
            </p>
          </div>
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
