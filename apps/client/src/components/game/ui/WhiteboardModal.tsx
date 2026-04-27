import React, { useState, useEffect } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { X, Save, Share2 } from "lucide-react";

interface WhiteboardModalProps {
  onClose: () => void;
  roomId?: string;
}

export const WhiteboardModal: React.FC<WhiteboardModalProps> = ({ onClose, roomId }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[85vh] overflow-hidden border border-slate-200 animate-in zoom-in duration-300 flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Interactive Whiteboard</h2>
            <div className="text-teal-400 text-xs font-medium uppercase tracking-widest mt-1">
              {roomId ? `Room: ${roomId}` : "Public Space"}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Save size={16} /> Save
            </button>
            <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-teal-600/20">
              <Share2 size={16} /> Share
            </button>
            <button 
              onClick={onClose}
              className="ml-2 text-slate-400 hover:text-white p-2 transition-colors rounded-full hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Excalidraw Canvas */}
        <div className="flex-1 relative bg-slate-50">
          <Excalidraw 
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            theme="light"
          />
        </div>

      </div>
    </div>
  );
};
