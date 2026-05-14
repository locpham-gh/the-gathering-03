import React, { useEffect, useRef } from "react";
import {
  LiveKitRoom,
  ControlBar,
  useTracks,
  useLocalParticipant,
  useRemoteParticipants
} from "@livekit/components-react";
import { Track, Participant } from "livekit-client";
import type { RemotePlayer } from "../../../hooks/useMultiplayer";
import type { Zone } from "../core/zones";
import { Lock, Music } from "lucide-react";
import { ChillZoneManager } from "./ChillZoneManager";

// Proximity radius in game pixels — cameras only show within this range
const CAMERA_PROXIMITY = 300;

interface LiveKitModalProps {
  token: string;
  serverUrl: string;
  onDisconnect: () => void;
  players: Record<string, RemotePlayer>;
  localPosition: { x: number; y: number };
  currentZone: Zone | null;
  worldRef: React.RefObject<any>;
}

export const LiveKitModal: React.FC<LiveKitModalProps> = ({
  token,
  serverUrl,
  onDisconnect,
  players,
  localPosition,
  currentZone,
  worldRef,
}) => {
  return (
    <div className="absolute inset-0 z-[100] w-full h-full pointer-events-none text-slate-800 overflow-hidden">
      <LiveKitRoom
        video={true}
        audio={true}
        connect={true}
        token={token}
        serverUrl={serverUrl}
        onDisconnected={onDisconnect}
        style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}
      >
        <FloatingVideoGrid currentZone={currentZone} players={players} localPosition={localPosition} worldRef={worldRef} />
        <ChillZoneManager currentZone={currentZone} />
        <SpatialAudioRenderer 
          players={players} 
          localPosition={localPosition} 
          currentZone={currentZone} 
        />
      </LiveKitRoom>
    </div>
  );
};

