import { ChevronDown } from "lucide-react";
import { resolveAvatarUrl } from "../../../lib/profile";

interface Member {
  _id: string;
  displayName: string;
  avatarUrl?: string;
}

interface PeoplePanelProps {
  members: Member[];
  userId: string;
  search: string;
  onlineIds: Set<string>;
  callingUserId?: string | null;
  onCallVideo: (memberId: string) => void;
}

export function PeoplePanel({
  members,
  userId,
  search,
  onlineIds,
  callingUserId,
  onCallVideo,
}: PeoplePanelProps) {
  const filteredMembers = members.filter((member) =>
    member.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Online ({filteredMembers.length})</span>
        <span className="flex items-center gap-1">
          <ChevronDown size={12} />
          Active
        </span>
      </div>
      {filteredMembers.map((member) => {
        const isOnline = member._id === userId || onlineIds.has(member._id);
        const isSelf = member._id === userId;
        const isCallingThisMember = callingUserId === member._id;
        return (
          <div
            key={member._id}
            className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center gap-2.5"
          >
            <div className="relative">
              <img
                src={resolveAvatarUrl(member.avatarUrl)}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-slate-200"
              />
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${
                  isOnline ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-800">
                {member.displayName}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {isOnline ? "Active now" : "Offline"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isSelf && (
                <button
                  onClick={() => onCallVideo(member._id)}
                  disabled={!isOnline}
                  className={`text-[10px] px-2 py-1 rounded-md border ${
                    isCallingThisMember
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-700"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                  title={isOnline ? `Call ${member.displayName}` : "User offline"}
                >
                  {isCallingThisMember ? "Connected" : "Call video"}
                </button>
              )}
              {isSelf && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  You
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
