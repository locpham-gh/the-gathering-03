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
    getAll: () => apiFetch("/api/resources"),
};

export const forumApi = {
    getTopics: () => apiFetch("/api/forum/topics"),
    createTopic: (title: string) => apiFetch("/api/forum/topics", {
        method: "POST",
        body: JSON.stringify({ title }),
    }),
    addReply: (topicId: string, content: string) => apiFetch(`/api/forum/topics/${topicId}/replies`, {
        method: "POST",
        body: JSON.stringify({ content }),
    }),
};
