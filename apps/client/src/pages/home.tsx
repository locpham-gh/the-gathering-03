import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { apiFetch } from "../lib/api";

import { DashboardOverview } from "../components/dashboard/rooms/DashboardOverview";
import { WorkspaceList } from "../components/dashboard/rooms/WorkspaceList";
import type { RoomData } from "../components/dashboard/rooms/types";
import { EventsManager } from "../components/dashboard/EventsManager";
import { CommunityForum } from "../components/dashboard/CommunityForum";
import { ProfileSettings } from "../components/dashboard/ProfileSettings";

export default function HomePage() {
  const { user } = useAuth();
  const location = useLocation();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    // loading is already true from state init
    const res = await apiFetch("/api/rooms");
    if (res.success) {
      setRooms(res.rooms);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) fetchRooms();
  }, [user, fetchRooms]);

  if (!user) return null;

  // Sub-views based on path
  const isRoomsView = location.pathname === "/home/rooms";
  const isProfileView = location.pathname === "/home/profile";
  const isEventsView = location.pathname === "/home/events";
  const isForumView = location.pathname === "/home/forum";

  return (
    <DashboardLayout>
      {isEventsView ? (
        <EventsManager user={{ id: user.id }} />
      ) : isForumView ? (
        <CommunityForum 
          user={{ 
            id: user.id, 
            displayName: user.displayName, 
            avatarUrl: user.avatarUrl || "" 
          }} 
        />
      ) : isProfileView ? (
        <ProfileSettings 
          user={{ 
            displayName: user.displayName, 
            avatarUrl: user.avatarUrl || "" 
          }} 
        />
      ) : isRoomsView ? (
        <WorkspaceList
          user={{ id: user.id }}
          rooms={rooms}
          loading={loading}
          fetchRooms={fetchRooms}
        />
      ) : (
        <DashboardOverview 
          user={{ displayName: user.displayName }} 
          rooms={rooms} 
          fetchRooms={fetchRooms} 
        />
      )}
    </DashboardLayout>
  );
}
