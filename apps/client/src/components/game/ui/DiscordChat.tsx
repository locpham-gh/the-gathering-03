import React, { useState, useEffect, useRef } from "react";
import { Hash, Send } from "lucide-react";
import { apiFetch } from "../../../lib/api";

interface Message {
  _id: string;
  roomCode: string;
  channelName: string;
  authorId: {
    _id: string;
    displayName: string;
    avatarUrl: string;
  };
  content: string;
  createdAt: string;
}

interface DiscordChatProps {
  user: { id: string; displayName: string; avatarUrl: string };
  roomId?: string;
  isDark?: boolean;
}

const CHANNELS = ["general", "random", "announcements"];

export const DiscordChat: React.FC<DiscordChatProps> = ({ user, roomId = "lobby", isDark = true }) => {
  const [activeChannel, setActiveChannel] = useState("general");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (channel: string) => {
    try {
      const res = await apiFetch(`/api/chat/${roomId}/${channel}`);
      if (res.success) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error("Failed to fetch chat messages", err);
    }
  };

  useEffect(() => {
    fetchMessages(activeChannel);
  }, [activeChannel, roomId]);

  useEffect(() => {
    const handleNewMessage = (e: CustomEvent) => {
      const msg = e.detail;
      if (msg.roomCode === roomId && msg.channelName === activeChannel) {
        setMessages((prev) => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };
    window.addEventListener("chat-message", handleNewMessage as EventListener);
    return () => window.removeEventListener("chat-message", handleNewMessage as EventListener);
  }, [activeChannel, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      const res = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          roomCode: roomId,
          channelName: activeChannel,
          content: inputValue,
          authorId: user.id,
        }),
      });

      if (res.success) {
        // Add locally immediately
        setMessages((prev) => {
          if (prev.some(m => m._id === res.message._id)) return prev;
          return [...prev, res.message];
        });
        setInputValue("");
        
        // Broadcast to others
        window.dispatchEvent(new CustomEvent("send-chat-message", { detail: res.message }));
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Theme-based colors
  const chatColors = {
    bgMain: isDark ? "#313338" : "#ffffff",
    bgSidebar: isDark ? "#2b2d31" : "#f2f3f5",
    bgSidebarHover: isDark ? "#35373c" : "#e3e5e8",
    bgSidebarActive: isDark ? "#404249" : "#d4d7dc",
    textPrimary: isDark ? "#f2f3f5" : "#060607",
    textSecondary: isDark ? "#949ba4" : "#4e5058",
    textMuted: isDark ? "#80848e" : "#5c5e66",
    border: isDark ? "#1e1f22" : "#e3e5e8",
    inputBg: isDark ? "#383a40" : "#ebedef",
    msgHover: isDark ? "#2e3035" : "#f8f9fa",
  };

  return (
    <div 
      className="flex h-full w-full overflow-hidden font-sans rounded-lg transition-colors duration-300"
      style={{ background: chatColors.bgMain, color: chatColors.textPrimary }}
    >
      {/* Channels Sidebar */}
      <div 
        className="w-48 flex flex-col shrink-0"
        style={{ background: chatColors.bgSidebar, borderRight: `1px solid ${chatColors.border}` }}
      >
        <div className="p-4 shadow-sm" style={{ borderBottom: `1px solid ${chatColors.border}` }}>
          <h2 className="font-bold truncate" style={{ color: chatColors.textPrimary }}>Chat Channels</h2>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 custom-scrollbar">
          {CHANNELS.map(channel => (
            <button
              key={channel}
              onClick={() => setActiveChannel(channel)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors"
              style={{
                background: activeChannel === channel ? chatColors.bgSidebarActive : "transparent",
                color: activeChannel === channel ? chatColors.textPrimary : chatColors.textSecondary
              }}
            >
              <Hash size={18} className="shrink-0" />
              <span className="truncate font-medium">{channel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: chatColors.bgMain }}>
        {/* Chat Header */}
        <div 
          className="h-14 shrink-0 flex items-center px-4 shadow-sm gap-2"
          style={{ borderBottom: `1px solid ${chatColors.border}` }}
        >
          <Hash size={24} style={{ color: chatColors.textMuted }} />
          <span className="font-bold" style={{ color: chatColors.textPrimary }}>{activeChannel}</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4" style={{ color: chatColors.textSecondary }}>
              <Hash size={48} className="p-3 rounded-full" style={{ background: chatColors.bgSidebarActive, color: "#fff" }} />
              <p className="font-bold text-lg">Welcome to #{activeChannel}!</p>
              <p className="text-sm">This is the start of the #{activeChannel} channel.</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isConsecutive = i > 0 && messages[i - 1].authorId._id === msg.authorId._id;
              
              return (
                <div 
                  key={msg._id} 
                  className={`flex gap-4 -mx-4 px-4 py-0.5 rounded-sm transition-colors ${isConsecutive ? 'mt-0.5' : 'mt-4'}`}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = chatColors.msgHover}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  {!isConsecutive ? (
                    <img 
                      src={msg.authorId.avatarUrl} 
                      alt="avatar" 
                      className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity shrink-0 object-cover" 
                      style={{ background: chatColors.border }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 shrink-0 text-center opacity-0 hover:opacity-100 flex items-center justify-center">
                       <span className="text-[10px] font-medium leading-none" style={{ color: chatColors.textSecondary }}>{timeAgo(msg.createdAt)}</span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    {!isConsecutive && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-medium hover:underline cursor-pointer leading-tight" style={{ color: chatColors.textPrimary }}>
                          {msg.authorId.displayName}
                        </span>
                        <span className="text-xs font-medium" style={{ color: chatColors.textSecondary }}>
                          {timeAgo(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <p className="leading-relaxed break-words text-[15px]" style={{ color: isDark ? "#dbdee1" : "#2e3338" }}>{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 shrink-0">
          <form 
            onSubmit={handleSend} 
            className="rounded-lg flex items-center pr-2"
            style={{ background: chatColors.inputBg }}
          >
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Message #${activeChannel}`}
              className="flex-1 bg-transparent border-none px-4 py-3 focus:outline-none focus:ring-0 transition-colors"
              style={{ color: chatColors.textPrimary }}
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim()}
              className="p-1.5 transition-colors disabled:opacity-50"
              style={{ color: chatColors.textSecondary }}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
