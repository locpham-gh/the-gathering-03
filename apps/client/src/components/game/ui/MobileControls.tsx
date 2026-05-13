import React from "react";
import { Hand, MessageCircle } from "lucide-react";

export const MobileControls: React.FC = () => {
  const triggerKey = (key: string) => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { key }));
    }, 100);
  };

  return (
    <div className="flex flex-col gap-4 pointer-events-auto">
      <button 
        onClick={() => triggerKey("q")}
        className="w-16 h-16 rounded-full bg-slate-900/40 backdrop-blur-md border-2 border-white/20 shadow-xl flex items-center justify-center text-white active:scale-95 transition-transform"
        aria-label="Toggle Chat"
      >
        <MessageCircle size={28} />
      </button>
      
      <button 
        onClick={() => triggerKey("e")}
        className="w-20 h-20 rounded-full bg-indigo-600/80 backdrop-blur-md border-2 border-indigo-300/50 shadow-2xl shadow-indigo-500/20 flex items-center justify-center text-white active:scale-95 transition-transform"
        aria-label="Interact"
      >
        <Hand size={36} />
      </button>
    </div>
  );
};
