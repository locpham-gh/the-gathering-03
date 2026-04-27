import { useState, useCallback, useEffect } from "react";
import { X, LogOut, Loader2 } from "lucide-react";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import type { RoomData, Member } from "./types";

export function RoomManageModal({
  room,
  onClose,
}: {
  room: RoomData;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState(room.name);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleInviteEmail = async () => {
    if (!inviteEmail || isSending) return;
    
    setIsSending(true);
    try {
      const res = await apiFetch("/api/rooms/invite", {
        method: "POST",
        body: JSON.stringify({
          email: inviteEmail,
          roomName: room.name || "The Gathering",
          roomCode: room.code || "",
          inviteLink: `${window.location.origin}/room/${room.code}`,
          inviterName: user?.displayName || "A user",
        }),
      });

      if (res.success) {
        alert("Invitation sent successfully to " + inviteEmail);
        setInviteEmail("");
      } else {
        alert("Failed to send invitation: " + res.error);
      }
    } catch (error) {
      alert("An error occurred while sending the invitation.");
    } finally {
      setIsSending(false);
    }
  };

  const fetchMembers = useCallback(async () => {
    // loading is already true from state init
    const res = await apiFetch(`/api/rooms/${room._id}/members`);
    if (res.success) {
      // Deduplicate for UI safety (especially for legacy data)
      const unique = Array.from(
        new Map(res.members.map((m: Member) => [m._id, m])).values(),
      ) as Member[];
      setMembers(unique);
    }
    setLoading(false);
  }, [room._id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMembers();
  }, [fetchMembers]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch(`/api/rooms/${room._id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    if (res.success) {
      alert("Room name updated!");
    } else {
      alert("Error: " + res.error);
    }
    setSaving(false);
  };

  const handleKick = async (userId: string) => {
    if (!confirm("Remove this member from the room?")) return;
    const res = await apiFetch(`/api/rooms/${room._id}/kick`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
    if (res.success) {
      fetchMembers();
    } else {
      alert("Error: " + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">Manage Room</h3>
            <p className="text-slate-400 text-sm font-mono mt-1">{room.code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {/* Settings Section */}
          <section className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Room Settings
            </h4>
            <form onSubmit={handleUpdateName} className="flex gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary transition-all text-sm"
              />
              <button
                type="submit"
                disabled={saving || name === room.name}
                className="px-6 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all disabled:opacity-50"
              >
                Update
              </button>
            </form>
          </section>

          {/* Invite Section */}
          <section className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Invite People
            </h4>
            <div className="flex gap-3">
              <input
                type="text"
                readOnly
                value={room.code}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-center tracking-widest font-bold outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(room.code);
                  alert("Room code copied to clipboard!");
                }}
                className="px-6 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all shadow-sm"
              >
                Copy Code
              </button>
            </div>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Invite by email address"
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary transition-all text-sm"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <button
                onClick={handleInviteEmail}
                disabled={!inviteEmail || isSending}
                className="px-6 bg-primary/10 text-primary rounded-xl font-bold hover:bg-primary/20 transition-all disabled:opacity-50 flex items-center justify-center min-w-[120px]"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : "Send Email"}
              </button>
            </div>
          </section>

          {/* Members Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Members
              </h4>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                {members.length}
              </span>
            </div>

            <div className="space-y-2">
              {loading ? (
                <div className="py-8 text-center text-slate-400 animate-pulse">
                  Loading members...
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member._id}
                    className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatarUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {member.displayName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    {member._id !== room.ownerId._id && (
                      <button
                        onClick={() => handleKick(member._id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Kick Member"
                      >
                        <LogOut size={18} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
