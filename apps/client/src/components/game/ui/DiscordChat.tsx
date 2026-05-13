import React, { useState, useEffect, useRef } from "react";
import { Hash, Send, Plus, X, Trash2, Paperclip, File as FileIcon, Download, XCircle } from "lucide-react";
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
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
}

interface DiscordChatProps {
  user: { id: string; displayName: string; avatarUrl: string };
  roomId?: string;
  isDark?: boolean;
}

const DEFAULT_CHANNELS = ["general", "random", "announcements"];
const STORAGE_KEY_PREFIX = "chat_channels_";

export const DiscordChat: React.FC<DiscordChatProps> = ({ user, roomId = "lobby", isDark = true }) => {
  // Load saved channels from localStorage, or fall back to defaults
  const [channels, setChannels] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${roomId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return [...DEFAULT_CHANNELS];
  });

  const [activeChannel, setActiveChannel] = useState("general");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [createError, setCreateError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const newChannelInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist channels to localStorage when they change
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${roomId}`, JSON.stringify(channels));
  }, [channels, roomId]);

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

  // Focus the input when modal opens
  useEffect(() => {
    if (showCreateModal) {
      setTimeout(() => newChannelInputRef.current?.focus(), 100);
    }
  }, [showCreateModal]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && !selectedFile) return;

    try {
      setIsUploading(true);
      let fileData = null;

      // 1. Upload file if exists
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        
        // Use native fetch for FormData
        const token = localStorage.getItem("token") || "";
        const uploadRes = await fetch(`${import.meta.env.VITE_SERVER_URL || "http://localhost:3000"}/api/upload`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          fileData = {
            fileUrl: uploadData.fileUrl,
            fileName: uploadData.fileName,
            fileType: uploadData.fileType,
            fileSize: uploadData.fileSize
          };
        }
      }

      // 2. Send message
      const payload: any = {
        roomCode: roomId,
        channelName: activeChannel,
        content: inputValue,
        authorId: user.id,
      };
      if (fileData) {
        payload.fileUrl = fileData.fileUrl;
        payload.fileName = fileData.fileName;
        payload.fileType = fileData.fileType;
        payload.fileSize = fileData.fileSize;
      }

      const res = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setMessages((prev) => {
          if (prev.some(m => m._id === res.message._id)) return prev;
          return [...prev, res.message];
        });
        setInputValue("");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        // Broadcast to others
        window.dispatchEvent(new CustomEvent("send-chat-message", { detail: res.message }));
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // 10MB limit
      if (e.target.files[0].size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit.");
        return;
      }
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCreateChannel = () => {
    const sanitized = newChannelName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    if (!sanitized) {
      setCreateError("Channel name cannot be empty.");
      return;
    }
    if (sanitized.length > 24) {
      setCreateError("Channel name must be 24 characters or less.");
      return;
    }
    if (channels.includes(sanitized)) {
      setCreateError(`Channel "#${sanitized}" already exists.`);
      return;
    }

    setChannels(prev => [...prev, sanitized]);
    setActiveChannel(sanitized);
    setNewChannelName("");
    setCreateError("");
    setShowCreateModal(false);
  };

  const handleDeleteChannel = (channelToDelete: string) => {
    // Don't allow deleting default channels
    if (DEFAULT_CHANNELS.includes(channelToDelete)) return;
    if (!confirm(`Delete channel #${channelToDelete}? Messages will remain in the database.`)) return;

    setChannels(prev => prev.filter(c => c !== channelToDelete));
    if (activeChannel === channelToDelete) {
      setActiveChannel("general");
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
    accent: isDark ? "#5865f2" : "#0d9488",
  };

  return (
    <div 
      className="flex h-full w-full overflow-hidden font-sans rounded-lg transition-colors duration-300"
      style={{ background: chatColors.bgMain, color: chatColors.textPrimary }}
    >
      {/* Channels Sidebar */}
      <div 
        className="w-52 flex flex-col shrink-0"
        style={{ background: chatColors.bgSidebar, borderRight: `1px solid ${chatColors.border}` }}
      >
        <div className="p-4 shadow-sm flex items-center justify-between" style={{ borderBottom: `1px solid ${chatColors.border}` }}>
          <h2 className="font-bold truncate" style={{ color: chatColors.textPrimary }}>Chat Channels</h2>
          <button
            onClick={() => { setShowCreateModal(true); setCreateError(""); setNewChannelName(""); }}
            className="p-1 rounded-md transition-colors hover:bg-white/10"
            style={{ color: chatColors.textSecondary }}
            title="Create Channel"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 custom-scrollbar">
          {channels.map(channel => {
            const isDefault = DEFAULT_CHANNELS.includes(channel);
            const isActive = activeChannel === channel;
            return (
              <div key={channel} className="group relative">
                <button
                  onClick={() => setActiveChannel(channel)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors"
                  style={{
                    background: isActive ? chatColors.bgSidebarActive : "transparent",
                    color: isActive ? chatColors.textPrimary : chatColors.textSecondary,
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  <Hash size={16} className="shrink-0" />
                  <span className="truncate text-sm">{channel}</span>
                </button>
                {/* Delete button for custom channels */}
                {!isDefault && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteChannel(channel); }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: isDark ? "#ed4245" : "#dc2626" }}
                    title="Delete channel"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
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
                      {msg.content && <p className="leading-relaxed break-words text-[15px]" style={{ color: isDark ? "#dbdee1" : "#2e3338" }}>{msg.content}</p>}
                      
                      {msg.fileUrl && (
                        <div className="mt-2 mb-1 max-w-sm">
                          {msg.fileType?.startsWith("image/") ? (
                            <a href={`${import.meta.env.VITE_SERVER_URL || "http://localhost:3000"}${msg.fileUrl}`} target="_blank" rel="noopener noreferrer">
                              <img 
                                src={`${import.meta.env.VITE_SERVER_URL || "http://localhost:3000"}${msg.fileUrl}`} 
                                alt={msg.fileName || "attachment"} 
                                className="max-h-64 rounded border object-contain bg-black/10"
                                style={{ borderColor: chatColors.border }}
                              />
                            </a>
                          ) : (
                            <a 
                              href={`${import.meta.env.VITE_SERVER_URL || "http://localhost:3000"}${msg.fileUrl}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-black/5 transition-colors"
                              style={{ borderColor: chatColors.border, background: isDark ? "#2b2d31" : "#f2f3f5" }}
                            >
                              <div className="p-2 rounded bg-indigo-500/10 text-indigo-500 shrink-0">
                                <FileIcon size={24} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: chatColors.textPrimary }}>{msg.fileName}</p>
                                <p className="text-xs" style={{ color: chatColors.textSecondary }}>
                                  {msg.fileSize ? (msg.fileSize / 1024 / 1024).toFixed(2) + " MB" : "Unknown size"}
                                </p>
                              </div>
                              <Download size={18} style={{ color: chatColors.textSecondary }} className="shrink-0" />
                            </a>
                          )}
                        </div>
                      )}
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
            className="rounded-lg flex flex-col p-1 relative"
            style={{ background: chatColors.inputBg }}
          >
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 m-2 mb-0 rounded bg-black/10 w-max" style={{ border: `1px solid ${chatColors.border}` }}>
                <FileIcon size={16} style={{ color: chatColors.textSecondary }} />
                <span className="text-sm truncate max-w-[200px]" style={{ color: chatColors.textPrimary }}>{selectedFile.name}</span>
                <button type="button" onClick={() => setSelectedFile(null)} className="p-0.5 hover:text-red-500 text-slate-400 transition-colors">
                  <XCircle size={16} />
                </button>
              </div>
            )}
            <div className="flex items-center pr-2 w-full">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 ml-2 transition-colors rounded-full hover:bg-black/5"
                style={{ color: chatColors.textSecondary }}
                title="Attach file"
              >
                <Paperclip size={20} />
              </button>
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Message #${activeChannel}`}
                className="flex-1 bg-transparent border-none px-3 py-3 focus:outline-none focus:ring-0 transition-colors"
                style={{ color: chatColors.textPrimary }}
              />
              <button 
                type="submit" 
                disabled={(!inputValue.trim() && !selectedFile) || isUploading}
                className="p-1.5 transition-colors disabled:opacity-50"
                style={{ color: isUploading ? chatColors.accent : chatColors.textSecondary }}
              >
                <Send size={20} className={isUploading ? "animate-pulse" : ""} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]" onClick={() => setShowCreateModal(false)}>
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl p-0 overflow-hidden"
            style={{ background: isDark ? "#313338" : "#ffffff" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 pb-3">
              <h3 className="text-lg font-bold" style={{ color: chatColors.textPrimary }}>Create Channel</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg transition-colors" style={{ color: chatColors.textMuted }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 pb-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: chatColors.textSecondary }}>
                  Channel Name
                </label>
                <div className="flex items-center rounded-lg px-3" style={{ background: chatColors.inputBg }}>
                  <Hash size={16} style={{ color: chatColors.textMuted }} className="shrink-0" />
                  <input
                    ref={newChannelInputRef}
                    type="text"
                    value={newChannelName}
                    onChange={(e) => { setNewChannelName(e.target.value); setCreateError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateChannel(); } }}
                    placeholder="new-channel"
                    maxLength={24}
                    className="flex-1 bg-transparent border-none px-2 py-3 focus:outline-none text-sm"
                    style={{ color: chatColors.textPrimary }}
                  />
                </div>
                {createError && (
                  <p className="text-xs mt-1.5 font-medium" style={{ color: "#ed4245" }}>{createError}</p>
                )}
                <p className="text-xs mt-2" style={{ color: chatColors.textMuted }}>
                  Channel names must be lowercase with no spaces. Use hyphens instead.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{ color: chatColors.textSecondary }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChannel}
                  disabled={!newChannelName.trim()}
                  className="px-5 py-2 text-sm font-bold text-white rounded-lg transition-all disabled:opacity-40"
                  style={{ background: chatColors.accent }}
                >
                  Create Channel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
