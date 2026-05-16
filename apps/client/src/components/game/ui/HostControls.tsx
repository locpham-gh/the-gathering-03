import React, { useState } from "react";
import { MicOff, Users, Megaphone, Shield, Link2 } from "lucide-react";

interface HostControlsProps {
  isHost: boolean;
  onMuteAll: () => void;
  onSummonAll: () => void;
  onMegaphone: (message: string) => void;
  onShareIframe: (url: string) => void;
}

export const HostControls: React.FC<HostControlsProps> = ({
  isHost,
  onMuteAll,
  onSummonAll,
  onMegaphone,
  onShareIframe,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isHost) return null;

  const handleMegaphoneClick = () => {
    const msg = prompt("Enter announcement message (will be shown to everyone):");
    if (msg && msg.trim()) {
      onMegaphone(msg.trim());
    }
  };

  const handleShareClick = () => {
    const url = prompt("Enter a public URL to share (e.g., YouTube embed link, Google Docs):");
    if (url && url.trim()) {
      // If it's a standard youtube link, try to convert it to embed
      let finalUrl = url.trim();
      if (finalUrl.includes("youtube.com/watch?v=")) {
        const videoId = new URL(finalUrl).searchParams.get("v");
        if (videoId) finalUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (finalUrl.includes("youtu.be/")) {
        const videoId = finalUrl.split("youtu.be/")[1]?.split("?")[0];
        if (videoId) finalUrl = `https://www.youtube.com/embed/${videoId}`;
      }
      onShareIframe(finalUrl);
    }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[200] pointer-events-auto">
      {isOpen ? (
        <div className="bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-amber-500/30 shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 rounded-xl text-amber-400 font-bold uppercase tracking-widest text-[10px]">
            <Shield size={14} />
            <span>Host Panel</span>
          </div>

          <div className="h-6 w-px bg-slate-700 mx-1" />

          <button
            onClick={onMuteAll}
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-200 hover:text-white group"
            title="Mute everyone in the room"
          >
            <MicOff size={16} className="group-hover:text-red-400 transition-colors" />
            <span className="text-xs font-medium">Mute All</span>
          </button>

          <button
            onClick={onSummonAll}
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-200 hover:text-white group"
            title="Teleport everyone to your location"
          >
            <Users size={16} className="group-hover:text-indigo-400 transition-colors" />
            <span className="text-xs font-medium">Gather All</span>
          </button>

          <button
            onClick={handleMegaphoneClick}
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-200 hover:text-white group"
            title="Broadcast a global message"
          >
            <Megaphone size={16} className="group-hover:text-emerald-400 transition-colors" />
            <span className="text-xs font-medium">Announce</span>
          </button>

          <button
            onClick={handleShareClick}
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-200 hover:text-white group"
            title="Share a webpage/video to everyone"
          >
            <Link2 size={16} className="group-hover:text-blue-400 transition-colors" />
            <span className="text-xs font-medium">Share Link</span>
          </button>

          <div className="h-6 w-px bg-slate-700 mx-1" />

          <button
            onClick={() => setIsOpen(false)}
            className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-medium transition-colors"
          >
            Hide
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 text-amber-400 px-4 py-2 rounded-full border border-amber-500/30 shadow-lg transition-all animate-in fade-in"
        >
          <Shield size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">Host Options</span>
        </button>
      )}
    </div>
  );
};
