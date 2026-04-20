import { CommunityForum } from "../dashboard/CommunityForum";

interface CommunityWorkspaceProps {
  user: { id: string; displayName: string; avatarUrl: string; gender?: string };
}

export function CommunityWorkspace({ user }: CommunityWorkspaceProps) {
  return (
    <div className="h-full w-full p-4 md:p-6 overflow-y-auto bg-slate-100">
      <CommunityForum user={user} />
    </div>
  );
}