const FloatingVideoGrid: React.FC<{
  currentZone: Zone | null;
  players: Record<string, RemotePlayer>;
  localPosition: { x: number; y: number };
  worldRef: React.RefObject<any>;
}> = ({ currentZone, players, localPosition, worldRef }) => {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  const { localParticipant } = useLocalParticipant();

  const screenShareTracks = tracks.filter((t) => t.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);

  // Filter tracks: own camera always visible, remote cameras only within proximity
  const visibleCameraTracks = cameraTracks.filter((track) => {
    if (track.participant.identity === localParticipant?.identity) return true;
    const remotePlayer = Object.values(players).find(
      (rp) => rp.userId === track.participant.identity || rp.id === track.participant.identity
    );
    if (!remotePlayer) return false;
    const dist = Math.sqrt(
      Math.pow(remotePlayer.x - localPosition.x, 2) +
      Math.pow(remotePlayer.y - localPosition.y, 2)
    );
    return dist <= CAMERA_PROXIMITY;
  });

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* 1. ScreenShare - Fixed in center */}
      {screenShareTracks.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-none z-[200]">
           {screenShareTracks.map(track => (
              <div key={`${track.participant.identity}-screen`} className="w-[80vw] h-[80vh] max-w-[1200px] pointer-events-auto rounded-xl overflow-hidden shadow-2xl border-4 border-indigo-500 bg-slate-900">
                <VideoTile track={track} isMuted={false} />
              </div>
           ))}
        </div>
      )}

      {/* 2. Floating Cameras */}
      {visibleCameraTracks.map((track) => {
         const isLocal = track.participant.identity === localParticipant?.identity;
         const player = isLocal ? localPosition : Object.values(players).find(
           (rp) => rp.userId === track.participant.identity || rp.id === track.participant.identity
         );
         if (!player) return null;

         const displayName = isLocal ? "You" : (player as RemotePlayer).displayName || track.participant.name || "";
         const playerKey = isLocal ? "local" : ((player as RemotePlayer).userId || (player as RemotePlayer).id);

         return (
           <FloatingVideoNode 
             key={track.participant.identity}
             track={track}
             isMuted={isLocal}
             displayName={displayName}
             playerKey={playerKey}
             worldRef={worldRef}
           />
         );
      })}

      {/* 3. Control Bar at bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-3 z-[250]">
         {currentZone?.id === "chill" ? (
          <div className="flex items-center gap-2 bg-emerald-700/90 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-[0_0_15px_rgba(16,185,129,0.5)] backdrop-blur-md mb-2 animate-pulse">
            <Music size={14} className="text-emerald-200" />
            <span>Chill Zone 🌿 — Mic &amp; Cam off</span>
          </div>
        ) : currentZone ? (
          <div className="flex items-center gap-2 bg-indigo-600/90 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-[0_0_15px_rgba(79,70,229,0.5)] backdrop-blur-md mb-2">
             <Lock size={14} className="text-indigo-200" />
             <span>Isolated Audio: {currentZone.label}</span>
          </div>
        ) : null}
        
        <div className="flex justify-center bg-white/95 backdrop-blur-xl px-4 py-1.5 rounded-full border border-slate-200 shadow-xl text-slate-700">
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
    </div>
  );
};

const FloatingVideoNode: React.FC<{
  track: any;
  isMuted: boolean;
  displayName: string;
  playerKey: string;
  worldRef: React.RefObject<any>;
}> = ({ track, isMuted, displayName, playerKey, worldRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const bar1Ref = useRef<HTMLDivElement>(null);
  const bar2Ref = useRef<HTMLDivElement>(null);
  const bar3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    const updatePosition = () => {
      // 1. Update Spatial Position
      if (containerRef.current && worldRef.current) {
        const container = worldRef.current as any;
        const pos = container.playerPositions?.[playerKey];
        
        if (pos) {
          const targetX = pos.x + 32;
          const targetY = pos.y - 40;

          const pivotX = worldRef.current.pivot.x;
          const pivotY = worldRef.current.pivot.y;
          const posX = worldRef.current.position.x;
          const posY = worldRef.current.position.y;
          const scaleX = worldRef.current.scale.x;
          const scaleY = worldRef.current.scale.y;

          const screenX = (targetX - pivotX) * scaleX + posX;
          const screenY = (targetY - pivotY) * scaleY + posY;

          containerRef.current.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -100%)`;
        }
      }

      // 2. Update Audio Meter Visualizer
      if (track.participant && videoWrapRef.current && bar1Ref.current && bar2Ref.current && bar3Ref.current) {
         const level = track.participant.audioLevel || 0;
         const isSpeaking = track.participant.isSpeaking;
         
         if (isSpeaking && level > 0.005) {
            // level usually 0.05 - 0.5. Scale it for height (max 14px)
            const h = Math.min(14, Math.max(3, level * 60));
            bar1Ref.current.style.height = `${h * 0.6}px`;
            bar2Ref.current.style.height = `${h}px`;
            bar3Ref.current.style.height = `${h * 0.8}px`;
            
            videoWrapRef.current.style.boxShadow = `0 0 ${h * 1.5}px rgba(52,211,153,0.8)`;
            videoWrapRef.current.style.borderColor = 'rgb(52,211,153)';
         } else {
            bar1Ref.current.style.height = `2px`;
            bar2Ref.current.style.height = `2px`;
            bar3Ref.current.style.height = `2px`;
            
            videoWrapRef.current.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
            videoWrapRef.current.style.borderColor = 'white';
         }
      }

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    updatePosition();
    return () => cancelAnimationFrame(animationFrameId);
  }, [playerKey, worldRef, track.participant]);

  return (
    <div 
      ref={containerRef}
      className="absolute top-0 left-0 pointer-events-auto transition-opacity duration-200 will-change-transform z-50 flex flex-col items-center"
      style={{ width: "100px" }}
    >
      <div className="relative">
        <div 
          ref={videoWrapRef}
          className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.3)] border-[3px] border-white bg-slate-800 shrink-0 transition-colors duration-100"
        >
           <VideoTile track={track} isMuted={isMuted} />
        </div>
        
        {/* Audio Meter Bubbles */}
        <div className="absolute -bottom-1 -right-1 bg-slate-900/90 p-1.5 rounded-full border border-slate-700 flex items-end justify-center gap-[2px] h-5 w-5 backdrop-blur-md shadow-md z-10 overflow-hidden">
          <div ref={bar1Ref} className="w-0.5 bg-emerald-400 rounded-full will-change-[height]" style={{ height: '2px', transition: 'height 0.05s linear' }} />
          <div ref={bar2Ref} className="w-0.5 bg-emerald-400 rounded-full will-change-[height]" style={{ height: '2px', transition: 'height 0.05s linear' }} />
          <div ref={bar3Ref} className="w-0.5 bg-emerald-400 rounded-full will-change-[height]" style={{ height: '2px', transition: 'height 0.05s linear' }} />
        </div>
      </div>

      {displayName && (
        <div className="mt-1.5">
          <span className="text-white text-xs font-semibold bg-black/70 px-2.5 py-0.5 rounded-full shadow-sm whitespace-nowrap backdrop-blur-sm">
            {displayName}
          </span>
        </div>
      )}
    </div>
  );
};

