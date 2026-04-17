import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { apiFetch } from "../lib/api";

import {
  DashboardOverview,
  WorkspaceList,
} from "../components/dashboard/RoomsManager";
import type { RoomData } from "../components/dashboard/RoomsManager";
import { EventsManager } from "../components/dashboard/EventsManager";
import { CommunityForum } from "../components/dashboard/CommunityForum";
import { ProfileSettings } from "../components/dashboard/ProfileSettings";

export default function HomePage() {
  const { user } = useAuth();
  const location = useLocation();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    setLoading(true);
    const res = await apiFetch("/api/rooms");
    if (res.success) {
      setRooms(res.rooms);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchRooms();
  }, [user]);

  if (!user) return null;

  // Sub-views based on path
  const isRoomsView = location.pathname === "/home/rooms";
  const isProfileView = location.pathname === "/home/profile";
  const isEventsView = location.pathname === "/home/events";
  const isForumView = location.pathname === "/home/forum";

  return (
    <DashboardLayout>
      {isEventsView ? (
        <EventsManager user={user} />
      ) : isForumView ? (
        <CommunityForum user={user} />
      ) : isProfileView ? (
        <ProfileSettings user={user} />
      ) : isRoomsView ? (
        <WorkspaceList
          user={user}
          rooms={rooms}
          loading={loading}
          fetchRooms={fetchRooms}
        />
      ) : (
        <DashboardOverview user={user} rooms={rooms} fetchRooms={fetchRooms} />
      )}
    </DashboardLayout>
  );
}
