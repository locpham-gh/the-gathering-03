import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  MessageSquare,
  CalendarDays,
  LogOut,
  Link2,
  ArrowLeft,
  X,
  Wifi,
  Sun,
  Moon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../../lib/api";
import { EventsManager } from "../../dashboard/EventsManager";
import { DiscordChat } from "./DiscordChat";
import type { RemotePlayer } from "../../../hooks/useMultiplayer";

interface Member {
  _id: string;
  displayName: string;
  avatarUrl: string;
}

interface RoomSidebarProps {
  roomId?: string;
  user: { id: string; avatarUrl: string; displayName: string };
  players: Record<string, RemotePlayer>;
  onOpenInvite?: () => void;
}

const TABS = [
  { id: "users", icon: Users, label: "People" },
  { id: "chat", icon: MessageSquare, label: "Chat" },
  { id: "events", icon: CalendarDays, label: "Calendar" },
];

export const RoomSidebar: React.FC<RoomSidebarProps> = ({
  roomId,
  user,
  players,
  onOpenInvite,
}) => {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isDark, setIsDark] = useState(true);
  const navigate = useNavigate();

  const fetchMembers = useCallback(() => {
    if (roomId) {
      apiFetch(`/api/rooms/${roomId}/members`).then((res) => {
        if (res.success) setMembers(res.members);
      });
    }
  }, [roomId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const playersKey = Object.keys(players).join(",");
  useEffect(() => { fetchMembers(); }, [playersKey]);

  const onlineCount = Object.keys(players).length + 1;
  const isFullScreen = activeTab === "chat" || activeTab === "events";

  // Theme Colors
  const colors = {
    bgDock: isDark ? "linear-gradient(180deg, #18181b 0%, #0f0f10 100%)" : "#ffffff",
    bgPanel: isDark ? "linear-gradient(180deg, #18181b 0%, #111114 100%)" : "#f8fafc",
    bgContent: isDark ? "#111114" : "#ffffff",
    border: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
    textPrimary: isDark ? "#ffffff" : "#1e293b",
    textSecondary: isDark ? "rgba(255,255,255,0.4)" : "#64748b",
    textMuted: isDark ? "rgba(255,255,255,0.25)" : "#94a3b8",
    activeTabBg: isDark ? "rgba(99,102,241,0.18)" : "rgba(13,148,136,0.1)",
    activeTabText: isDark ? "#a5b4fc" : "#0d9488",
    activeTabIndicator: isDark ? "linear-gradient(180deg,#818cf8,#6366f1)" : "#0d9488",
    logoBg: isDark ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" : "#0d9488",
    logoShadow: isDark ? "0 4px 14px rgba(99,102,241,0.45)" : "0 4px 14px rgba(13,148,136,0.25)",
  };

  return (
    <div className="h-full z-50 flex shrink-0 relative pointer-events-none">

      {/* ── Icon Dock ── */}
      <div
        className="w-[60px] h-full flex flex-col items-center pt-4 pb-5 z-30 pointer-events-auto relative transition-colors duration-300"
        style={{
          background: colors.bgDock,
          borderRight: `1px solid ${colors.border}`,
          boxShadow: isDark ? "none" : "4px 0 20px rgba(0,0,0,0.02)",
        }}
      >
        {/* Logo mark */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black mb-6 select-none shadow-lg transition-all duration-300"
          style={{
            background: colors.logoBg,
            boxShadow: colors.logoShadow,
            color: "#fff",
            letterSpacing: "-1px",
          }}
        >
          G
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-1 w-full px-2.5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`sidebar-tab-${tab.id}`}
                onClick={() => setActiveTab(isActive ? null : tab.id)}
                title={tab.label}
                className="relative group w-full flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all duration-200"
                style={{
                  background: isActive ? colors.activeTabBg : "transparent",
                  color: isActive ? colors.activeTabText : colors.textMuted,
                }}
              >
                {/* Active left bar */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                    style={{ background: colors.activeTabIndicator }}
                  />
                )}
                <tab.icon
                  size={19}
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
                {!isFullScreen && (
                  <span className="text-[9px] font-semibold tracking-wide uppercase leading-none">
                    {tab.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Theme Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="w-9 h-9 flex items-center justify-center rounded-xl mb-3 transition-all"
          style={{ color: colors.textMuted, background: "rgba(128,128,128,0.05)" }}
          title={isDark ? "Light Mode" : "Dark Mode"}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Live indicator */}
        <div className="flex flex-col items-center gap-1 mb-3">
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ background: isDark ? "rgba(34,197,94,0.12)" : "rgba(13,148,136,0.1)" }}
          >
            <Wifi size={10} style={{ color: isDark ? "#4ade80" : "#0d9488" }} />
            <span className="text-[9px] font-bold" style={{ color: isDark ? "#4ade80" : "#0d9488" }}>
              {onlineCount}
            </span>
          </div>
        </div>

        {/* Avatar */}
        <div className="relative mb-2">
          <img
            src={user.avatarUrl}
            alt="avatar"
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-full object-cover shadow-sm"
            style={{ border: `2px solid ${isDark ? "rgba(255,255,255,0.15)" : "#e2e8f0"}` }}
          />
          <span
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            style={{ background: "#4ade80", borderColor: isDark ? "#18181b" : "#fff" }}
          />
        </div>

        {/* Leave */}
        <button
          onClick={() => navigate("/home")}
          title="Leave Room"
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
          style={{ color: colors.textMuted }}
        >
          <LogOut size={17} />
        </button>
      </div>

      {/* ── FULLSCREEN: Chat / Calendar ── */}
      {isFullScreen && (
        <div
          className="absolute top-0 left-[60px] h-full z-40 pointer-events-auto flex"
          style={{ width: "calc(100vw - 60px)" }}
        >
          {/* Mini-sidebar */}
          <div
            className="w-52 h-full flex flex-col shrink-0 transition-colors duration-300"
            style={{
              background: colors.bgPanel,
              borderRight: `1px solid ${colors.border}`,
            }}
          >
            {/* Header */}
            <div
              className="h-14 flex items-center justify-between px-4 shrink-0"
              style={{ borderBottom: `1px solid ${colors.border}` }}
            >
              <div className="flex items-center gap-2">
                {activeTab === "chat"
                  ? <MessageSquare size={15} style={{ color: colors.activeTabText }} />
                  : <CalendarDays size={15} style={{ color: colors.activeTabText }} />
                }
                <span className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                  {TABS.find((t) => t.id === activeTab)?.label}
                </span>
              </div>
              <button
                onClick={() => setActiveTab(null)}
                className="p-1.5 rounded-lg transition-all"
                style={{ color: colors.textMuted }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Tab nav */}
            <div className="p-2.5 flex flex-col gap-0.5">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-all w-full text-left"
                    style={{
                      background: isActive ? colors.activeTabBg : "transparent",
                      color: isActive ? colors.activeTabText : colors.textSecondary,
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    <tab.icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1" />

            {/* Back button */}
            <div className="p-3" style={{ borderTop: `1px solid ${colors.border}` }}>
              <button
                onClick={() => setActiveTab(null)}
                className="flex items-center gap-2 text-[12px] px-3 py-2.5 rounded-lg w-full transition-all"
                style={{ color: colors.textSecondary }}
              >
                <ArrowLeft size={13} />
                Back to game
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 h-full overflow-hidden transition-colors duration-300" style={{ background: colors.bgContent }}>
            {activeTab === "chat" && <DiscordChat user={user} roomId={roomId} isDark={isDark} />}
            {activeTab === "events" && (
              <div className="h-full overflow-y-auto p-6 custom-scrollbar">
                <EventsManager user={user} initialRoomId={roomId} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Flyout: Participants ── */}
      {!isFullScreen && (
        <div
          className="absolute top-0 left-[60px] h-full flex flex-col z-20 pointer-events-auto overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            width: activeTab === "users" ? "280px" : "0px",
            opacity: activeTab === "users" ? 1 : 0,
            background: colors.bgPanel,
            borderRight: activeTab === "users" ? `1px solid ${colors.border}` : "none",
          }}
        >
          {/* Header */}
          <div
            className="h-14 flex items-center justify-between px-4 shrink-0"
            style={{ borderBottom: `1px solid ${colors.border}` }}
          >
            <div className="flex items-center gap-2">
              <Users size={14} style={{ color: colors.activeTabText }} />
              <span className="font-semibold text-sm" style={{ color: colors.textPrimary }}>People</span>
            </div>
            <button
              onClick={() => setActiveTab(null)}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: colors.textMuted }}
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {/* Invite card */}
            <div
              className="rounded-xl p-4 mb-4 shadow-sm transition-all duration-300"
              style={{
                background: isDark 
                  ? "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)" 
                  : "linear-gradient(135deg, rgba(13,148,136,0.1) 0%, rgba(13,148,136,0.05) 100%)",
                border: `1px solid ${isDark ? "rgba(99,102,241,0.25)" : "rgba(13,148,136,0.2)"}`,
              }}
            >
              <p className="text-xs font-bold mb-0.5" style={{ color: colors.textPrimary }}>Invite to room</p>
              <p className="text-[11px] mb-3" style={{ color: colors.textSecondary }}>
                Share the space with your team.
              </p>
              <div className="flex -space-x-2 mb-3">
                {members.slice(0, 5).map((m, i) => (
                  <img
                    key={i}
                    src={m.avatarUrl}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover"
                    style={{ border: `2px solid ${isDark ? "#18181b" : "#fff"}` }}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  if (onOpenInvite) onOpenInvite();
                  else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Invite link copied!");
                  }
                }}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold py-2 rounded-lg transition-all"
                style={{
                  background: colors.logoBg,
                  color: "#fff",
                  boxShadow: colors.logoShadow,
                }}
              >
                <Link2 size={13} /> Copy Invite Link
              </button>
            </div>

            {/* Online section */}
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.12em] font-bold px-1 mb-2"
                style={{ color: colors.textMuted }}
              >
                In room · {onlineCount} online
              </p>
              <div className="space-y-0.5">
                {members.map((member) => {
                  const isOnline =
                    member._id === user.id ||
                    Object.values(players).some((p) => p.userId === member._id);
                  return (
                    <div
                      key={member._id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                      style={{
                        background: isOnline ? (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)") : "transparent",
                        opacity: isOnline ? 1 : 0.4,
                      }}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={member.avatarUrl}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover"
                          style={{ border: `2px solid ${isOnline ? colors.activeTabText : colors.textMuted}44` }}
                        />
                        <span
                          className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full"
                          style={{
                            background: isOnline ? "#4ade80" : (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"),
                            border: `2px solid ${isDark ? "#18181b" : "#fff"}`,
                          }}
                        />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold truncate leading-tight" style={{ color: colors.textPrimary }}>
                          {member.displayName}
                        </p>
                        <p className="text-[11px] leading-none mt-0.5" style={{ color: isOnline ? "#4ade80" : colors.textMuted }}>
                          {isOnline ? "● Online" : "○ Offline"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
