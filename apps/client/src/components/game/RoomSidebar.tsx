import React, { useState, useEffect } from "react";
import { Users, MessageCircle, CalendarDays, ChevronRight, ChevronLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { CommunityForum } from "../dashboard/CommunityForum";
import { EventsManager } from "../dashboard/EventsManager";

interface RoomSidebarProps {
  roomId?: string;
  user: any;
  players: any;
}

export const RoomSidebar: React.FC<RoomSidebarProps> = ({ roomId, user, players }) => {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (roomId) {
       apiFetch(`/api/rooms/${roomId}/members`).then(res => {
          if (res.success) {
            setMembers(res.members);
          }
       });
    }
  }, [roomId]);

  const tabs = [
    { id: "users", icon: Users, label: "Room Participants" },
    { id: "chat", icon: MessageCircle, label: "Community Chat" },
    { id: "events", icon: CalendarDays, label: "Events & Meetings" },
  ];

  return (
    <div className="h-full z-50 flex shrink-0 relative pointer-events-none">
      {/* Icon Dock */}
      <div className="w-16 h-full bg-white flex flex-col items-center py-6 border-r border-slate-200 z-30 pointer-events-auto relative shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-8 shadow-sm">
          G
        </div>

        <div className="flex flex-col gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
              className={`p-3 rounded-xl transition-all relative group ${
                activeTab === tab.id 
                  ? "bg-teal-50 text-teal-600 shadow-sm border border-teal-100" 
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-800"
              }`}
              title={tab.label}
            >
              <tab.icon size={20} />
            </button>
          ))}
        </div>
        <div className="mt-auto flex flex-col items-center gap-4 w-full px-2">
           <img 
             src={user.avatarUrl} 
             alt="User Avatar" 
             referrerPolicy="no-referrer"
             className="w-10 h-10 rounded-full border-2 border-slate-200 shadow-sm object-cover bg-slate-100"
           />
           <div className="w-8 h-px bg-slate-200 my-1"></div>
           <button 
             onClick={() => navigate("/home")}
             title="Leave Room"
             className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
           >
             <LogOut size={20} className="ml-1" />
           </button>
        </div>
      </div>

      {/* Flyout Panel (Absolute Overlay) */}
      <div 
        className={`absolute top-0 left-16 h-full bg-white text-slate-800 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden flex flex-col z-20 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.2)] pointer-events-auto border-r border-slate-200 ${
          activeTab ? "w-[320px] opacity-100" : "w-0 opacity-0 border-transparent shadow-none"
        }`}
      >
        {/* Header */}
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-5 shrink-0 bg-white z-10">
          <h2 className="font-bold text-base text-slate-800">
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          <button 
            onClick={() => setActiveTab(null)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 relative p-4">
           {activeTab === "users" && (
             <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300 relative z-10 px-2 py-4">
               {members.map(member => {
                 let isOnline = false;
                 // user is self
                 if (member._id === user.id) isOnline = true;
                 else if (players[member._id]) isOnline = true;

                 return (
                   <div key={member._id} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${isOnline ? 'bg-white shadow-sm border border-slate-200' : 'opacity-60 grayscale-[50%]'}`}>
                      <div className="relative">
                        <img src={member.avatarUrl} referrerPolicy="no-referrer" className={`w-10 h-10 rounded-full object-cover bg-slate-100 ${isOnline ? 'border-2 border-teal-500' : 'border border-slate-300'}`} />
                        {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-teal-500 border-2 border-white rounded-full"></div>}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className={`font-bold truncate text-sm ${isOnline ? 'text-slate-800' : 'text-slate-500'}`}>{member.displayName}</p>
                        <p className="text-xs text-slate-400 truncate w-full pr-2">
                          {isOnline ? 'Online now' : 'Offline'}
                        </p>
                      </div>
                   </div>
                 );
               })}
             </div>
           )}
           {activeTab === "chat" && (
             <div className="scale-[0.95] origin-top">
                <CommunityForum user={user} />
             </div>
           )}
           {activeTab === "events" && (
             <div className="scale-[0.95] origin-top">
                <EventsManager user={user} />
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
