import { useEffect, useMemo, useRef, useState } from "react";
import { AtSign, CornerDownRight, Hash, MessageCircle, Reply, Send } from "lucide-react";
import { resolveAvatarUrl } from "../../../lib/profile";
import type { RoomChatMessage } from "../../../hooks/useMultiplayer";

export const ROOM_CHAT_CHANNELS = [
  { id: "general", label: "general" },
  { id: "social", label: "social" },
  { id: "team", label: "team" },
] as const;

interface ChatPanelProps {
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
  onSendMessage: (text: string, channelId: string, parentId?: string) => boolean;
}

export function ChatPanel({
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
  onSendMessage,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [threadRootId, setThreadRootId] = useState<string | null>(null);
  const threadBottomRef = useRef<HTMLDivElement | null>(null);

  const channelMessages = useMemo(
    () =>
      [...messages]
        .filter((m) => m.channelId === activeChannelId)
        .sort((a, b) => a.ts - b.ts),
    [messages, activeChannelId],
  );

  const rootMessages = useMemo(
    () => channelMessages.filter((message) => !message.parentId),
    [channelMessages],
  );

  const repliesByParent = useMemo(() => {
    return channelMessages.reduce<Record<string, RoomChatMessage[]>>((acc, message) => {
      if (!message.parentId) return acc;
      if (!acc[message.parentId]) acc[message.parentId] = [];
      acc[message.parentId].push(message);
      return acc;
    }, {});
  }, [channelMessages]);

  const activeThreadRoot =
    rootMessages.find((message) => message.id === threadRootId) ||
    (threadRootId
      ? channelMessages.find((message) => message.id === threadRootId && !message.parentId)
      : undefined);
  const activeThreadReplies = activeThreadRoot ? repliesByParent[activeThreadRoot.id] || [] : [];

  useEffect(() => {
    if (!initialThreadMessageId) return;

    const rootDirect = rootMessages.find((message) => message.id === initialThreadMessageId);
    if (rootDirect) {
      setThreadRootId(rootDirect.id);
      return;
    }

    const nested = channelMessages.find((message) => message.id === initialThreadMessageId);
    if (nested?.parentId) {
      setThreadRootId(nested.parentId);
    }
  }, [initialThreadMessageId, rootMessages, channelMessages]);

  useEffect(() => {
    if (!activeThreadRoot) return;
    threadBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeThreadRoot?.id, activeThreadReplies.length]);

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sendRootMessage = () => {
    if (!draft.trim()) return;
    const sent = onSendMessage(draft.trim(), activeChannelId);
    if (sent) setDraft("");
  };

  const sendReplyMessage = () => {
    if (!activeThreadRoot || !replyDraft.trim()) return;
    const sent = onSendMessage(replyDraft.trim(), activeChannelId, activeThreadRoot.id);
    if (sent) setReplyDraft("");
  };

  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-2">
        <MessageCircle size={16} className="text-indigo-500 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-slate-800">Realtime Room Chat</p>
          <p className="text-xs text-slate-500">
            Tin nhắn realtime theo phòng, tách biệt với forum.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3">
        <div className="grid grid-cols-[140px_1fr] gap-3">
          <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
            <div className="flex items-center justify-between mb-2 pr-1">
              <p className="text-[11px] font-bold text-slate-500">Channels</p>
            </div>
            <div className="space-y-1">
              {ROOM_CHAT_CHANNELS.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => {
                    onActiveChannelChange(channel.id);
                    setThreadRootId(null);
                  }}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded-md flex items-center gap-1 ${
                    activeChannelId === channel.id
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Hash size={12} />
                  {channel.label}
                  {(mentionUnreadByChannel[channel.id] || 0) > 0 && (
                    <span
                      className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
                        activeChannelId === channel.id
                          ? "bg-rose-400/40 text-white"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      <AtSign size={9} />
                      {mentionUnreadByChannel[channel.id]}
                    </span>
                  )}
                  {(unreadByChannel[channel.id] || 0) > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        activeChannelId === channel.id
                          ? "bg-white/20 text-white"
                          : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {unreadByChannel[channel.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                <Hash size={12} />
                {activeChannelId}
              </p>
              <div className="h-56 overflow-y-auto space-y-2 pr-1">
                {rootMessages.length === 0 && (
                  <p className="text-xs text-slate-400">Chua co tin nhan nao trong kenh nay.</p>
                )}
                {rootMessages.map((message) => {
                  const mine = message.senderId === currentUserId;
                  const replyCount = (repliesByParent[message.id] || []).length;
                  const isActiveThread = threadRootId === message.id;
                  return (
                    <div
                      key={message.id}
                      className={`rounded-xl border px-2.5 py-2 ${
                        isActiveThread
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <img
                          src={resolveAvatarUrl(message.senderAvatar)}
                          className="w-7 h-7 rounded-full border border-slate-200 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-slate-800 truncate">
                              {mine ? currentUserName : message.senderName}
                            </p>
                            <span className="text-[10px] text-slate-400">{formatTime(message.ts)}</span>
                          </div>
                          <p className="text-xs leading-snug text-slate-700 wrap-break-word">{message.text}</p>
                          <button
                            onClick={() => {
                              setThreadRootId(message.id);
                              onThreadOpen(message.id, activeChannelId);
                            }}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700"
                          >
                            <Reply size={11} />
                            {replyCount > 0 ? `${replyCount} replies` : "Reply in thread"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 h-56 flex flex-col">
              {!activeThreadRoot ? (
                <div className="h-full flex items-center justify-center text-center text-xs text-slate-500 px-3">
                  Chon mot tin nhan de mo thread va reply.
                </div>
              ) : (
                <>
                  <div className="pb-2 border-b border-slate-200">
                    <p className="text-[11px] font-bold text-slate-500">Thread</p>
                    <p className="text-xs text-slate-700 line-clamp-2">{activeThreadRoot.text}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto py-2 space-y-2">
                    {activeThreadReplies.length === 0 && (
                      <p className="text-xs text-slate-400">Chua co reply nao.</p>
                    )}
                    {activeThreadReplies.map((reply) => (
                      <div key={reply.id} className="rounded-lg border border-slate-200 bg-white p-2">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <CornerDownRight size={11} />
                          <span className="font-semibold text-slate-700">{reply.senderName}</span>
                          <span>{formatTime(reply.ts)}</span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 wrap-break-word">{reply.text}</p>
                      </div>
                    ))}
                    <div ref={threadBottomRef} />
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5">
                    <input
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") sendReplyMessage();
                      }}
                      placeholder="Reply thread..."
                      className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5"
                    />
                    <button
                      onClick={sendReplyMessage}
                      className="p-1.5 rounded-md bg-indigo-600 text-white"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <img
            src={resolveAvatarUrl(currentUserAvatar)}
            className="w-7 h-7 rounded-full border border-slate-200 object-cover"
          />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendRootMessage();
            }}
            placeholder={`Nhan #${activeChannelId}...`}
            className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-2"
          />
          <button onClick={sendRootMessage} className="p-2 rounded-lg bg-indigo-600 text-white">
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
