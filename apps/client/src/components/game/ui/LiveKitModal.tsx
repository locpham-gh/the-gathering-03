import React, { useEffect, useRef } from "react";
import {
  LiveKitRoom,
  ControlBar,
  useTracks,
  ParticipantTile,
  useRemoteParticipants,
  useConnectionState
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import type { RemotePlayer } from "../../../hooks/useMultiplayer";
import type { Zone } from "../core/zones";
import { Lock } from "lucide-react";

interface LiveKitModalProps {
  token: string;
  serverUrl: string;
  onDisconnect: () => void;
  players: Record<string, RemotePlayer>;
  localPosition: { x: number; y: number };
  currentZone: Zone | null;
}

export const LiveKitModal: React.FC<LiveKitModalProps> = ({
  token,
  serverUrl,
  onDisconnect,
  players,
  localPosition,
  currentZone,
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
        <CustomVideoGrid currentZone={currentZone} />
        <SpatialAudioRenderer 
          players={players} 
          localPosition={localPosition} 
          currentZone={currentZone} 
        />
      </LiveKitRoom>
    </div>
  );
};

const CustomVideoGrid: React.FC<{ currentZone: Zone | null }> = ({ currentZone }) => {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <div className="flex flex-col items-center gap-3 pointer-events-auto transition-all">
      {currentZone && (
        <div className="flex items-center gap-2 bg-indigo-600/90 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-[0_0_15px_rgba(79,70,229,0.5)] backdrop-blur-md mb-2">
           <Lock size={14} className="text-indigo-200" />
           <span>Isolated Audio: {currentZone.label}</span>
        </div>
      )}
      {/* Horizontal Camera Array (Floating independently) */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
        {tracks.map((track) => (
          <div 
            key={`${track.participant.identity}-${track.source}`} 
            className="w-[160px] h-[120px] md:w-[200px] md:h-[150px] rounded-2xl overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] border-2 border-white bg-slate-100 shrink-0 relative"
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

const SpatialAudioRenderer: React.FC<{
  players: Record<string, RemotePlayer>;
  localPosition: { x: number; y: number };
  currentZone: Zone | null;
}> = ({ players, localPosition, currentZone }) => {
  const participants = useRemoteParticipants();

  return (
    <div style={{ display: "none" }}>
      {participants.map((p) => {
        // Find remote player in the game state matching the identity (user.id)
        const remotePlayer = Object.values(players).find((rp) => rp.userId === p.identity || rp.id === p.identity);
        
        let volume = 0;
        
        if (remotePlayer) {
          // Are they in the same private zone?
          // If we have a robust zone tracking for other players, we could check that.
          // For now, if we are in a zone, we might want everyone in that zone to hear each other.
          // Since we don't have remote player zone data directly, we can check their coordinates!
          
          let sameZone = false;
          if (currentZone) {
            const rx = remotePlayer.x;
            const ry = remotePlayer.y;
            if (rx >= currentZone.x && rx <= currentZone.x + currentZone.width &&
                ry >= currentZone.y && ry <= currentZone.y + currentZone.height) {
              sameZone = true;
            }
          }

          if (sameZone) {
            volume = 1.0;
          } else {
            // Euclidean distance
            const dist = Math.sqrt(
              Math.pow(remotePlayer.x - localPosition.x, 2) + 
              Math.pow(remotePlayer.y - localPosition.y, 2)
            );
            
            // Max hearing distance = 400px
            const maxDist = 400;
            if (dist < maxDist) {
              volume = 1 - (dist / maxDist);
            }
          }
        }
        
        return (
          <ParticipantAudio 
            key={p.identity} 
            participant={p} 
            volume={volume} 
          />
        );
      })}
    </div>
  );
};

const ParticipantAudio: React.FC<{ participant: any; volume: number }> = ({ participant, volume }) => {
  const audioTracks = Array.from(participant.audioTrackPublications.values()) as any[];
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const trackPub = audioTracks.find((t) => t.track);
    if (trackPub && trackPub.track && audioRef.current) {
      trackPub.track.attach(audioRef.current);
    }
    return () => {
      if (trackPub && trackPub.track && audioRef.current) {
        trackPub.track.detach(audioRef.current);
      }
    };
  }, [audioTracks]);

  return <audio ref={audioRef} autoPlay />;
};
