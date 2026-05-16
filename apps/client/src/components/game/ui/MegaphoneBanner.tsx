import React, { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";

export const MegaphoneBanner: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleMegaphone = (e: CustomEvent) => {
      setMessage(e.detail?.message || "Announcement");
      
      // Auto dismiss after 10 seconds
      setTimeout(() => {
        setMessage(null);
      }, 10000);
    };

    window.addEventListener("megaphone-event", handleMegaphone as EventListener);
    return () => window.removeEventListener("megaphone-event", handleMegaphone as EventListener);
  }, []);

  if (!message) return null;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-[250] pointer-events-none">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-10 fade-in duration-500 pointer-events-auto">
        <div className="flex items-start gap-4 p-4 sm:p-6">
          <div className="p-3 bg-white/20 rounded-full shrink-0">
            <Megaphone size={32} className="text-white" />
          </div>
          
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="text-white/80 text-xs font-black uppercase tracking-widest mb-1">
              Host Announcement
            </h3>
            <p className="text-white text-lg sm:text-xl font-bold leading-tight break-words">
              {message}
            </p>
          </div>
          
          <button
            onClick={() => setMessage(null)}
            className="p-2 text-white/60 hover:text-white hover:bg-white/20 rounded-xl transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-white/20 w-full">
          <div className="h-full bg-white w-full animate-[shrink_10s_linear_forwards]" />
        </div>
      </div>
      
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};
