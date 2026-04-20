import { Mic, MicOff, Video, VideoOff } from "lucide-react";

interface MediaControlBarProps {
  micEnabled: boolean;
  cameraEnabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
}

export function MediaControlBar({
  micEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
}: MediaControlBarProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-60 pointer-events-auto">
      <div className="bg-white/95 backdrop-blur border border-slate-200 shadow-lg rounded-full px-3 py-2 flex items-center gap-2">
        <button
          onClick={onToggleMic}
          className={`w-9 h-9 rounded-full flex items-center justify-center ${
            micEnabled
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
          title={micEnabled ? "Mute mic" : "Unmute mic"}
        >
          {micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
        </button>
        <button
          onClick={onToggleCamera}
          className={`w-9 h-9 rounded-full flex items-center justify-center ${
            cameraEnabled
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
          title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {cameraEnabled ? <Video size={16} /> : <VideoOff size={16} />}
        </button>
      </div>
    </div>
  );
}
