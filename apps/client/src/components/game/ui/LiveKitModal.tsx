import React, { useEffect, useRef } from "react";
import {
  LiveKitRoom,
  ControlBar,
  useTracks,
  useLocalParticipant,
  useRemoteParticipants,
} from "@livekit/components-react";
import { Track, Participant } from "livekit-client";
import type { RemotePlayer } from "../../../hooks/useMultiplayer";
import type { Zone } from "../core/zones";
import { ChillZoneManager } from "./ChillZoneManager";
import { Maximize2, Minimize2 } from "lucide-react";

// Keep tile close above character head.
const VIDEO_GAP = 6;
const SPRITE_HEAD_OFFSET = 8;
const CAMERA_CONNECT_DISTANCE = 220;
const CONNECTED_PAIR_GAP = 220;
const CONNECTED_PAIR_RAISE = 20;

interface LiveKitModalProps {
  token: string;
  serverUrl: string;
  onDisconnect: () => void;
  players: Record<string, RemotePlayer>;
  localPosition: { x: number; y: number };
  currentZone: Zone | null;
  localIsBusy: boolean;
  cameraTransform: { x: number; y: number };
}

const distance = (
  a: { x: number; y: number },
  b: { x: number; y: number },
) => Math.hypot(a.x - b.x, a.y - b.y);

export const LiveKitModal: React.FC<LiveKitModalProps> = ({
  token,
  serverUrl,
  onDisconnect,
  players,
  localPosition,
  currentZone,
  localIsBusy,
  cameraTransform,
}) => {
  return (
    <div className="absolute inset-0 z-[100] pointer-events-none text-slate-800">
      <LiveKitRoom
        video={true}
        audio={true}
        connect={true}
        token={token}
        serverUrl={serverUrl}
        onDisconnected={onDisconnect}
        style={{ width: "100%", height: "100%" }}
      >
        <AvatarVideoLayer
          currentZone={currentZone}
          players={players}
          localPosition={localPosition}
          localIsBusy={localIsBusy}
          cameraTransform={cameraTransform}
        />
        <ScreenShareLayer />
        <ChillZoneManager currentZone={currentZone} />
        <SpatialAudioRenderer
          players={players}
          localPosition={localPosition}
          currentZone={currentZone}
          localIsBusy={localIsBusy}
        />
      </LiveKitRoom>
    </div>
  );
};

