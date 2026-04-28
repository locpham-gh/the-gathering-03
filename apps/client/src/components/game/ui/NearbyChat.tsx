import React, { useState, useEffect, useRef } from "react";
import { Send, Phone, MessageCircle, X } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface NearbyChatProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  roomId?: string;
  players?: any;
  localPosition?: { x: number; y: number };
  onSendMessage: (text: string) => void;
}

export const NearbyChat: React.FC<NearbyChatProps> = ({ 
  isOpen, 
  onClose, 
  user,
  roomId,
  players,
  localPosition,
  onSendMessage 
}) => {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Listen for chat events from the global system
  useEffect(() => {
    const handleGlobalChat = (e: any) => {
      const { senderId, senderName, content, roomId: msgRoomId } = e.detail;
      
      // Only show messages if they belong to the current room
      if (roomId && msgRoomId !== roomId) return;

      // SPATIAL CHAT LOGIC: Check distance if sender is someone else
      if (senderId !== user?.id && players && localPosition) {
        const sender = players[senderId];
        if (sender) {
          const dist = Math.sqrt(
            Math.pow(sender.x - localPosition.x, 2) + 
            Math.pow(sender.y - localPosition.y, 2)
          );
          // Only show if within 250 pixels
          if (dist > 250) return;
        }
      }

      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        senderId,
        senderName,
        text: content,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev.slice(-49), newMessage]);
    };

    window.addEventListener("chat-message-received" as any, handleGlobalChat);
    return () => window.removeEventListener("chat-message-received" as any, handleGlobalChat);
  }, [user?.id, roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    onSendMessage(inputText);
    setInputText("");
  };

  return (
    <div className="fixed bottom-24 right-8 w-80 h-[500px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300 z-50">
      {/* Phone Notch */}
      <div className="h-6 w-full flex justify-center items-end pb-1">
        <div className="w-20 h-4 bg-slate-800 rounded-full"></div>
      </div>

      {/* App Header */}
      <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <MessageCircle size={16} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Nearby Chat</h3>
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Encrypted</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-gradient-to-b from-slate-900 to-slate-800"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 mb-4 border border-slate-700">
              <Phone size={32} />
            </div>
            <p className="text-slate-400 text-xs">No messages yet.<br/>Start a conversation with nearby people!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.senderId === user.id ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{msg.senderName}</span>
              </div>
              <div 
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                  msg.senderId === user.id 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-slate-700 text-slate-100 rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-slate-700/50">
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Aa"
            className="w-full bg-slate-800 border-none rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          <button 
            type="submit"
            className="absolute right-1.5 top-1.5 w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
          >
            <Send size={16} />
          </button>
        </div>
      </form>

      {/* Home Indicator */}
      <div className="h-6 w-full flex justify-center items-center">
        <div className="w-24 h-1 bg-slate-700 rounded-full"></div>
      </div>
    </div>
  );
};
