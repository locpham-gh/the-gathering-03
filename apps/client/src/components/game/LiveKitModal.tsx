import React from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  ParticipantTile,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import type { RemotePlayer } from "../../hooks/useMultiplayer";

interface LiveKitModalProps {
  token: string;
  serverUrl: string;
  videoEnabled?: boolean;
  audioEnabled?: boolean;
  players: Record<string, RemotePlayer>;
  selfUserId?: string;
  viewport: { x: number; y: number; scale: number };
  onDisconnect: () => void;
}

export const LiveKitModal: React.FC<LiveKitModalProps> = ({
  token,
  serverUrl,
  videoEnabled = false,
  audioEnabled = false,
  players,
  selfUserId,
  viewport,
  onDisconnect,
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-100 w-full max-w-6xl px-4 flex justify-center pointer-events-none text-slate-800">
      <LiveKitRoom
        video={videoEnabled}
        audio={audioEnabled}
        connect={true}
        token={token}
        serverUrl={serverUrl}
        onDisconnected={onDisconnect}
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
      >
        <OverheadVideoTiles players={players} selfUserId={selfUserId} viewport={viewport} />
        <FloatingControls />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

const FloatingControls = () => {
  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="flex justify-center bg-white/95 backdrop-blur-xl px-4 py-1.5 rounded-full border border-slate-200 shadow-xl text-slate-700">
        <ControlBar
          variation="minimal"
          controls={{ chat: false, leave: false }}
          style={{
            background: "transparent",
            boxShadow: "none",
            padding: 0,
            minHeight: "auto",
          }}
        />
      </div>
    </div>
  );
};

const OverheadVideoTiles = ({
  players,
  selfUserId,
  viewport,
}: {
  players: Record<string, RemotePlayer>;
  selfUserId?: string;
  viewport: { x: number; y: number; scale: number };
}) => {
  const VIEWPORT_MARGIN = 120;
  const LOD_WORLD_DISTANCE = 900;
  const MAX_VISIBLE_VIDEO_TILES = 6;
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  const tracks = useTracks(
    [
      // Do not render placeholders to reduce unnecessary overhead.
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const playersByUserId = Object.values(players).reduce<Record<string, RemotePlayer>>(
    (acc, player) => {
      if (!player.userId) return acc;
      acc[player.userId] = player;
      return acc;
    },
    {},
  );

  const selfPlayer = selfUserId ? playersByUserId[selfUserId] : undefined;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {tracks
        .filter((track) => track.source === Track.Source.Camera)
        .map((track) => {
          const identity = track.participant.identity;
          const player =
            playersByUserId[identity] ||
            (identity === selfUserId && selfUserId
              ? Object.values(players).find((p) => p.userId === selfUserId)
              : undefined);
          if (!player) return null;
          if (!player.cameraEnabled) return null;

          const screenX = player.x * viewport.scale + viewport.x;
          const screenY = player.y * viewport.scale + viewport.y;
          const inViewport =
            screenX > -VIEWPORT_MARGIN &&
            screenX < screenW + VIEWPORT_MARGIN &&
            screenY > -VIEWPORT_MARGIN &&
            screenY < screenH + VIEWPORT_MARGIN;

          const distToSelf = selfPlayer
            ? Math.hypot(player.x - selfPlayer.x, player.y - selfPlayer.y)
            : 0;
          const inLodRange = !selfPlayer || distToSelf <= LOD_WORLD_DISTANCE;

          if (!inViewport && !inLodRange) return null;

          return {
            track,
            player,
            screenX,
            screenY,
            distToSelf,
          };
        })
        .filter((item) => item !== null)
        .sort((a, b) => a.distToSelf - b.distToSelf)
        .slice(0, MAX_VISIBLE_VIDEO_TILES)
        .map((track) => {
          const isFar = track.distToSelf > LOD_WORLD_DISTANCE * 0.6;
          const tileW = isFar ? 84 : 96;
          const tileH = isFar ? 62 : 72;

          return (
            <div
              key={`${track.track.participant.identity}-${track.track.source}`}
              className="absolute rounded-xl overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] border-2 border-white bg-slate-100"
              style={{
                width: tileW,
                height: tileH,
                left: track.screenX - tileW / 2,
                top: track.screenY - 146,
              }}
            >
              <ParticipantTile trackRef={track.track} />
            </div>
          );
        })}
    </div>
  );
};
