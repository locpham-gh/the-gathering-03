import React from "react";
import { X, Calendar as CalendarIcon } from "lucide-react";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 md:p-12">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl h-full max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Team Schedule</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shared Google Calendar</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white p-2">
          {/* Replace this src with your actual public Google Calendar embed link */}
          <iframe 
            src="https://calendar.google.com/calendar/embed?src=phatbanh243%40gmail.com&ctz=Asia%2FHo_Chi_Minh" 
            style={{ borderWidth: 0 }} 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            scrolling="no"
            title="Google Calendar"
            className="rounded-xl"
          ></iframe>
        </div>
      </div>
    </div>
  );
};
