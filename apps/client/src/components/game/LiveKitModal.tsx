import React from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
} from "@livekit/components-react";
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
    <div className="absolute top-20 left-4 z-[100] w-[380px] h-[214px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl glass animate-in fade-in slide-in-from-left-4 duration-500">
      <LiveKitRoom
        video={true}
        audio={true}
        connect={true}
        token={token}
        serverUrl={serverUrl}
        onDisconnected={onDisconnect}
        data-lk-theme="default"
        style={{ height: "100%" }}
      >
        <VideoConference
          SettingsComponent={undefined} // Remove settings to save space
        />
        <RoomAudioRenderer />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 scale-75 opacity-0 hover:opacity-100 transition-opacity">
          <ControlBar variation="minimal" />
        </div>
      </LiveKitRoom>
    </div>
  );
};
