import React, { useState } from "react";
import { X, Copy, Mail, Plus, Loader2 } from "lucide-react";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName?: string;
  roomCode?: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  roomName,
  roomCode,
}) => {
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Invite link copied to clipboard!");
  };

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      alert("Room code copied to clipboard!");
    }
  };

  const handleInviteEmail = async () => {
    if (!inviteEmail || isSending) return;
    
    setIsSending(true);
    try {
      const res = await apiFetch("/api/rooms/invite", {
        method: "POST",
        body: JSON.stringify({
          email: inviteEmail,
          roomName: roomName || "The Gathering",
          roomCode: roomCode || "",
          inviteLink: window.location.href,
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

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in duration-300 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Invite People</h2>
            <div className="text-teal-400 text-xs font-medium uppercase tracking-widest mt-1">
              {roomName ? `Room: ${roomName}` : "Public Space"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 transition-colors rounded-full hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Room Link & Code */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Invite Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-xl font-bold transition-colors flex items-center justify-center"
                  title="Copy Link"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            {roomCode && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Room Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={roomCode}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest font-bold text-slate-700 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyCode}
                    className="px-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-colors flex items-center justify-center"
                    title="Copy Room Code"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-full h-px bg-slate-100"></div>

          {/* Email Invite */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Invite by Email
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleInviteEmail();
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                />
              </div>
              <button
                onClick={handleInviteEmail}
                disabled={!inviteEmail || isSending}
                className="px-5 bg-teal-600 text-white hover:bg-teal-500 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl font-bold transition-colors flex items-center gap-2"
              >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                {isSending ? "Sending..." : "Invite"}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              We will send an automatic email invitation to this address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