const AvatarVideoLayer: React.FC<{
  currentZone: Zone | null;
  players: Record<string, RemotePlayer>;
  localPosition: { x: number; y: number };
  localIsBusy: boolean;
  cameraTransform: { x: number; y: number };
}> = ({ currentZone, players, localPosition, localIsBusy, cameraTransform }) => {
  const lastPairDebugRef = useRef<string>("");
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.Microphone, withPlaceholder: true },
    ],
    { onlySubscribed: false },
  );
  const { localParticipant } = useLocalParticipant();

  const readinessByIdentity = new Map<
    string,
    { cameraReady: boolean; micReady: boolean }
  >();
  tracks.forEach((t) => {
    const id = t.participant.identity;
    const prev = readinessByIdentity.get(id) || {
      cameraReady: false,
      micReady: false,
    };
    if (t.source === Track.Source.Camera) {
      prev.cameraReady = !t.publication?.isMuted;
    } else if (t.source === Track.Source.Microphone) {
      prev.micReady = !t.publication?.isMuted;
    }
    readinessByIdentity.set(id, prev);
  });

  const localIdentity = localParticipant?.identity || "";
  const localReadyFromTracks = localIdentity
    ? readinessByIdentity.get(localIdentity)
    : undefined;
  const localReady = Boolean(
    localReadyFromTracks?.cameraReady &&
      !localIsBusy &&
      currentZone?.id !== "chill",
  );

  useEffect(() => {
    if (!localParticipant) return;
    if ((localIsBusy || currentZone?.id === "chill")) {
      if (localParticipant.isCameraEnabled) localParticipant.setCameraEnabled(false);
      if (localParticipant.isMicrophoneEnabled) localParticipant.setMicrophoneEnabled(false);
    }
  }, [localParticipant, localIsBusy, currentZone?.id]);

  useEffect(() => {
    const handleHostMute = () => {
      if (localParticipant && localParticipant.isMicrophoneEnabled) {
        localParticipant.setMicrophoneEnabled(false);
        // Optional: Dispatch a toast or alert
        alert("Chủ phòng đã tắt mic của bạn (Mute All).");
      }
    };
    window.addEventListener("host-mute-all", handleHostMute);
    return () => window.removeEventListener("host-mute-all", handleHostMute);
  }, [localParticipant]);

  const localTrack = tracks.find(
    (t) =>
      t.participant.identity === localParticipant?.identity &&
      t.source === Track.Source.Camera,
  );

  const remoteTracks = tracks.filter((track) => {
    if (track.source !== Track.Source.Camera) return false;
    if (track.participant.identity === localParticipant?.identity) return false;
    const rp = Object.values(players).find(
      (p) => p.userId === track.participant.identity || p.id === track.participant.identity,
    );
    if (!rp || rp.isBusy) return false;
    const remoteReadyState = readinessByIdentity.get(track.participant.identity);
    const remoteReady = Boolean(
      remoteReadyState?.cameraReady,
    );
    if (!remoteReady) return false;
    return true;
  });
  const shouldAutoVideo = localReady;
  const cameraEnabledRemotes = remoteTracks
    .map((track) => ({
      track,
      player: Object.values(players).find(
        (p) =>
          p.userId === track.participant.identity || p.id === track.participant.identity,
      ),
    }))
    .filter((item): item is { track: (typeof remoteTracks)[number]; player: RemotePlayer } =>
      Boolean(item.player),
    );

  // When a nearby participant is close enough, both cameras are enlarged.
  const nearestConnectedIdentity = cameraEnabledRemotes
    .map(({ track, player }) => ({
      identity: track.participant.identity,
      dist: distance(localPosition, { x: player.x, y: player.y }),
    }))
    .sort((a, b) => a.dist - b.dist)[0];
  const connectedIdentity =
    nearestConnectedIdentity && nearestConnectedIdentity.dist <= CAMERA_CONNECT_DISTANCE
      ? nearestConnectedIdentity.identity
      : null;

  const toScreen = (wx: number, wy: number) => ({
    x: Math.round(wx + cameraTransform.x + 32),
    y: Math.round(wy + cameraTransform.y - 64 - SPRITE_HEAD_OFFSET),
  });

  const connectedRemote = connectedIdentity
    ? cameraEnabledRemotes.find(
        ({ track }) => track.participant.identity === connectedIdentity,
      )
    : null;
  const localScreenForPair = toScreen(localPosition.x, localPosition.y);
  const remoteScreenForPair = connectedRemote
    ? toScreen(connectedRemote.player.x, connectedRemote.player.y)
    : null;
  const connectedPairLayout =
    connectedRemote && remoteScreenForPair
      ? {
          centerX: Math.round((localScreenForPair.x + remoteScreenForPair.x) / 2),
          topY: Math.round(
            Math.min(localScreenForPair.y, remoteScreenForPair.y) -
            VIDEO_GAP -
            CONNECTED_PAIR_RAISE
          ),
          localOnLeft: localScreenForPair.x <= remoteScreenForPair.x,
        }
      : null;

  useEffect(() => {
    const debugPairFlag =
      String(import.meta.env.VITE_DEBUG_CAMERA_PAIR || "").toLowerCase() === "true";
    if (!import.meta.env.DEV || !debugPairFlag) return;
    if (!connectedIdentity || !connectedRemote || !connectedPairLayout) return;

    const leftIdentity = connectedPairLayout.localOnLeft
      ? localParticipant?.identity || "local-unknown"
      : connectedIdentity;
    const rightIdentity = connectedPairLayout.localOnLeft
      ? connectedIdentity
      : localParticipant?.identity || "local-unknown";
    const signature = `${leftIdentity}|${rightIdentity}|${Math.round(localScreenForPair.x)}|${Math.round(
      remoteScreenForPair?.x || 0,
    )}`;
    if (signature === lastPairDebugRef.current) return;
    lastPairDebugRef.current = signature;

    console.debug("[camera-pair-mapping]", {
      connectedIdentity,
      localIdentity: localParticipant?.identity,
      leftIdentity,
      rightIdentity,
      localX: Math.round(localScreenForPair.x),
      remoteX: Math.round(remoteScreenForPair?.x || 0),
    });
  }, [
    connectedIdentity,
    connectedPairLayout,
    connectedRemote,
    localParticipant?.identity,
    localScreenForPair.x,
    remoteScreenForPair?.x,
  ]);

  return (
    <>
      <div className="absolute inset-0 pointer-events-none">
        {shouldAutoVideo && localTrack && (
          (() => {
            return (
          <FloatingVideo
            key={`local-${localTrack.participant.identity}`}
            track={localTrack}
            isMuted={true}
            label="You"
            size={connectedIdentity ? "connected" : "normal"}
            style={{
              left: 0,
              top: 0,
              willChange: "transform",
              transform: connectedPairLayout
                ? `translate3d(calc(${connectedPairLayout.centerX + (connectedPairLayout.localOnLeft ? -CONNECTED_PAIR_GAP / 2 : CONNECTED_PAIR_GAP / 2)}px - 50%), calc(${connectedPairLayout.topY}px - 100%), 0)`
                : `translate3d(calc(var(--local-x, ${localPosition.x}px) + var(--cam-x, ${cameraTransform.x}px) + 32px - 50%), calc(var(--local-y, ${localPosition.y}px) + var(--cam-y, ${cameraTransform.y}px) - 64px - ${SPRITE_HEAD_OFFSET}px - 100%), 0)`,
            }}
          />
            );
          })()
        )}

        {remoteTracks.map((track) => {
          const rp = Object.values(players).find(
            (p) => p.userId === track.participant.identity || p.id === track.participant.identity,
          );
          if (!rp) return null;
          const s = toScreen(rp.x, rp.y);
          return (
            <FloatingVideo
              key={`${track.participant.identity}-${track.source}`}
              track={track}
              isMuted={false}
              label={rp.displayName || track.participant.name || ""}
              size={
                connectedIdentity === track.participant.identity
                  ? "connected"
                  : "normal"
              }
              style={{
                left: 0,
                top: 0,
                willChange: "transform",
                transform: `translate3d(calc(${
                  connectedPairLayout && connectedIdentity === track.participant.identity
                    ? connectedPairLayout.centerX +
                      (connectedPairLayout.localOnLeft
                        ? CONNECTED_PAIR_GAP / 2
                        : -CONNECTED_PAIR_GAP / 2)
                    : s.x
                }px - 50%), calc(${
                  connectedPairLayout && connectedIdentity === track.participant.identity
                    ? connectedPairLayout.topY
                    : s.y - VIDEO_GAP
                }px - 100%), 0)`,
              }}
            />
          );
        })}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="flex justify-center bg-white/95 backdrop-blur-xl px-4 py-1.5 rounded-full border border-slate-200 shadow-xl text-slate-700">
          <ControlBar
            variation="minimal"
            controls={{
              chat: false,
              leave: false,
              screenShare: true,
            }}
            style={{
              background: "transparent",
              boxShadow: "none",
              padding: 0,
              minHeight: "auto",
            }}
          />
        </div>
      </div>
    </>
  );
};

