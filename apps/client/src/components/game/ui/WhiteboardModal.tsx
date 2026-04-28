import React, { useState, useEffect, useCallback, useRef } from "react";
// @ts-expect-error - Excalidraw types might not be resolved correctly
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { X, Save, Share2 } from "lucide-react";

interface WhiteboardModalProps {
  onClose: () => void;
  roomId?: string;
  sendMessage: (type: string, payload: unknown) => void;
}

interface ExcalidrawAPI {
  updateScene: (scene: {
    elements: unknown;
    appState: unknown;
    files: unknown;
  }) => void;
}

export const WhiteboardModal: React.FC<WhiteboardModalProps> = ({
  onClose,
  roomId,
  sendMessage,
}) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawAPI | null>(
    null,
  );
  const isRemoteUpdate = useRef(false);
  const lastSentTime = useRef(0);

  // Listen for remote updates
  useEffect(() => {
    const handleRemoteUpdate = (e: CustomEvent) => {
      if (!excalidrawAPI) return;

      const { elements, appState, files } = e.detail;
      isRemoteUpdate.current = true;
      excalidrawAPI.updateScene({ elements, appState, files });
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
      elements: readonly unknown[],
      appState: Record<string, unknown>,
      files: unknown,
    ) => {
      if (isRemoteUpdate.current) return;

      const now = Date.now();
      // Throttle updates to 200ms to avoid overwhelming the server
      if (now - lastSentTime.current < 200) return;

      lastSentTime.current = now;
      sendMessage("whiteboard_update", {
        roomId,
        elements,
        appState: { ...appState, collaborate: true },
        files,
      });
    },
    [roomId, sendMessage],
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[85vh] overflow-hidden border border-slate-200 animate-in zoom-in duration-300 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Collaborative Whiteboard
            </h2>
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
            excalidrawAPI={(api: ExcalidrawAPI) => setExcalidrawAPI(api)}
            theme="light"
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  );
};