/** Dedicated video tile — attaches track via useEffect for instant display */
const VideoTile: React.FC<{ track: any; isMuted: boolean }> = ({ track, isMuted }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    const mediaTrack = track.publication?.track;
    if (el && mediaTrack) {
      mediaTrack.attach(el);
      return () => { mediaTrack.detach(el); };
    }
  }, [track.publication?.track]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted={isMuted}
      playsInline
      className="w-full h-full object-cover"
    />
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
        let pan = 0; // -1 (left) to 1 (right)
        
        if (remotePlayer) {
          const dx = remotePlayer.x - localPosition.x;
          // Pan reaches maximum at 400px distance horizontally
          pan = Math.max(-1, Math.min(1, dx / 400));

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
              Math.pow(dx, 2) + 
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
            pan={pan}
          />
        );
      })}
    </div>
  );
};

const ParticipantAudio: React.FC<{ participant: Participant; volume: number; pan: number }> = ({ participant, volume, pan }) => {
  const audioTracks = Array.from(participant.audioTrackPublications.values());
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const pannerRef = useRef<StereoPannerNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // 1. Initialize Web Audio API graph
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass || !audioRef.current) return;

    // Create the audio context
    const ctx = new AudioContextClass();
    contextRef.current = ctx;

    try {
      // Route the <audio> element through the Web Audio API
      const source = ctx.createMediaElementSource(audioRef.current);
      const panner = ctx.createStereoPanner();
      
      source.connect(panner);
      panner.connect(ctx.destination);
      
      pannerRef.current = panner;
      sourceRef.current = source;

      // Resume context if suspended (browser auto-play policy)
      if (ctx.state === "suspended") {
        const resumeCtx = () => {
          ctx.resume().catch(console.error);
          document.removeEventListener("click", resumeCtx);
        };
        document.addEventListener("click", resumeCtx);
      }
    } catch(e) {
      console.warn("Failed to create MediaElementSource. Falling back to normal audio.", e);
    }

    return () => {
      if (pannerRef.current) pannerRef.current.disconnect();
      if (sourceRef.current) sourceRef.current.disconnect();
      if (ctx.state !== "closed") ctx.close().catch(console.error);
    };
  }, []);

  // 2. Update Volume and Panning
  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl) {
      audioEl.volume = volume;
    }
    
    if (pannerRef.current) {
      const ctx = contextRef.current;
      if (ctx && ctx.state === "running") {
        // Smoothly glide the pan value over 0.1 seconds to prevent audio cracking/popping
        pannerRef.current.pan.setTargetAtTime(pan, ctx.currentTime, 0.1);
      } else {
        pannerRef.current.pan.value = pan;
      }
    }
  }, [volume, pan]);

  // 3. Attach LiveKit track to <audio> element
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

  // crossOrigin="anonymous" is often needed for createMediaElementSource
  return <audio ref={audioRef} autoPlay playsInline crossOrigin="anonymous" />;
};
