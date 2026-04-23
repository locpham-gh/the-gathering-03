import { useState } from "react";
import { Users, Plus, X } from "lucide-react";

interface GuestListManagerProps {
  user: { displayName: string; avatarUrl: string };
  guests: string[];
  onGuestsChange: (guests: string[]) => void;
}

export function GuestListManager({
  user,
  guests,
  onGuestsChange,
}: GuestListManagerProps) {
  const [guestEmail, setGuestEmail] = useState("");

  const addGuest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = guestEmail.trim().toLowerCase();
    if (trimmed && trimmed.includes("@") && !guests.includes(trimmed)) {
      onGuestsChange([...guests, trimmed]);
      setGuestEmail("");
    }
  };

  const removeGuest = (email: string) => {
    onGuestsChange(guests.filter((g) => g !== email));
  };

  return (
    <div className="w-full md:w-80 bg-white p-8 flex flex-col border-t md:border-t-0 border-slate-100">
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
        <Users size={18} className="text-teal-500" />
        <span className="font-bold text-slate-700">Khách mời</span>
        {guests.length > 0 && (
          <span className="ml-auto text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full font-bold">
            {guests.length}
          </span>
        )}
      </div>

      {/* Input */}
      <form onSubmit={addGuest} className="relative mb-5">
        <input
          type="email"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          placeholder="email@example.com"
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-400 focus:bg-white transition-all pr-12"
        />
        {guestEmail && (
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition"
          >
            <Plus size={14} />
          </button>
        )}
      </form>

      {/* Host */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-50">
        <img
          src={user.avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="w-9 h-9 rounded-full border-2 border-teal-200 object-cover bg-slate-100"
        />
        <div>
          <p className="text-sm font-bold text-slate-800 leading-tight">
            {user.displayName}
          </p>
          <p className="text-xs text-teal-600 font-medium">Chủ tọa</p>
        </div>
      </div>

      {/* Guest list */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[30vh]">
        {guests.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">
            Chưa có khách mời nào. Email xác nhận sẽ được gửi tự động.
          </p>
        )}
        {guests.map((email) => (
          <div
            key={email}
            className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100"
          >
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
              {email.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 text-sm text-slate-600 truncate">
              {email}
            </span>
            <button
              type="button"
              onClick={() => removeGuest(email)}
              className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
