import { useState, useEffect } from "react";
import { resourcesApi } from "../../lib/api";
import type { Zone } from "./zones";

interface ZoneModalProps {
  zone: Zone;
  onClose: () => void;
}

export function ZoneModal({ zone, onClose }: ZoneModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass p-8 rounded-2xl w-[480px] max-w-[90vw] shadow-2xl border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{zone.label}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-400"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>

        <p className="text-slate-300 mb-6">{zone.description}</p>

        <div className="space-y-4">
          <LibraryContent />
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 bg-primary/20 hover:bg-primary/30 text-white rounded-xl transition-colors border border-primary/30"
        >
          Press ESC or click here to leave
        </button>
      </div>
    </div>
  );
}

interface Resource {
  _id: string;
  type: string;
  title: string;
  size: number;
  fileUrl: string;
}

function LibraryContent() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resourcesApi
      .getAll()
      .then((res) => setResources(res.resources))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="text-slate-400 animate-pulse">Loading resources...</div>
    );

  return (
    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
      {resources.length === 0 ? (
        <p className="text-slate-500 text-sm">No resources available.</p>
      ) : (
        resources.map((res) => (
          <div
            key={res._id}
            className="p-4 bg-slate-800/40 rounded-xl border border-white/5 flex items-center justify-between hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                {res.type === "pdf" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-red-400"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M5 18h1.5a1.5 1.5 0 0 0 0-3H5v6" />
                    <path d="M11 18h1.5a1.5 1.5 0 0 0 0-3H11v6" />
                    <path d="M17 18h1.5a1.5 1.5 0 0 0 0-3H17v6" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-400"
                  >
                    <rect width="20" height="15" x="2" y="3" rx="2" ry="2" />
                    <polyline points="8 21 12 17 16 21" />
                    <line x1="2" x2="22" y1="12" y2="12" />
                  </svg>
                )}
              </div>
              <div>
                <h4 className="text-white text-sm font-medium">{res.title}</h4>
                <p className="text-slate-500 text-xs">
                  {(res.size / 1024).toFixed(1)} KB • {res.type.toUpperCase()}
                </p>
              </div>
            </div>
            <a
              href={res.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-white/10 rounded-lg text-primary transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
            </a>
          </div>
        ))
      )}
    </div>
  );
}
