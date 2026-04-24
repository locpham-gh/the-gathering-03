import { useState, useEffect, useRef } from "react";
import { Bell, Heart, MessageCircle } from "lucide-react";
import { notificationsApi } from "../../lib/api";

interface Notification {
  _id: string;
  sender: {
    _id: string;
    displayName: string;
    avatarUrl: string;
  };
  type: "like" | "reply";
  topicId: {
    _id: string;
    title: string;
  };
  content?: string;
  isRead: boolean;
  createdAt: string;
}

interface User {
  id: string;
  avatarUrl: string;
  displayName: string;
}

export function NotificationCenter({ user }: { user: User }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const res = await notificationsApi.getNotifications();
      if (res.success) {
        setNotifications(res.notifications);
        const count = res.notifications.filter((n: Notification) => !n.isRead).length;
        setUnreadCount(count);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadNotifications();
    };
    init();

    // WebSocket for Real-time Notifications
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const host = apiUrl.replace(/^https?:\/\//, "");
    
    // Connect with userId to subscribe to personal room
    const ws = new WebSocket(`${protocol}//${host}/ws?userId=${user.id}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_notification") {
          loadNotifications();
          // Optional: Play a subtle sound?
        }
      } catch { /* Ignore */ }
    };

    // Close on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (ws.readyState === WebSocket.OPEN) ws.close();
      else ws.onopen = () => ws.close();
    };
  }, [user.id]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (dateStr: string) => {
    const min = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (min < 1) return "now";
    if (min < 60) return `${min}m`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-all"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h4 className="font-bold text-slate-800">Notifications</h4>
            <span className="text-xs text-slate-400 font-medium">{unreadCount} new</span>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleMarkAsRead(n._id)}
                  className={`p-4 flex gap-3 cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-b-0 ${
                    !n.isRead ? "bg-teal-50/30" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={n.sender.avatarUrl}
                      className="w-10 h-10 rounded-full object-cover border border-slate-100"
                      alt="Avatar"
                    />
                    <div className={`absolute -bottom-1 -right-1 p-1 rounded-full text-white ${
                      n.type === 'like' ? 'bg-red-500' : 'bg-teal-500'
                    }`}>
                      {n.type === 'like' ? <Heart size={10} className="fill-current" /> : <MessageCircle size={10} />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 leading-snug">
                      <span className="font-bold">{n.sender.displayName}</span>
                      {" "}
                      {n.type === 'like' ? 'liked your post' : 'replied to you'}
                      {": "}
                      <span className="text-slate-500 italic">"{n.topicId.title}"</span>
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 block">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 bg-slate-50/50 border-t border-slate-50 text-center">
            <button className="text-[11px] font-bold text-slate-400 hover:text-teal-600 uppercase tracking-widest transition-colors">
              View All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
