import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";

// Contexts & Hooks
import { useAuth } from "../contexts/AuthContext";
import { useMultiplayer } from "../hooks/useMultiplayer";
import { useGameRoom } from "../hooks/useGameRoom";
import { useLiveKit } from "../hooks/useLiveKit";
import { useGameEvents } from "../hooks/useGameEvents";

// Components
import { GameCanvas } from "../components/game/core/GameCanvas";
import type { Zone } from "../components/game/core/zones";
import { ZoneOverlay } from "../components/game/ui/ZoneOverlay";
import { LibraryModal } from "../components/game/library/LibraryModal";
import { RoomSidebar } from "../components/game/ui/RoomSidebar";
import { LiveKitModal } from "../components/game/ui/LiveKitModal";
import { PreJoinScreen } from "../components/game/ui/PreJoinScreen";
import { WhiteboardModal } from "../components/game/ui/WhiteboardModal";
import { InviteModal } from "../components/game/ui/InviteModal";
import { NearbyChat } from "../components/game/ui/NearbyChat";

export default function GamePage() {
  const { user, token: authToken } = useAuth();
  const navigate = useNavigate();
  const { roomId } = useParams();

  // 1. Room Logic
  const { room, initialServerPosition, isLoading: isLoadingRoom, error: roomError } = useGameRoom(roomId);
  
  // 2. Multiplayer Logic
  const { players, localPosition, updatePosition, sendChatMessage, sendEmote, sendMessage } = useMultiplayer(roomId);
  
  // 3. UI State
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [customDisplayName, setCustomDisplayName] = useState<string | null>(null);
  const [localEmote, setLocalEmote] = useState<{ id: string; timestamp: number } | null>(null);
  const [localChatBubble, setLocalChatBubble] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [isWhiteboardLeader, setIsWhiteboardLeader] = useState(false);

  // 4. Voice/Video Logic
  const { token: liveKitToken, setToken: setLiveKitToken } = useLiveKit(isJoined, user, roomId, authToken);

  // 5. Actions
  const handleJoin = (data: { displayName: string; characterId: string }) => {
    setCustomDisplayName(data.displayName);
    setSelectedCharacter(data.characterId);
    setIsJoined(true);
  };
  const handleZoneClose = useCallback(() => {
    // If leader closes whiteboard, broadcast to attendees
    if (isWhiteboardLeader) {
      sendMessage("whiteboard_close", { roomId });
    }
    setIsWhiteboardLeader(false);
    setActiveZone(null);
  }, [isWhiteboardLeader, roomId, sendMessage]);

  const handleInteract = useCallback(() => {
    if (!currentZone || currentZone.id === "chill") return;
    
    // ONLY the person standing at the whiteboard can be the leader
    if (currentZone.id === "whiteboard_leader") {
      setIsWhiteboardLeader(true);
      setActiveZone(currentZone);
      sendMessage("whiteboard_open", { roomId });
      return;
    }
    
    // Others in the conference zone cannot open it manually by pressing E
    if (currentZone.id === "conference") return;

    setActiveZone(currentZone);
  }, [currentZone, roomId, sendMessage]);

  // Listen for whiteboard_open broadcast from leader → auto-open for attendees
  useEffect(() => {
    const handleRemoteOpen = () => {
      // If I am in the meeting room or near the board, open the viewer
      if (currentZone?.id === "conference" || currentZone?.id === "whiteboard_leader") {
        if (!isWhiteboardLeader) {
          setIsWhiteboardLeader(false);
          setActiveZone({ id: "conference", label: "Meeting Room", x: 0, y: 0, width: 0, height: 0, description: "" });
        }
      }
    };
    const handleRemoteClose = () => {
      if (!isWhiteboardLeader) setActiveZone(null);
    };

    window.addEventListener("whiteboard-open", handleRemoteOpen);
    window.addEventListener("whiteboard-close", handleRemoteClose);

    return () => {
      window.removeEventListener("whiteboard-open", handleRemoteOpen);
      window.removeEventListener("whiteboard-close", handleRemoteClose);
    };
  }, [currentZone, isWhiteboardLeader]);


  // 6. Global Events
  useGameEvents({
    onEscape: handleZoneClose,
    onInteract: handleInteract,
    onEmote: (emoteId) => {
      setLocalEmote({ id: emoteId, timestamp: Date.now() });
      sendEmote(emoteId);
    },
    currentZone,
    activeZone
  });

  // 7. Chat Bubbles
  useEffect(() => {
    const handleLocalChat = (e: CustomEvent) => {
      const content = e.detail?.content;
      if (typeof content === "string" && content.trim()) {
        setLocalChatBubble(content);
        setTimeout(() => setLocalChatBubble(null), 4000);
      }
    };
    window.addEventListener("send-chat-message", handleLocalChat as EventListener);
    return () => window.removeEventListener("send-chat-message", handleLocalChat as EventListener);
  }, []);

  // 8. Auth Redirect
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    const onKicked = (e: Event) => {
      const msg = (e as CustomEvent<{ message?: string }>).detail?.message;
      const text =
        typeof msg === "string" && msg.trim()
          ? msg
          : "Bạn đã bị mời ra khỏi phòng bởi chủ phòng.";
      alert(text);
      navigate("/home/rooms", { replace: true });
    };
    window.addEventListener("room-kicked-by-owner", onKicked);
    return () => window.removeEventListener("room-kicked-by-owner", onKicked);
  }, [navigate]);

  if (!user) return null;

  if (isLoadingRoom) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-50 font-sans">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-medium text-slate-700">Connecting to Space...</h2>
        <p className="text-slate-500 mt-2">Please wait while we set up your environment.</p>
      </div>
    );
  }

  if (roomError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-50 font-sans p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Room Unavailable</h2>
          <p className="text-slate-600 mb-6">{roomError}</p>
          <button onClick={() => navigate("/home")} className="w-full py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors font-medium">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans relative">
      <RoomSidebar
        roomId={roomId}
        user={{ ...user, displayName: customDisplayName || user.displayName, avatarUrl: user.avatarUrl || "" }}
        players={players}
        onOpenInvite={() => setShowInviteModal(true)}
      />

      <div className="flex-1 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 pointer-events-auto">
          <GameCanvas
            roomId={roomId}
            onZoneChange={setCurrentZone}
            onInteract={handleInteract}
            activeZone={activeZone}
            players={players}
            updatePosition={updatePosition}
            selectedCharacter={selectedCharacter || "Adam"}
            customDisplayName={customDisplayName || undefined}
            mapType={room?.map}
            localEmote={localEmote}
            localChatBubble={localChatBubble}
            localPosition={localPosition}
            initialServerPosition={initialServerPosition}
            onPhoneToggle={setIsPhoneOpen}
          />
        </div>

        <NearbyChat
          isOpen={isPhoneOpen}
          onClose={() => setIsPhoneOpen(false)}
          user={{ ...user, displayName: customDisplayName || user.displayName }}
          roomId={roomId}
          players={players}
          localPosition={localPosition}
          onSendMessage={(text, id) =>
            sendChatMessage({
              id,
              content: text,
              senderId: user.id,
              senderName: customDisplayName || user.displayName,
              roomId,
            })
          }
        />

        <ZoneOverlay zone={currentZone} onPressE={handleInteract} />

        {activeZone?.id === "library" && <LibraryModal onClose={handleZoneClose} />}
        {(activeZone?.id === "conference" || activeZone?.id === "whiteboard_leader") && (
          <WhiteboardModal
            onClose={handleZoneClose}
            roomId={roomId}
            sendMessage={sendMessage}
            isLeader={isWhiteboardLeader}
          />
        )}
        {activeZone?.id === "whiteboard" && (
          <WhiteboardModal onClose={handleZoneClose} roomId={roomId} sendMessage={sendMessage} isLeader={true} />
        )}

        {liveKitToken && (
          <LiveKitModal
            token={liveKitToken}
            serverUrl={import.meta.env.VITE_LIVEKIT_URL}
            onDisconnect={() => setLiveKitToken(null)}
            players={players}
            localPosition={localPosition}
            currentZone={currentZone}
          />
        )}
        
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          roomName={room?.name}
          roomCode={room?.code || roomId}
        />
      </div>

      {!isJoined && <PreJoinScreen user={user} onJoin={handleJoin} />}
    </div>
  );
}
