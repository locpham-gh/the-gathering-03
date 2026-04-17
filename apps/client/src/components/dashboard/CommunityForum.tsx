import { useState, useEffect } from "react";
import { MessageSquare, Heart, Trash, MoreHorizontal } from "lucide-react";
import { forumApi } from "../../lib/api";

export function CommunityForum({ user }: { user: any }) {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopicContent, setNewTopicContent] = useState("");
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const res = await forumApi.getTopics();
      if (res.success) {
        setTopics(res.topics);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicContent.trim()) return;

    // Optimistic UI for topic
    setNewTopicContent("");

    const res = await forumApi.createTopic(newTopicContent);
    if (res.success) {
      loadTopics();
    }
  };

  const handleAddReply = async (topicId: string, e: React.FormEvent) => {
    e.preventDefault();
    const content = replyContent[topicId];
    if (!content?.trim()) return;

    setReplyContent({ ...replyContent, [topicId]: "" });
    setActiveReplyId(null);

    const res = await forumApi.addReply(topicId, content);
    if (res.success) {
      loadTopics();
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm("Are you sure you want to delete this thread?")) return;
    const res = await forumApi.deleteTopic(topicId);
    if (res.success) {
      loadTopics();
    }
  };

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

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-slate-50/90 backdrop-blur-md z-10 py-4 border-b border-transparent">
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
          Cộng Đồng
        </h3>
      </div>

      {/* Composer */}
      <div className="bg-white rounded-t-2xl shadow-sm border border-slate-200 border-b-0 p-6 flex gap-4 relative z-0">
        <img
          src={user.avatarUrl}
          referrerPolicy="no-referrer"
          className="w-10 h-10 rounded-full object-cover shrink-0 z-10 bg-white"
        />
        <div className="flex-1">
          <form onSubmit={handleCreateTopic}>
            <p className="font-semibold text-slate-800 text-sm mb-1">
              {user.displayName}
            </p>
            <textarea
              value={newTopicContent}
              onChange={(e) => {
                setNewTopicContent(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              className="w-full text-slate-800 placeholder:text-slate-400 bg-transparent resize-none outline-none overflow-hidden min-h-[40px] text-sm mt-1"
              placeholder="Bắt đầu một thread..."
              rows={1}
            />
            <div className="flex justify-between items-center mt-3 pt-3">
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 transition-colors"
              ></button>
                 <button
                type="submit"
                disabled={!newTopicContent.trim()}
                className="bg-teal-600 text-white px-6 py-1.5 rounded-full text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                Đăng
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="h-px w-full bg-slate-200 shadow-sm" />

      {/* Feed */}
      <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200 border-t-0 min-h-[50vh]">
        {loading ? (
          <div className="py-20 text-center text-slate-400 animate-pulse font-medium">
            Đang tải bảng tin...
          </div>
        ) : topics.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            Chưa có bài viết nào. Hãy là người đầu tiên!
          </div>
        ) : (
          topics.map((topic, i) => (
            <div
              key={topic._id}
              className="group border-b border-slate-100 last:border-b-0 p-6 pt-5 transition-colors hover:bg-slate-50/50"
            >
              <div className="flex gap-4">
                {/* Left Column Avatar and Thread Line */}
                <div className="flex flex-col items-center shrink-0 relative">
                  <img
                    src={topic.authorId.avatarUrl}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover z-10 bg-white"
                  />
                  {/* Thread vertical line going down - only if there are replies */}
                  {topic.replies.length > 0 && (
                    <div className="w-px bg-slate-200 absolute top-12 bottom-0 z-0 h-[calc(100%+32px)]" />
                  )}
                </div>

                {/* Right Column Content */}
                <div className="flex-1 pb-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800 text-sm hover:underline cursor-pointer">
                      {topic.authorId.displayName}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-sm">
                        {timeAgo(topic.createdAt)}
                      </span>
                      {topic.authorId._id === user.id && (
                        <button
                          onClick={() => handleDeleteTopic(topic._id)}
                          className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash size={16} />
                        </button>
                      )}
                      <button className="text-slate-400 hover:text-slate-600">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-800 text-sm mt-1 mb-4 leading-relaxed whitespace-pre-wrap">
                    {topic.title}
                  </p>

                  <div className="flex items-center gap-5 text-slate-500 mt-2">
                    <button className="hover:bg-teal-50 hover:text-teal-600 p-1.5 rounded-full transition-colors">
                      <Heart size={18} />
                    </button>
                    <button
                      onClick={() =>
                        setActiveReplyId(
                          activeReplyId === topic._id ? null : topic._id,
                        )
                      }
                      className="hover:bg-teal-50 hover:text-teal-600 p-1.5 rounded-full transition-colors flex items-center gap-2"
                    >
                      <MessageSquare size={18} />
                      {topic.replies.length > 0 && (
                        <span className="text-xs font-semibold">
                          {topic.replies.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Replies Rendering Area */}
              {topic.replies.length > 0 && (
                <div className="pl-6 pt-4 relative">
                  {topic.replies.map((reply: any, idx: number) => (
                    <div
                      key={reply._id}
                      className="flex gap-4 mt-4 first:mt-0 relative z-10"
                    >
                      {/* Reply Avatar Overlapping the line */}
                      <div className="flex flex-col items-center shrink-0">
                        <img
                          src={
                            reply.authorId?.avatarUrl ||
                            "https://api.dicebear.com/8.x/notionists/svg?seed=fallback"
                          }
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full border-2 border-white object-cover bg-slate-100"
                        />
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-sm hover:underline cursor-pointer">
                            {reply.authorId?.displayName || "Unknown User"}
                          </span>
                          <span className="text-slate-400 text-xs">
                            {timeAgo(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm mt-0.5 leading-relaxed">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input Form (Appears when active) */}
              {activeReplyId === topic._id && (
                <div className="flex gap-4 mt-6 items-start relative z-10 relative">
                  <img
                    src={user.avatarUrl}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full ml-[4px] border border-white"
                  />
                  <form
                    onSubmit={(e) => handleAddReply(topic._id, e)}
                    className="flex-1 flex gap-2"
                  >
                    <input
                      autoFocus
                      value={replyContent[topic._id] || ""}
                      onChange={(e) =>
                        setReplyContent({
                          ...replyContent,
                          [topic._id]: e.target.value,
                        })
                      }
                      placeholder={`Trả lời ${topic.authorId.displayName}...`}
                      className="flex-1 text-sm bg-slate-100 px-4 py-2 rounded-full outline-none focus:bg-slate-200 transition-colors text-slate-800 placeholder:text-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={!replyContent[topic._id]?.trim()}
                      className="bg-teal-600 text-white px-5 py-1.5 rounded-full text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
                    >
                      Gửi
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
