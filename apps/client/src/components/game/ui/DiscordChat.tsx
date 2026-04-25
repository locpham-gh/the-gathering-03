import React, { useState, useEffect, useRef } from "react";
import { Hash, Send, Settings, User } from "lucide-react";
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
}

const CHANNELS = ["general", "random", "announcements"];

export const DiscordChat: React.FC<DiscordChatProps> = ({ user, roomId = "lobby" }) => {
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

  return (
    <div className="flex h-full w-full bg-[#313338] text-slate-200 overflow-hidden font-sans rounded-lg">
      {/* Channels Sidebar */}
      <div className="w-48 bg-[#2b2d31] flex flex-col shrink-0 border-r border-[#1e1f22]">
        <div className="p-4 border-b border-[#1e1f22] shadow-sm">
          <h2 className="font-bold text-[#f2f3f5] truncate">The Gathering Chat</h2>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 custom-scrollbar">
          {CHANNELS.map(channel => (
            <button
              key={channel}
              onClick={() => setActiveChannel(channel)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                activeChannel === channel 
                  ? "bg-[#404249] text-[#f2f3f5]" 
                  : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]"
              }`}
            >
              <Hash size={18} className="shrink-0" />
              <span className="truncate font-medium">{channel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#313338]">
        {/* Chat Header */}
        <div className="h-14 shrink-0 flex items-center px-4 border-b border-[#2b2d31] shadow-sm gap-2">
          <Hash size={24} className="text-[#80848e]" />
          <span className="font-bold text-[#f2f3f5]">{activeChannel}</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#949ba4] space-y-4">
              <Hash size={48} className="bg-[#404249] p-3 rounded-full text-white" />
              <p className="font-bold text-lg">Welcome to #{activeChannel}!</p>
              <p className="text-sm">This is the start of the #{activeChannel} channel.</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isConsecutive = i > 0 && messages[i - 1].authorId._id === msg.authorId._id;
              
              return (
                <div key={msg._id} className={`flex gap-4 hover:bg-[#2e3035] -mx-4 px-4 py-0.5 rounded-sm ${isConsecutive ? 'mt-0.5' : 'mt-4'}`}>
                  {!isConsecutive ? (
                    <img 
                      src={msg.authorId.avatarUrl} 
                      alt="avatar" 
                      className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity shrink-0 object-cover bg-[#1e1f22]" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 shrink-0 text-center opacity-0 hover:opacity-100 flex items-center justify-center">
                       <span className="text-[10px] text-[#949ba4] font-medium leading-none">{timeAgo(msg.createdAt)}</span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    {!isConsecutive && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-medium text-[#f2f3f5] hover:underline cursor-pointer leading-tight">
                          {msg.authorId.displayName}
                        </span>
                        <span className="text-xs text-[#949ba4] font-medium">
                          {timeAgo(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <p className="text-[#dbdee1] leading-relaxed break-words text-[15px]">{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 shrink-0">
          <form onSubmit={handleSend} className="bg-[#383a40] rounded-lg flex items-center pr-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Message #${activeChannel}`}
              className="flex-1 bg-transparent border-none text-[#dbdee1] px-4 py-3 focus:outline-none focus:ring-0 placeholder-[#949ba4]"
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim()}
              className="p-1.5 text-[#b5bac1] hover:text-[#dbdee1] disabled:opacity-50 transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
