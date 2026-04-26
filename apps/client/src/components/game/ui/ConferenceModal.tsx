import React from "react";
import { X, Video, Users, MessageSquare, ShieldCheck } from "lucide-react";

interface ConferenceModalProps {
  onClose: () => void;
}

export const ConferenceModal: React.FC<ConferenceModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
              <Video size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">Main Conference Room</h2>
              <div className="flex items-center gap-2 text-teal-400 text-sm font-bold uppercase tracking-widest">
                <ShieldCheck size={14} />
                Encrypted Session Active
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-10">
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-600 mb-4">
                <Users size={20} />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Participants</h4>
              <p className="text-sm text-slate-500">Up to 50 people can join this room.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-600 mb-4">
                <Video size={20} />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">HD Video</h4>
              <p className="text-sm text-slate-500">High quality streaming with low latency.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-600 mb-4">
                <MessageSquare size={20} />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Screen Share</h4>
              <p className="text-sm text-slate-500">Collaborate with live screen sharing.</p>
            </div>
          </div>

          <div className="bg-teal-50 rounded-2xl p-6 border border-teal-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-teal-900">Ready to start the meeting?</h3>
              <p className="text-teal-700 text-sm font-medium">Entering this room will activate your microphone and camera.</p>
            </div>
            <button 
              onClick={onClose}
              className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-4 rounded-xl font-black shadow-lg shadow-teal-600/20 transition-all transform hover:scale-105 active:scale-95"
            >
              Join Meeting
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Powered by The Gathering Video Core</p>
        </div>

      </div>
    </div>
  );
};