const FloatingVideo: React.FC<{
  track: any;
  isMuted: boolean;
  label?: string;
  size?: "normal" | "connected";
  style?: React.CSSProperties;
  objectFit?: "cover" | "contain";
}> = ({ track, isMuted, label, size = "normal", style, objectFit = "cover" }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    const mediaTrack = track.publication?.track;
    if (el && mediaTrack) {
      mediaTrack.attach(el);
      return () => mediaTrack.detach(el);
    }
  }, [track.publication?.track]);

  return (
    <div
      className={`absolute rounded-xl overflow-hidden border-2 border-white bg-slate-100 shadow-lg transition-[width,height] duration-200 ${
        size === "connected"
          ? "w-[132px] h-[96px] md:w-[200px] md:h-[140px] z-30"
          : "w-[96px] h-[72px] md:w-[120px] md:h-[90px] z-20"
      }`}
      style={style}
    >
      <video
        ref={videoRef}
        autoPlay
        muted={isMuted}
        playsInline
        className="w-full h-full"
        style={{ objectFit }}
      />
      {label && (
        <div className="absolute bottom-1 left-0 right-0 text-center">
          <span className="text-white text-[10px] font-medium bg-black/50 px-2 py-0.5 rounded-full">
            {label}
          </span>
        </div>
      )}
    </div>
  );
};

