import React, { useState, useEffect, useCallback } from "react";
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Tag, 
  Loader2,
  X,
  Image as ImageIcon,
  Link as LinkIcon
} from "lucide-react";
import { apiFetch } from "../../lib/api";
import type { Resource } from "../game/library/types";

export const LibraryManager: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    contentType: "guide",
    fileUrl: "",
    thumbnailUrl: "",
    tags: ""
  });

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/admin/library?search=${searchTerm}`);
      if (res.success) {
        setResources(res.resources);
      }
    } catch (error) {
      console.error("Failed to fetch library resources", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        tags: formData.tags.split(",").map(t => t.trim()).filter(t => t)
      };
      const res = await apiFetch("/api/admin/library", {
        method: "POST",
        body: JSON.stringify(dataToSubmit)
      });
      if (res.success) {
        setIsAdding(false);
        setFormData({ title: "", description: "", contentType: "guide", fileUrl: "", thumbnailUrl: "", tags: "" });
        fetchResources();
      }
    } catch {
      alert("Failed to add resource");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      const res = await apiFetch(`/api/admin/library/${id}`, { method: "DELETE" });
      if (res.success) fetchResources();
    } catch {
      alert("Failed to delete resource");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Add Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                <BookOpen size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Digital Library Repository</h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Global Resource Management</p>
            </div>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl ${isAdding ? "bg-slate-100 text-slate-600 shadow-none" : "bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-200"}`}
        >
          {isAdding ? <X size={18} /> : <Plus size={18} />}
          {isAdding ? "Cancel Entry" : "Add New Resource"}
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-white rounded-[2.5rem] p-10 border-2 border-indigo-100 shadow-2xl shadow-indigo-100/50 animate-in zoom-in-95 duration-300">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Content Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Advanced TypeScript Patterns"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-bold"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Intel Description</label>
                <textarea 
                  required
                  placeholder="Deep dive into generic types and utility patterns..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-bold h-32"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <select 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-bold appearance-none"
                      value={formData.contentType}
                      onChange={e => setFormData({...formData, contentType: e.target.value})}
                    >
                      <option value="guide">Guide (Article)</option>
                      <option value="e-book">E-Book (PDF)</option>
                      <option value="course">Course (Video)</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tags (Comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="react, ts, frontend"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-bold"
                      value={formData.tags}
                      onChange={e => setFormData({...formData, tags: e.target.value})}
                    />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <LinkIcon size={12} /> Source URL
                </label>
                <input 
                  type="url" 
                  required
                  placeholder="https://example.com/resource"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-bold"
                  value={formData.fileUrl}
                  onChange={e => setFormData({...formData, fileUrl: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <ImageIcon size={12} /> Thumbnail Image URL
                </label>
                <input 
                  type="url" 
                  required
                  placeholder="https://unsplash.com/..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-bold"
                  value={formData.thumbnailUrl}
                  onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})}
                />
              </div>
              {formData.thumbnailUrl && (
                <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                    <img src={formData.thumbnailUrl} className="w-full h-full object-cover" alt="Preview" />
                </div>
              )}
              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Authenticate & Upload Resource
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Scanning Repository...</span>
            </div>
        ) : resources.length === 0 ? (
            <div className="col-span-full py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center gap-4 opacity-50">
                <BookOpen size={48} className="text-slate-300" />
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Repository Empty</span>
            </div>
        ) : resources.map(resource => (
          <div key={resource._id} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 hover:-translate-y-2 flex flex-col">
            <div className="relative h-48 overflow-hidden">
                <img src={resource.thumbnailUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={resource.title} />
                <div className="absolute top-4 left-4">
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md ${
                        resource.contentType === "guide" ? "bg-emerald-600/80" : 
                        resource.contentType === "e-book" ? "bg-indigo-600/80" : "bg-orange-600/80"
                    }`}>
                        {resource.contentType}
                    </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-4">
                    <a href={resource.fileUrl} target="_blank" rel="noreferrer" className="p-3 bg-white text-slate-900 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all transform hover:scale-110">
                        <ExternalLink size={20} />
                    </a>
                    <button onClick={() => handleDelete(resource._id)} className="p-3 bg-white text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all transform hover:scale-110">
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{resource.title}</h3>
                <p className="text-sm text-slate-400 font-medium mb-6 line-clamp-2">{resource.description}</p>
                <div className="mt-auto flex flex-wrap gap-2">
                    {resource.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-lg border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-400 group-hover:border-indigo-100 transition-all">
                            <Tag size={10} />
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
