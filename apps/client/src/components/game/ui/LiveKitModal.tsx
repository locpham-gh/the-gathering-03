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
    if ((localIsBusy || currentZone?.id === "chill") && localParticipant.isCameraEnabled) {
      localParticipant.setCameraEnabled(false);
    }
  }, [localParticipant, localIsBusy, currentZone?.id]);

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
    x: wx + cameraTransform.x + 32,
    y: wy + cameraTransform.y - 64 - SPRITE_HEAD_OFFSET,
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
          centerX: (localScreenForPair.x + remoteScreenForPair.x) / 2,
          topY:
            Math.min(localScreenForPair.y, remoteScreenForPair.y) -
            VIDEO_GAP -
            CONNECTED_PAIR_RAISE,
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
            const localScreen = toScreen(localPosition.x, localPosition.y);
            return (
          <FloatingVideo
            key={`local-${localTrack.participant.identity}`}
            track={localTrack}
            isMuted={true}
            label="You"
            size={connectedIdentity ? "connected" : "normal"}
            style={{
              left: `${
                connectedPairLayout
                  ? connectedPairLayout.centerX +
                    (connectedPairLayout.localOnLeft
                      ? -CONNECTED_PAIR_GAP / 2
                      : CONNECTED_PAIR_GAP / 2)
                  : localScreen.x
              }px`,
              top: `${connectedPairLayout ? connectedPairLayout.topY : localScreen.y - VIDEO_GAP}px`,
              transform: "translate(-50%, -100%)",
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
                left: `${
                  connectedPairLayout && connectedIdentity === track.participant.identity
                    ? connectedPairLayout.centerX +
                      (connectedPairLayout.localOnLeft
                        ? CONNECTED_PAIR_GAP / 2
                        : -CONNECTED_PAIR_GAP / 2)
                    : s.x
                }px`,
                top: `${
                  connectedPairLayout && connectedIdentity === track.participant.identity
                    ? connectedPairLayout.topY
                    : s.y - VIDEO_GAP
                }px`,
                transform: "translate(-50%, -100%)",
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
              screenShare:
                currentZone?.id === "presentation" || currentZone?.id === "conference",
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
  style: React.CSSProperties;
}> = ({ track, isMuted, label, size = "normal", style }) => {
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
      className={`absolute rounded-xl overflow-hidden border-2 border-white bg-slate-100 shadow-lg transition-all duration-200 ${
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
        className="w-full h-full object-cover"
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
