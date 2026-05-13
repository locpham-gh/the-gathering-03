import React from "react";
import { X, ExternalLink, Globe } from "lucide-react";

interface IframeModalProps {
  url: string | null;
  onClose: () => void;
}

export const IframeModal: React.FC<IframeModalProps> = ({ url, onClose }) => {
  if (!url) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-slate-50 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Shared Content</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <ExternalLink size={10} />
                <a href={url} target="_blank" rel="noreferrer" className="hover:text-indigo-500 hover:underline truncate max-w-[200px] sm:max-w-md block">
                  {url}
                </a>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-100 p-2 sm:p-4">
          <div className="w-full h-full rounded-2xl overflow-hidden bg-white shadow-inner border border-slate-200">
            <iframe 
              src={url} 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
