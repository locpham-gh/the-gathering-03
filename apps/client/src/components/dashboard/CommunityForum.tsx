import { useState, useEffect } from "react";
import { Heart, MessageCircle, Trash } from "lucide-react";
import { forumApi } from "../../lib/api";

// --- Interfaces ---

interface Reply {
  _id: string;
  authorId: {
    _id: string;
    displayName: string;
    avatarUrl: string;
  };
  replyTo?: {
    _id: string;
    displayName: string;
  };
  content: string;
  likes: string[]; // Added likes for replies
  createdAt: string;
}

interface Topic {
  _id: string;
  authorId: {
    _id: string;
    displayName: string;
    avatarUrl: string;
  };
  title: string;
  likes: string[];
  replies: Reply[];
  createdAt: string;
}

// --- Helper Functions ---

const timeAgo = (dateStr: string) => {
  const min = Math.floor(
    (new Date().getTime() - new Date(dateStr).getTime()) / 60000,
  );
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

interface User {
  id: string;
  avatarUrl: string;
  displayName: string;
}

// --- Sub-Components ---

/**
 * ForumComposer: Input area for new threads
 */
const ForumComposer = ({
  user,
  onPost,
}: {
  user: User;
  onPost: (content: string) => void;
}) => {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onPost(content);
    setContent("");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 transition-all focus-within:ring-2 focus-within:ring-teal-500/10">
      <div className="flex gap-4">
        <img
          src={user.avatarUrl}
          referrerPolicy="no-referrer"
          className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-slate-50 shadow-sm"
          alt="User Avatar"
        />
        <form onSubmit={handleSubmit} className="flex-1">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            placeholder="Bạn đang nghĩ gì?"
            className="w-full bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 text-lg resize-none min-h-[60px] font-sans"
            rows={1}
          />
          <div className="flex justify-end pt-4 border-t border-slate-50">
            <button
              type="submit"
              disabled={!content.trim()}
              className="bg-teal-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-teal-700 transition-all disabled:opacity-30 shadow-md shadow-teal-600/10 transform active:scale-95"
            >
              Đăng bài
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * ReplyItem: Individual reply with thread line logic
 */
const ReplyItem = ({
  reply,
  isLast,
  currentUserId,
  onDelete,
  onReply,
  onToggleLike,
}: {
  reply: Reply;
  isLast: boolean;
  currentUserId: string;
  onDelete: () => void;
  onReply: () => void;
  onToggleLike: () => void;
}) => (
  <div className="group flex gap-4 relative">
    {!isLast && (
      <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-slate-200/70" />
    )}

    <div className="shrink-0 z-10">
      <img
        src={
          reply.authorId?.avatarUrl ||
          "https://api.dicebear.com/8.x/notionists/svg?seed=fallback"
        }
        referrerPolicy="no-referrer"
        className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover bg-slate-200"
        alt="Reply Author"
      />
    </div>
    <div className="flex-1 min-w-0">
      <div className="bg-white p-4 rounded-xl rounded-tl-none border border-slate-200/60 shadow-sm relative">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-slate-900 text-sm">
            {reply.authorId?.displayName || "User"}
          </span>
          <span className="text-slate-400 text-[10px] font-bold">
            {timeAgo(reply.createdAt)}
          </span>
          {reply.authorId?._id === currentUserId && (
            <button
              onClick={onDelete}
              className="ml-auto opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
            >
              <Trash size={14} />
            </button>
          )}
        </div>
        <p className="text-slate-700 text-[14px] leading-normal break-words font-sans">
          {reply.replyTo?.displayName && (
            <span className="text-teal-600 font-extrabold mr-2">
              @{reply.replyTo.displayName}
            </span>
          )}
          {reply.content}
        </p>
      </div>
      <div className="flex items-center gap-4 mt-1 ml-1">
        <button
          onClick={onReply}
          className="text-[11px] font-bold text-slate-400 hover:text-teal-600 uppercase tracking-widest transition-colors"
        >
          Trả lời
        </button>
        <button
          onClick={onToggleLike}
          className={`flex items-center gap-1.5 text-[11px] font-bold transition-all ${
            reply.likes?.includes(currentUserId)
              ? "text-red-500"
              : "text-slate-400 hover:text-red-500"
          }`}
        >
          <Heart
            size={12}
            className={reply.likes?.includes(currentUserId) ? "fill-current" : ""}
          />
          {reply.likes?.length > 0 && <span>{reply.likes.length}</span>}
        </button>
      </div>
    </div>
  </div>
);

/**
 * ReplyForm: Inline form for replying to a topic/reply
 */
const ReplyForm = ({
  user,
  replyToUser,
  content,
  onContentChange,
  onCancelReplyTo,
  onSubmit,
}: {
  user: User;
  replyToUser: { id: string; name: string } | null;
  content: string;
  onContentChange: (val: string) => void;
  onCancelReplyTo: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) => (
  <div className="p-6 bg-slate-50/80 border-t border-slate-100">
    <div className="flex gap-4">
      <img
        src={user.avatarUrl}
        className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
        alt="User Avatar"
      />
      <form onSubmit={onSubmit} className="flex-1">
        {replyToUser && (
          <div className="flex items-center gap-2 mb-2 animate-in fade-in slide-in-from-left-2">
            <span className="text-[11px] bg-teal-100 text-teal-700 px-2.5 py-0.5 rounded-lg font-bold">
              Replying to @{replyToUser.name}
            </span>
            <button
              type="button"
              onClick={onCancelReplyTo}
              className="text-slate-400 hover:text-red-500"
            >
              <Trash size={14} />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            autoFocus
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Viết câu trả lời..."
            className="flex-1 bg-white border border-slate-200 px-4 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-sans"
          />
          <button
            type="submit"
            disabled={!content.trim()}
            className="bg-teal-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-teal-700 transition-all disabled:opacity-30"
          >
            Gửi
          </button>
        </div>
      </form>
    </div>
  </div>
);

// --- Main Component ---

export function CommunityForum({ user }: { user: User }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyToUser, setReplyToUser] = useState<{
    id: string;
    name: string;
    topicId: string;
  } | null>(null);

  const loadTopics = async () => {
    try {
      const res = await forumApi.getTopics();
      if (res.success) setTopics(res.topics);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const host = apiUrl.replace(/^https?:\/\//, "");
    const ws = new WebSocket(`${protocol}//${host}/ws?room=forum_global`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "forum_refresh") loadTopics();
      } catch {
        /* Ignore non-JSON */
      }
    };

    const handleRefresh = () => loadTopics();
    window.addEventListener("forum-refresh", handleRefresh);

    return () => {
      window.removeEventListener("forum-refresh", handleRefresh);
      if (ws.readyState === WebSocket.OPEN) ws.close();
      else ws.onopen = () => ws.close();
    };
  }, []);

  const handleCreateTopic = async (content: string) => {
    const res = await forumApi.createTopic(content);
    if (res.success) loadTopics();
  };

  const handleAddReply = async (topicId: string, e: React.FormEvent) => {
    e.preventDefault();
    const content = replyContent[topicId];
    if (!content?.trim()) return;

    const currentReplyToId =
      replyToUser?.topicId === topicId ? replyToUser.id : undefined;
    setReplyContent({ ...replyContent, [topicId]: "" });
    setActiveReplyId(null);
    setReplyToUser(null);

    const res = await forumApi.addReply(topicId, content, currentReplyToId);
    if (res.success) loadTopics();
  };

  const handleToggleLike = async (topicId: string) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t._id === topicId) {
          const hasLiked = t.likes.includes(user.id);
          const newLikes = hasLiked
            ? t.likes.filter((id) => id !== user.id)
            : [...t.likes, user.id];
          return { ...t, likes: newLikes };
        }
        return t;
      }),
    );
    try {
      await forumApi.toggleLike(topicId);
    } catch {
      loadTopics();
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (confirm("Are you sure you want to delete this thread?")) {
      const res = await forumApi.deleteTopic(id);
      if (res.success) loadTopics();
    }
  };

  const handleToggleLikeReply = async (topicId: string, replyId: string) => {
    // Optimistic UI
    setTopics((prev) =>
      prev.map((t) => {
        if (t._id === topicId) {
          const newReplies = t.replies.map((r) => {
            if (r._id === replyId) {
              const hasLiked = r.likes.includes(user.id);
              const newLikes = hasLiked
                ? r.likes.filter((id) => id !== user.id)
                : [...r.likes, user.id];
              return { ...r, likes: newLikes };
            }
            return r;
          });
          return { ...t, replies: newReplies };
        }
        return t;
      }),
    );
    try {
      await forumApi.toggleLikeReply(topicId, replyId);
    } catch {
      loadTopics();
    }
  };

  const handleDeleteReply = async (topicId: string, replyId: string) => {
    if (confirm("Delete this reply?")) {
      const res = await forumApi.deleteReply(topicId, replyId);
      if (res.success) loadTopics();
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center mb-8 py-4 border-b border-slate-100">
        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Forum
        </h3>
      </div>

      <ForumComposer user={user} onPost={handleCreateTopic} />

      <div className="space-y-6">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 border border-slate-100 animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-1/4" />
                    <div className="h-4 bg-slate-100 rounded w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
            <MessageCircle className="mx-auto mb-4 text-slate-300" size={64} />
            <p className="text-slate-400 font-medium">
              Chưa có bài thảo luận nào.
            </p>
          </div>
        ) : (
          topics.map((topic) => (
            <div
              key={topic._id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:border-slate-300"
            >
              <div className="p-6">
                <div className="flex gap-4">
                  <img
                    src={topic.authorId.avatarUrl}
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                    alt="Author"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900">
                        {topic.authorId.displayName}
                      </span>
                      <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                        • {timeAgo(topic.createdAt)}
                      </span>
                      {topic.authorId?._id === user.id && (
                        <button
                          onClick={() => handleDeleteTopic(topic._id)}
                          className="ml-auto text-slate-300 hover:text-red-500 p-1"
                        >
                          <Trash size={16} />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-800 text-[16px] leading-relaxed whitespace-pre-wrap break-words font-sans">
                      {topic.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8 mt-6 ml-16">
                  <button
                    onClick={() => handleToggleLike(topic._id)}
                    className={`flex items-center gap-2 text-sm font-bold ${topic.likes?.includes(user.id) ? "text-red-500" : "text-slate-500 hover:text-red-500"}`}
                  >
                    <Heart
                      size={20}
                      className={
                        topic.likes?.includes(user.id) ? "fill-current" : ""
                      }
                    />
                    {topic.likes?.length > 0 && (
                      <span>{topic.likes.length}</span>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      setActiveReplyId(
                        activeReplyId === topic._id ? null : topic._id,
                      )
                    }
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-teal-600"
                  >
                    <MessageCircle size={20} />
                    {topic.replies?.length > 0 && (
                      <span>{topic.replies.length}</span>
                    )}
                  </button>
                </div>
              </div>

              {topic.replies?.length > 0 && (
                <div className="bg-slate-50/50 border-t border-slate-100 p-6 pt-2">
                  <div className="space-y-6 relative mt-4">
                    {topic.replies.map((reply, idx) => (
                      <ReplyItem
                        key={reply._id}
                        reply={reply}
                        isLast={idx === topic.replies.length - 1}
                        currentUserId={user.id}
                        onDelete={() => handleDeleteReply(topic._id, reply._id)}
                        onReply={() => {
                          setActiveReplyId(topic._id);
                          setReplyToUser({
                            id: reply.authorId._id,
                            name: reply.authorId.displayName,
                            topicId: topic._id,
                          });
                        }}
                        onToggleLike={() => handleToggleLikeReply(topic._id, reply._id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeReplyId === topic._id && (
                <ReplyForm
                  user={user}
                  replyToUser={
                    replyToUser?.topicId === topic._id ? replyToUser : null
                  }
                  content={replyContent[topic._id] || ""}
                  onContentChange={(val) =>
                    setReplyContent({ ...replyContent, [topic._id]: val })
                  }
                  onCancelReplyTo={() => setReplyToUser(null)}
                  onSubmit={(e) => handleAddReply(topic._id, e)}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
