import type { Zone } from "./zones";

interface ZoneModalProps {
  zone: Zone;
  onClose: () => void;
}

export function ZoneModal({ zone, onClose }: ZoneModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass p-8 rounded-2xl w-[480px] max-w-[90vw] shadow-2xl border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{zone.label}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-400"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>

        <p className="text-slate-300 mb-6">{zone.description}</p>

        <div className="space-y-4">
          {zone.id === "reception" && <ReceptionContent />}
          {zone.id === "library" && <LibraryContent />}
          {zone.id === "forum" && <ForumContent />}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 bg-primary/20 hover:bg-primary/30 text-white rounded-xl transition-colors border border-primary/30"
        >
          Press ESC or click here to leave
        </button>
      </div>
    </div>
  );
}

function ReceptionContent() {
  const [checkedIn, setCheckedIn] = useState(false);

  if (checkedIn) {
    return (
      <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl text-center space-y-2 animate-in fade-in zoom-in duration-300">
        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 className="text-green-400 font-bold">You're checked in!</h3>
        <p className="text-green-400/70 text-xs">Your team now knows you are online and ready to collaborate.</p>
        <button 
          onClick={() => setCheckedIn(false)}
          className="text-slate-500 text-[10px] hover:text-slate-400 underline pt-2"
        >
          Check out
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-4 bg-slate-800/30 rounded-xl">
        <h3 className="text-white font-semibold mb-2">Welcome!</h3>
        <p className="text-slate-400 text-sm">
          Check in at the reception desk to let your team know you are online.
        </p>
      </div>
      <button 
        onClick={() => setCheckedIn(true)}
        className="w-full px-4 py-3 bg-primary hover:bg-primary/80 text-white rounded-xl transition-colors font-bold shadow-lg shadow-primary/20"
      >
        Check In
      </button>
    </div>
  );
}

import { useState, useEffect } from "react";
import { resourcesApi, forumApi } from "../../lib/api";

function LibraryContent() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resourcesApi.getAll()
      .then(res => setResources(res.resources))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 animate-pulse">Loading resources...</div>;

  return (
    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
      {resources.length === 0 ? (
        <p className="text-slate-500 text-sm">No resources available.</p>
      ) : (
        resources.map((res) => (
          <div key={res._id} className="p-4 bg-slate-800/40 rounded-xl border border-white/5 flex items-center justify-between hover:bg-slate-800/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                {res.type === 'pdf' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M5 18h1.5a1.5 1.5 0 0 0 0-3H5v6"/><path d="M11 18h1.5a1.5 1.5 0 0 0 0-3H11v6"/><path d="M17 18h1.5a1.5 1.5 0 0 0 0-3H17v6"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><rect width="20" height="15" x="2" y="3" rx="2" ry="2"/><polyline points="8 21 12 17 16 21"/><line x1="2" x2="22" y1="12" y2="12"/></svg>
                )}
              </div>
              <div>
                <h4 className="text-white text-sm font-medium">{res.title}</h4>
                <p className="text-slate-500 text-xs">{(res.size / 1024).toFixed(1)} KB • {res.type.toUpperCase()}</p>
              </div>
            </div>
            <a 
              href={res.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 hover:bg-white/10 rounded-lg text-primary transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </a>
          </div>
        ))
      )}
    </div>
  );
}

function ForumContent() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newReplyContent, setNewReplyContent] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchTopics = () => {
    setLoading(true);
    forumApi.getTopics()
      .then(res => setTopics(res.topics))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    try {
      await forumApi.createTopic(newTopicTitle);
      setNewTopicTitle("");
      setShowCreateForm(false);
      fetchTopics();
    } catch (err) {
      alert("Failed to create topic. Are you logged in?");
    }
  };

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyContent.trim() || !selectedTopic) return;
    try {
      const res = await forumApi.addReply(selectedTopic._id, newReplyContent);
      setNewReplyContent("");
      setSelectedTopic(res.topic);
      fetchTopics();
    } catch (err) {
      alert("Failed to add reply.");
    }
  };

  if (loading && topics.length === 0) return <div className="text-slate-400 animate-pulse">Loading discussions...</div>;

  if (selectedTopic) {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setSelectedTopic(null)}
          className="text-primary text-sm flex items-center gap-1 hover:underline"
        >
          ← Back to Board
        </button>
        <div className="p-4 bg-slate-800/60 rounded-xl border border-primary/20">
          <h3 className="text-white font-bold text-lg mb-1">{selectedTopic.title}</h3>
          <p className="text-slate-500 text-xs">Started by {selectedTopic.authorId?.displayName || 'Unknown'}</p>
        </div>
        
        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
          {selectedTopic.replies.map((reply: any, i: number) => (
            <div key={i} className="p-3 bg-slate-900/40 rounded-lg border border-white/5">
              <p className="text-slate-300 text-sm mb-1">{reply.content}</p>
              <p className="text-slate-500 text-[10px]">{reply.authorId?.displayName || 'User'} • {new Date(reply.createdAt).toLocaleString()}</p>
            </div>
          ))}
          {selectedTopic.replies.length === 0 && <p className="text-slate-500 text-xs text-center">No replies yet.</p>}
        </div>

        <form onSubmit={handleAddReply} className="flex gap-2">
          <input 
            type="text"
            value={newReplyContent}
            onChange={(e) => setNewReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
          />
          <button type="submit" className="px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/80 transition-colors">
            Reply
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-semibold">Discussion Board</h3>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="text-xs px-2 py-1 bg-primary/20 text-primary border border-primary/30 rounded hover:bg-primary/30 transition-colors"
        >
          {showCreateForm ? 'Cancel' : '+ New Topic'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateTopic} className="p-4 bg-slate-800/40 rounded-xl border border-primary/30 space-y-3">
          <input 
            type="text"
            value={newTopicTitle}
            onChange={(e) => setNewTopicTitle(e.target.value)}
            placeholder="Topic title..."
            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
          />
          <button type="submit" className="w-full py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/80 transition-colors">
            Create Topic
          </button>
        </form>
      )}

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {topics.map(topic => (
          <div 
            key={topic._id} 
            onClick={() => setSelectedTopic(topic)}
            className="p-4 bg-slate-800/40 rounded-xl border border-white/5 hover:bg-slate-800/60 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-white text-sm font-medium group-hover:text-primary transition-colors">{topic.title}</h4>
                <p className="text-slate-500 text-[10px] mt-1">by {topic.authorId?.displayName || 'User'} • {topic.replies.length} replies</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 group-hover:text-primary transition-colors"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </div>
        ))}
        {topics.length === 0 && !loading && (
          <p className="text-slate-500 text-sm text-center py-8">No discussions yet. Start one!</p>
        )}
      </div>
      
      <button 
        onClick={fetchTopics}
        className="w-full py-2 text-[10px] text-slate-500 hover:text-slate-400 uppercase tracking-widest transition-colors"
      >
        ↻ Refresh Board
      </button>
    </div>
  );
}
