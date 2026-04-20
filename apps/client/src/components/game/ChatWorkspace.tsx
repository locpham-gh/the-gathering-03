import { ArrowLeft, Hash, MapPin } from "lucide-react";
import { ChatPanel } from "./sidebar/ChatPanel";
import type { RoomChatMessage } from "../../hooks/useMultiplayer";

interface ChatWorkspaceProps {
  messages: RoomChatMessage[];
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  activeChannelId: string;
  unreadByChannel: Record<string, number>;
  mentionUnreadByChannel: Record<string, number>;
  initialThreadMessageId?: string | null;
  onActiveChannelChange: (channelId: string) => void;
  onThreadOpen: (threadRootId: string, channelId: string) => void;
  onBackToMap: () => void;
  onSendMessage: (text: string, channelId: string, parentId?: string) => boolean;
}

export function ChatWorkspace({
  messages,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  activeChannelId,
  unreadByChannel,
  mentionUnreadByChannel,
  initialThreadMessageId,
  onActiveChannelChange,
  onThreadOpen,
  onBackToMap,
  onSendMessage,
}: ChatWorkspaceProps) {
  return (
    <div className="h-full w-full p-4 md:p-6 overflow-y-auto bg-slate-100">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4 max-w-[1200px] mx-auto">
        <div className="min-w-0">
          <button
            onClick={onBackToMap}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50"
          >
            <ArrowLeft size={13} />
            Quay lại map
          </button>
          <ChatPanel
            messages={messages}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserAvatar={currentUserAvatar}
            activeChannelId={activeChannelId}
            unreadByChannel={unreadByChannel}
            mentionUnreadByChannel={mentionUnreadByChannel}
            initialThreadMessageId={initialThreadMessageId}
            onActiveChannelChange={onActiveChannelChange}
            onThreadOpen={onThreadOpen}
            onSendMessage={onSendMessage}
          />
        </div>

        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
              <Hash size={12} />
              Active channel
            </p>
            <p className="text-sm font-semibold text-slate-800">#{activeChannelId}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                Mini-map
              </span>
              <span>You are in room</span>
            </div>
            <div className="h-32 rounded-lg bg-linear-to-br from-slate-200 to-slate-300" />
            <p className="text-[11px] text-slate-500 mt-2">
              Ban van dang o trong phong, map game van tiep tuc cap nhat realtime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
