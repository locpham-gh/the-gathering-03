import React, { useState, useEffect } from "react";
import {
  Bot,
  Calendar,
  CircleUserRound,
  ChevronsLeft,
  ChevronsRight,
  Compass,
  Home,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  UserPlus,
  Users,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { resolveAvatarUrl } from "../../lib/profile";
import { PeoplePanel } from "./sidebar/PeoplePanel";
import type { RemotePlayer } from "../../hooks/useMultiplayer";

interface Member {
  _id: string;
  displayName: string;
  avatarUrl?: string;
}

interface RoomSidebarProps {
  roomId?: string;
  user: { id: string; avatarUrl?: string; displayName: string; gender?: string };
  players: Record<string, RemotePlayer>;
  activeView: "world" | "chat" | "community" | "calendar" | "ai";
  unreadChatCount: number;
  unreadMentionCount: number;
  onOpenChatPage: () => void;
  onReturnToWorld: () => void;
  onOpenCommunityPage: () => void;
  onOpenCalendarPage: () => void;
  onOpenAiPage: () => void;
  onUpdatePresence: (status: "active" | "away" | "in_call") => void;
  onCallVideo: (memberId: string) => void;
  callingUserId?: string | null;
}

export const RoomSidebar: React.FC<RoomSidebarProps> = ({
  roomId,
  user,
  players,
  activeView,
  unreadChatCount,
  unreadMentionCount,
  onOpenChatPage,
  onReturnToWorld,
  onOpenCommunityPage,
  onOpenCalendarPage,
  onOpenAiPage,
  onUpdatePresence,
  onCallVideo,
  callingUserId,
}) => {
  const currentUserAvatar = resolveAvatarUrl(user.avatarUrl, user.gender);
  const [collapsed, setCollapsed] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);
  const navigate = useNavigate();

  const roomCode = roomId || "";
  const roomLink = `${window.location.origin}/room/${roomCode}`;

  useEffect(() => {
    if (roomId) {
      apiFetch(`/api/rooms/${roomId}/members`).then((res) => {
        if (res.success) {
          setMembers(res.members);
        }
      });
    }
  }, [roomId]);

  const onlineIds = new Set(
    Object.values(players)
      .map((player) => player.userId)
      .filter((id): id is string => Boolean(id)),
  );

  const railItems = [
    { id: "home", icon: Home, label: "Space" },
    { id: "people", icon: Users, label: "People", onClick: onReturnToWorld },
    { id: "chat", icon: MessageCircle, label: "Chat", onClick: onOpenChatPage },
    { id: "community", icon: CircleUserRound, label: "Community", onClick: onOpenCommunityPage },
    { id: "calendar", icon: Calendar, label: "Calendar", onClick: onOpenCalendarPage },
    { id: "ai", icon: Bot, label: "Gather A.I", onClick: onOpenAiPage },
  ];

  return (
    <div className="h-full z-50 flex shrink-0 relative pointer-events-none">
      <div className="w-10 h-full bg-white border-r border-slate-200 pointer-events-auto flex flex-col items-center py-3 gap-2">
        {railItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            title={item.label}
            className={`w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center relative ${
              (item.id === "chat" && activeView === "chat") ||
              ((item.id === "home" || item.id === "people") && activeView === "world") ||
              (item.id === "community" && activeView === "community") ||
              (item.id === "calendar" && activeView === "calendar") ||
              (item.id === "ai" && activeView === "ai")
                ? "bg-slate-100 text-slate-800"
                : ""
            }`}
          >
            <item.icon size={15} />
            {item.id === "chat" && unreadChatCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 text-[9px] px-1 py-0.5 rounded-full bg-indigo-600 text-white min-w-[16px] text-center">
                  {unreadChatCount > 99 ? "99+" : unreadChatCount}
                </span>
                {unreadMentionCount > 0 && (
                  <span className="absolute -bottom-1 -right-1 text-[9px] px-1 py-0.5 rounded-full bg-rose-500 text-white min-w-[16px] text-center">
                    @{unreadMentionCount > 99 ? "99+" : unreadMentionCount}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
        <div className="mt-auto">
          <button
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center"
          >
            {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
          </button>
        </div>
      </div>

      <div
        className={`${
          collapsed ? "w-0 border-r-0" : "w-[340px] border-r border-slate-200"
        } h-full bg-white pointer-events-auto flex flex-col shadow-[0_0_40px_-20px_rgba(0,0,0,0.25)] transition-all duration-300 overflow-hidden`}
      >
        <div className="px-4 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                G
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">The Gathering</p>
                <p className="text-[11px] text-slate-400">{roomId || "Room"}</p>
              </div>
            </div>
            <button
              onClick={() => setInviteOpen(true)}
              className="text-xs px-2.5 py-1 rounded-md bg-indigo-600 text-white flex items-center gap-1"
            >
              <UserPlus size={12} />
              Invite
            </button>
          </div>

          <div className="mt-3 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <button className="text-[11px] px-2 py-1 rounded-md bg-slate-100 text-slate-600 flex items-center gap-1">
              <CircleUserRound size={11} />
              Community
            </button>
            <button
              onClick={onOpenAiPage}
              className="text-[11px] px-2 py-1 rounded-md bg-slate-100 text-slate-600 flex items-center gap-1"
            >
              <Bot size={11} />
              Gather A.I
            </button>
            <button
              onClick={onOpenCalendarPage}
              className="text-[11px] px-2 py-1 rounded-md bg-slate-100 text-slate-600 flex items-center gap-1"
            >
              <Calendar size={11} />
              Calendar
            </button>
          </div>
        </div>

        <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
          <button
            onClick={onReturnToWorld}
            className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${
              activeView === "world"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Users size={14} />
            People
          </button>
          <button
            onClick={onOpenChatPage}
            className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${
              activeView === "chat"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <MessageCircle size={14} />
            Chat
            {unreadChatCount > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500 text-white">
                {unreadChatCount > 99 ? "99+" : unreadChatCount}
              </span>
            )}
            {unreadMentionCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                @{unreadMentionCount > 99 ? "99+" : unreadMentionCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-3">
          <PeoplePanel
            members={members}
            userId={user.id}
            search={search}
            onlineIds={onlineIds}
            onCallVideo={onCallVideo}
            callingUserId={callingUserId}
          />
        </div>

        <div className="border-t border-slate-100 p-3 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <img
              src={currentUserAvatar}
              alt="User Avatar"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full border border-slate-200 object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user.displayName}</p>
              <p className="text-[11px] text-slate-500">You are online</p>
            </div>
            <button className="ml-auto w-7 h-7 rounded-md border border-slate-200 text-slate-500 flex items-center justify-center">
              <MoreHorizontal size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setInviteOpen(true)}
              className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1"
            >
              <Send size={12} />
              Invite
            </button>
            <button className="rounded-lg border border-slate-200 bg-white py-2 px-2 text-slate-600 hover:bg-slate-100">
              <Compass size={14} />
            </button>
            <button
              onClick={() => onUpdatePresence("in_call")}
              className="rounded-lg border border-emerald-200 bg-emerald-50 py-2 px-3 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold"
            >
              In call
            </button>
            <button
              onClick={() => navigate("/home")}
              title="Leave Room"
              className="rounded-lg border border-red-200 bg-red-50 py-2 px-3 text-red-600 hover:bg-red-100"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      {inviteOpen && (
        <div className="absolute inset-0 z-80 pointer-events-auto bg-black/20 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-4">
            <p className="text-sm font-bold text-slate-800">Invite to room</p>
            <p className="text-xs text-slate-500 mt-1">Room code: <b>{roomCode}</b></p>

            <div className="mt-3 flex items-center gap-2">
              <input
                readOnly
                value={roomLink}
                className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50"
              />
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(roomCode || roomLink);
                  setInviteNotice("Copied room code.");
                }}
                className="text-xs px-2.5 py-2 rounded-lg border border-slate-200"
              >
                Copy code
              </button>
            </div>

            <textarea
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              placeholder="emails, separated by comma"
              className="mt-3 w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 min-h-[88px]"
            />

            {inviteNotice && <p className="mt-2 text-xs text-slate-500">{inviteNotice}</p>}

            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setInviteOpen(false)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-200"
              >
                Close
              </button>
              <button
                disabled={inviteSending || !roomCode}
                onClick={async () => {
                  const emails = inviteEmails
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean);
                  if (emails.length === 0) {
                    setInviteNotice("Please input at least one email.");
                    return;
                  }
                  try {
                    setInviteSending(true);
                    setInviteNotice(null);
                    const res = await apiFetch(`/api/rooms/${roomCode}/invite`, {
                      method: "POST",
                      body: JSON.stringify({ emails }),
                    });
                    if (res?.success) {
                      setInviteNotice(`Sent ${res.invited} invitation email(s).`);
                    } else {
                      setInviteNotice("Failed to send invite emails.");
                    }
                  } catch (error: any) {
                    setInviteNotice(error?.message || "Failed to send invite emails.");
                  } finally {
                    setInviteSending(false);
                  }
                }}
                className="text-xs px-3 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-60"
              >
                {inviteSending ? "Sending..." : "Send email invite"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
