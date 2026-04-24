const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token");
    
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(error.message || "Request failed");
    }

    return response.json();
}

export const resourcesApi = {
    getAll: (search?: string, type?: string, tag?: string) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (type) params.append("type", type);
        if (tag) params.append("tag", tag);
        
        const qs = params.toString();
        const endpoint = qs ? `/api/resources?${qs}` : "/api/resources";
        return apiFetch(endpoint);
    },
};

export const forumApi = {
    getTopics: () => apiFetch("/api/forum/topics"),
    createTopic: (title: string) => apiFetch("/api/forum/topics", {
        method: "POST",
        body: JSON.stringify({ title }),
    }),
    addReply: (topicId: string, content: string, replyToId?: string) => apiFetch(`/api/forum/topics/${topicId}/replies`, {
        method: "POST",
        body: JSON.stringify({ content, replyToId }),
    }),
    deleteTopic: (topicId: string) => apiFetch(`/api/forum/topics/${topicId}`, {
        method: "DELETE"
    }),
    toggleLike: (topicId: string) => apiFetch(`/api/forum/topics/${topicId}/like`, {
        method: "POST"
    }),
    deleteReply: (topicId: string, replyId: string) => apiFetch(`/api/forum/topics/${topicId}/replies/${replyId}`, {
        method: "DELETE"
    }),
    toggleLikeReply: (topicId: string, replyId: string) => apiFetch(`/api/forum/topics/${topicId}/replies/${replyId}/like`, {
        method: "POST"
    }),
};

export const eventsApi = {
    scheduleMeeting: (data: {
      roomId: string;
      hostId: string;
      title: string;
      description: string;
      startTime: string; // ISO String
      endTime: string;   // ISO String
      guestEmails: string[];
    }) => apiFetch(`/api/events`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    getMyEvents: () => apiFetch(`/api/events`),
    deleteEvent: (id: string) => apiFetch(`/api/events/${id}`, { method: "DELETE" }),
};

export const notificationsApi = {
    getNotifications: () => apiFetch("/api/forum/notifications"),
    markAsRead: (id: string) => apiFetch(`/api/forum/notifications/${id}/read`, {
        method: "POST"
    }),
};
