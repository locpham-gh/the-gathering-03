import React, { useEffect, useRef } from "react";
import {
  LiveKitRoom,
  ControlBar,
  useTracks,
  ParticipantTile,
  useRemoteParticipants
} from "@livekit/components-react";
import { Track, Participant } from "livekit-client";
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
        style={{ width: "100%", display: "flex", justifyContent: "center", transform: "translateZ(0)", willChange: "transform" }}
      >
        <CustomVideoGrid 
          currentZone={currentZone} 
          players={players} 
          localPosition={localPosition} 
        />
        <SpatialAudioRenderer 
          players={players} 
          localPosition={localPosition} 
          currentZone={currentZone} 
        />
      </LiveKitRoom>
    </div>
  );
};

const CustomVideoGrid: React.FC<{ 
  currentZone: Zone | null;
  players: Record<string, RemotePlayer>;
  localPosition: { x: number; y: number };
}> = ({ currentZone, players, localPosition }) => {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const isAvZone = currentZone && currentZone.id !== "library";

  // Filter tracks based on proximity or zone
  const visibleTracks = tracks.filter((track) => {
    // Always show screen shares
    if (track.source === Track.Source.ScreenShare) return true;

    // Find remote player matching the track
    const remotePlayer = Object.values(players).find(
      (rp) => rp.userId === track.participant.identity || rp.id === track.participant.identity
    );

    // If it's a local participant, we decide if we show our own camera
    if (track.participant.isLocal) {
      // We'll show local camera if there is ANY remote player nearby or in the same zone
      // Or if we are in a zone
      return true; // Usually people want to see themselves if they have camera on
    }

    if (remotePlayer) {
      if (isAvZone) {
        // If in a zone, show people in the same zone
        const rx = remotePlayer.x;
        const ry = remotePlayer.y;
        if (
          rx >= currentZone!.x &&
          rx <= currentZone!.x + currentZone!.width &&
          ry >= currentZone!.y &&
          ry <= currentZone!.y + currentZone!.height
        ) {
          return true;
        }
      } else {
        // Not in a zone, check distance
        const dist = Math.sqrt(
          Math.pow(remotePlayer.x - localPosition.x, 2) + Math.pow(remotePlayer.y - localPosition.y, 2)
        );
        return dist < 400;
      }
    }
    
    return false;
  });

  // If no one else is visible (and we are not screen sharing), maybe we don't need to show the UI
  // But we still need the control bar. Let's just render the visible tracks.
  const hasVisiblePeers = visibleTracks.some(t => !t.participant.isLocal);

  // If we are not near anyone and not in a zone, we might want to hide the whole grid to save screen space
  // but we still show it if the user turned on their own camera?
  // Let's hide the video grid completely if no peers are nearby AND we aren't in a zone
  // Wait, if we hide the control bar, they can't turn on their mic/cam.
  // We should always show the control bar.

  return (
    <div className="flex flex-col items-center gap-3 pointer-events-auto transition-all" style={{ transform: "translateZ(0)", willChange: "transform" }}>
      {isAvZone && (
        <div className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-[0_0_15px_rgba(79,70,229,0.5)] mb-2">
           <Lock size={14} className="text-indigo-200" />
           <span>Isolated Audio: {currentZone.label}</span>
        </div>
      )}
      {/* Horizontal Camera Array (Floating independently) */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full" style={{ transform: "translateZ(0)" }}>
        {(hasVisiblePeers || isAvZone) && visibleTracks.map((track) => {
          const isScreenShare = track.source === Track.Source.ScreenShare;
          return (
            <div 
              key={`${track.participant.identity}-${track.source}`} 
              className={`${
                isScreenShare 
                  ? "w-[480px] h-[360px] md:w-[640px] md:h-[480px] border-indigo-500 shadow-indigo-500/20" 
                  : "w-[160px] h-[120px] md:w-[200px] md:h-[150px] border-white"
              } rounded-2xl overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] border-2 bg-slate-100 shrink-0 relative transition-all duration-500`}
              style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
            >
               <ParticipantTile trackRef={track} />
            </div>
          );
        })}
      </div>
      
      {/* Control Bar - Floating Pill */}
      <div className="flex justify-center bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-xl text-slate-700">
         <ControlBar 
           variation="minimal" 
           controls={{ 
             chat: false, 
             leave: false, 
             screenShare: currentZone?.id === "presentation" || currentZone?.id === "conference"
           }} 
           style={{ background: 'transparent', boxShadow: 'none', padding: 0, minHeight: 'auto' }} 
         />
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
          const isAvZone = currentZone && currentZone.id !== "library";
          if (isAvZone) {
            const rx = remotePlayer.x;
            const ry = remotePlayer.y;
            if (rx >= currentZone!.x && rx <= currentZone!.x + currentZone!.width &&
                ry >= currentZone!.y && ry <= currentZone!.y + currentZone!.height) {
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

const ParticipantAudio: React.FC<{ participant: Participant; volume: number }> = ({ participant, volume }) => {
  const audioTracks = Array.from(participant.audioTrackPublications.values());
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl) {
      audioEl.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const trackPub = audioTracks.find((t) => t.track);
    const audioEl = audioRef.current;
    if (trackPub && trackPub.track && audioEl) {
      trackPub.track.attach(audioEl);
    }
    return () => {
      if (trackPub && trackPub.track && audioEl) {
        trackPub.track.detach(audioEl);
      }
    };
  }, [audioTracks]);

  return <audio ref={audioRef} autoPlay />;
};
