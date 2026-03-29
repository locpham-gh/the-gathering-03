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
          {zone.id === "reception" && <ReceptionContent />}
          {zone.id === "library" && <LibraryContent />}
          {zone.id === "forum" && <ForumContent />}
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

function ReceptionContent() {
  return (
    <div className="space-y-3">
      <div className="p-4 bg-slate-800/30 rounded-xl">
        <h3 className="text-white font-semibold mb-2">Welcome!</h3>
        <p className="text-slate-400 text-sm">
          Check in at the reception desk to let your team know you are online.
        </p>
      </div>
      <button className="w-full px-4 py-3 bg-primary hover:bg-primary/80 text-white rounded-xl transition-colors">
        Check In
      </button>
    </div>
  );
}

function LibraryContent() {
  return (
    <div className="space-y-3">
      <div className="p-4 bg-slate-800/30 rounded-xl">
        <h3 className="text-white font-semibold mb-2">Resources</h3>
        <p className="text-slate-400 text-sm">
          Browse documentation, guides, and learning materials.
        </p>
      </div>
      <button className="w-full px-4 py-3 bg-primary hover:bg-primary/80 text-white rounded-xl transition-colors">
        Browse Library
      </button>
    </div>
  );
}

function ForumContent() {
  return (
    <div className="space-y-3">
      <div className="p-4 bg-slate-800/30 rounded-xl">
        <h3 className="text-white font-semibold mb-2">Discussions</h3>
        <p className="text-slate-400 text-sm">
          Join conversations with your team members.
        </p>
      </div>
      <button className="w-full px-4 py-3 bg-primary hover:bg-primary/80 text-white rounded-xl transition-colors">
        View Forum
      </button>
    </div>
  );
}
