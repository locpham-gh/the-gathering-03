import React from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  ParticipantTile
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

interface LiveKitModalProps {
  token: string;
  serverUrl: string;
  onDisconnect: () => void;
}

export const LiveKitModal: React.FC<LiveKitModalProps> = ({
  token,
  serverUrl,
  onDisconnect,
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-6xl px-4 flex justify-center pointer-events-none text-slate-800">
      <LiveKitRoom
        video={true}
        audio={true}
        connect={true}
        token={token}
        serverUrl={serverUrl}
        onDisconnected={onDisconnect}
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
      >
        <CustomVideoGrid />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

const CustomVideoGrid = () => {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <div className="flex flex-col items-center gap-3 pointer-events-auto transition-all">
      {/* Horizontal Camera Array (Floating independently) */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
        {tracks.map((track) => (
          <div 
            key={`${track.participant.identity}-${track.source}`} 
            className="w-[160px] h-[120px] md:w-[200px] md:h-[150px] rounded-2xl overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] border-2 border-white bg-slate-100 shrink-0"
          >
             <ParticipantTile trackRef={track} />
          </div>
        ))}
      </div>
      
      {/* Control Bar - Floating Pill */}
      <div className="flex justify-center bg-white/95 backdrop-blur-xl px-4 py-1.5 rounded-full border border-slate-200 shadow-xl text-slate-700">
         <ControlBar variation="minimal" controls={{ chat: false, leave: false }} style={{ background: 'transparent', boxShadow: 'none', padding: 0, minHeight: 'auto' }} />
      </div>
    </div>
  );
};
