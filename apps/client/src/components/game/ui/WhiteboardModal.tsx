import React, { useState, useEffect, useCallback, useRef } from "react";
// @ts-ignore - Excalidraw types can be complex to resolve in some environments
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { X, Save, Share2, Crown, Eye, Loader2 } from "lucide-react";

interface WhiteboardModalProps {
  onClose: () => void;
  roomId?: string;
  sendMessage: (type: string, payload: unknown) => void;
  isLeader?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const WhiteboardModal: React.FC<WhiteboardModalProps> = ({
  onClose,
  roomId,
  sendMessage,
  isLeader = true,
}) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isRemoteUpdate = useRef(false);
  const lastSentTime = useRef(0);

  // Load initial state from server
  useEffect(() => {
    if (!excalidrawAPI || !roomId) return;

    const fetchWhiteboard = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/whiteboard/${roomId}`);
        const result = await res.json();
        if (result.data && result.data.elements?.length > 0) {
          excalidrawAPI.updateScene({
            elements: result.data.elements,
            appState: result.data.appState,
            files: result.data.files
          });
        }
      } catch (err) {
        console.error("Failed to load whiteboard state:", err);
      }
    };

    fetchWhiteboard();
  }, [excalidrawAPI, roomId]);

  // Listen for remote updates
  useEffect(() => {
    const handleRemoteUpdate = (e: CustomEvent) => {
      if (!excalidrawAPI) return;

      const { elements, appState, files } = e.detail;
      isRemoteUpdate.current = true;
      
      // Sanitize appState to remove Map/internal objects that break on serialization
      const sanitizedAppState = { ...appState };
      delete (sanitizedAppState as any).collaborators;
      delete (sanitizedAppState as any).draggingElement;

      excalidrawAPI.updateScene({ elements, appState: sanitizedAppState, files });
      
      // Reset after a short delay to allow the change to propagate without triggering an echo
      setTimeout(() => {
        isRemoteUpdate.current = false;
      }, 100);
    };

    window.addEventListener(
      "whiteboard-update",
      handleRemoteUpdate as EventListener,
    );
    return () =>
      window.removeEventListener(
        "whiteboard-update",
        handleRemoteUpdate as EventListener,
      );
  }, [excalidrawAPI]);

  const onChange = useCallback(
    (
      elements: readonly any[],
      appState: any,
      files: any,
    ) => {
      if (isRemoteUpdate.current) return;
      if (!isLeader) return; // Attendees cannot draw

      const now = Date.now();
      // Throttle updates to 200ms to avoid overwhelming the server
      if (now - lastSentTime.current < 200) return;

      lastSentTime.current = now;
      
      // Clean appState for transmission
      const cleanAppState = { ...appState };
      delete (cleanAppState as any).collaborators;
      delete (cleanAppState as any).draggingElement;
      delete (cleanAppState as any).toast;

      sendMessage("whiteboard_update", {
        roomId,
        elements,
        appState: cleanAppState,
        files,
      });
    },
    [roomId, sendMessage, isLeader],
  );

  const handleSave = async () => {
    if (!excalidrawAPI || !roomId || !isLeader) return;
    setIsSaving(true);
    
    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      const cleanAppState = { ...appState };
      delete (cleanAppState as any).collaborators;
      delete (cleanAppState as any).draggingElement;
      delete (cleanAppState as any).toast;

      await fetch(`${API_BASE_URL}/api/whiteboard/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elements, appState: cleanAppState, files })
      });
    } catch (err) {
      console.error("Failed to save whiteboard:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[85vh] overflow-hidden border border-slate-200 animate-in zoom-in duration-300 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">
                Meeting Whiteboard
              </h2>
              {isLeader ? (
                <span className="flex items-center gap-1 bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  <Crown size={11} /> Leader
                </span>
              ) : (
                <span className="flex items-center gap-1 bg-teal-500/20 text-teal-400 text-xs font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                  <Eye size={11} /> Viewer
                </span>
              )}
            </div>
            <div className="text-teal-400 text-xs font-medium uppercase tracking-widest mt-1">
              {isLeader ? "You are presenting — others can see your board" : "Live session — read-only view"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLeader && (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-teal-600/20">
                  <Share2 size={16} /> Share
                </button>
              </>
            )}
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
            excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
            theme="light"
            onChange={onChange}
          />
          {/* Viewer overlay — block interaction for non-leaders */}
          {!isLeader && (
            <div
              className="absolute inset-0 z-10 cursor-not-allowed"
              title="Viewing only — leader is presenting"
            />
          )}
        </div>
      </div>
    </div>
  );
};