const SpatialAudioRenderer: React.FC<{
  players: Record<string, RemotePlayer>;
  localPosition: { x: number; y: number };
  currentZone: Zone | null;
  localIsBusy: boolean;
}> = ({ players, localPosition, currentZone, localIsBusy }) => {
  const participants = useRemoteParticipants();

  return (
    <div style={{ display: "none" }}>
      {participants.map((p) => {
        const remotePlayer = Object.values(players).find(
          (rp) => rp.userId === p.identity || rp.id === p.identity,
        );

        let volume = 0;
        if (remotePlayer && !localIsBusy && !remotePlayer.isBusy) {
          let sameZone = false;
          if (currentZone) {
            const rx = remotePlayer.x;
            const ry = remotePlayer.y;
            sameZone =
              rx >= currentZone.x &&
              rx <= currentZone.x + currentZone.width &&
              ry >= currentZone.y &&
              ry <= currentZone.y + currentZone.height;
          }

          if (sameZone) {
            volume = 1;
          } else {
            const dist = distance(remotePlayer, localPosition);
            const maxDist = 400;
            if (dist < maxDist) {
              const normalized = 1 - dist / maxDist;
              volume = normalized * normalized;
            }
          }
        }

        return (
          <ParticipantAudio key={p.identity} participant={p} volume={volume} />
        );
      })}
    </div>
  );
};

const ParticipantAudio: React.FC<{ participant: Participant; volume: number }> = ({
  participant,
  volume,
}) => {
  const audioTracks = Array.from(participant.audioTrackPublications.values());
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const trackPub = audioTracks.find((t) => t.track);
    const audioEl = audioRef.current;
    if (trackPub?.track && audioEl) {
      trackPub.track.attach(audioEl);
    }
    return () => {
      if (trackPub?.track && audioEl) {
        trackPub.track.detach(audioEl);
      }
    };
  }, [audioTracks]);

  return <audio ref={audioRef} autoPlay />;
};

const ScreenShareLayer: React.FC = () => {
  const [isMinimized, setIsMinimized] = React.useState(false);
  const screenTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false },
  );

  const activeTracks = screenTracks.filter((t) => t.publication?.track);

  // Auto-maximize when new screen shares are added
  useEffect(() => {
    if (activeTracks.length > 0) {
      setIsMinimized(false);
    }
  }, [activeTracks.length]);

  if (activeTracks.length === 0) return null;

  if (isMinimized) {
    return (
      <div className="absolute top-4 right-4 z-[200] pointer-events-auto">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl shadow-xl transition-all"
        >
          <Maximize2 size={18} />
          <span className="font-medium text-sm">View Screen Shares ({activeTracks.length})</span>
        </button>
      </div>
    );
  }

  // Responsive grid logic based on number of active screen shares
  const getGridClass = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    return "grid-cols-2 md:grid-cols-3";
  };

  return (
    <div className="absolute inset-0 z-[150] pointer-events-auto flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full h-full max-w-7xl max-h-[85vh] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white font-medium text-sm">
              {activeTracks.length} {activeTracks.length > 1 ? "screens" : "screen"} being shared
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Minimize to view map"
          >
            <Minimize2 size={18} />
          </button>
        </div>
        
        <div className={`flex-1 relative bg-black p-4 grid gap-4 overflow-y-auto ${getGridClass(activeTracks.length)}`}>
          {activeTracks.map((track) => (
            <div key={track.participant.identity} className="relative w-full h-full min-h-[300px] bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
              <FloatingVideo
                track={track}
                isMuted={true}
                size="normal"
                style={{ width: "100%", height: "100%", position: "absolute", borderRadius: "0", border: "none" }}
                objectFit="contain"
              />
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-lg border border-white/10">
                {track.participant.identity}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
