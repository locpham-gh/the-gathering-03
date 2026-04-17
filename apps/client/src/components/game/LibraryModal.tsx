import React, { useEffect, useState } from "react";
import { resourcesApi } from "../../lib/api";
import { Search, BookOpen, Video, FileText, X, ExternalLink, Filter } from "lucide-react";

interface Resource {
  _id: string;
  title: string;
  description: string;
  contentType: "guide" | "e-book" | "course";
  fileUrl: string;
  thumbnailUrl: string;
  tags: string[];
}

export const LibraryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const res = await resourcesApi.getAll(search, activeTab);
        if (res.success) {
          setResources(res.resources);
        }
      } catch (e) {
        console.error("Failed to fetch library resources", e);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchResources();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, activeTab]);

  const categories = [
    { id: "", label: "All Items", icon: Filter },
    { id: "e-book", label: "E-Books", icon: BookOpen },
    { id: "guide", label: "Guides", icon: FileText },
    { id: "course", label: "Courses", icon: Video },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-950/60 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-[0_0_80px_-15px_rgba(15,118,110,0.3)] border border-teal-500/20 w-full max-w-7xl h-full flex overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-64 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-6 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-3 bg-teal-600 rounded-xl text-white shadow-lg shadow-teal-600/30">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Public Library</h2>
              <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mt-0.5">Knowledge CMS</p>
            </div>
          </div>

          <div className="space-y-1 mt-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
                  activeTab === cat.id
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/20 translate-x-1"
                    : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                }`}
              >
                <cat.icon size={18} />
                <span className="font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative h-full bg-white">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2.5 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-full transition-all z-10 text-slate-500 group shadow-sm"
          >
            <X size={20} className="group-hover:scale-110 transition-transform" />
          </button>

          {/* Top Bar / Actions */}
          <div className="p-10 pb-6 border-b border-slate-100 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/2 pointer-events-none"></div>
            <h1 className="text-4xl font-black text-slate-800 mb-6 tracking-tight flex items-center gap-3 relative z-10">
              {categories.find(c => c.id === activeTab)?.label || "Library Content"}
              <span className="text-teal-600">.</span>
            </h1>
            
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Search guides, books, and courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400 shadow-sm"
              />
            </div>
          </div>

          {/* Grid Area */}
          <div className="flex-1 overflow-y-auto p-10 pt-6 relative z-10">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : resources.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <BookOpen size={64} className="mb-4 text-slate-200" />
                <p className="font-semibold text-lg">No resources found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((resource) => (
                  <div
                    key={resource._id}
                    className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-teal-900/5 hover:border-teal-500/30 transition-all duration-300 cursor-pointer hover:-translate-y-2"
                    onClick={() => window.open(resource.fileUrl, '_blank')}
                  >
                    <div className="h-48 w-full overflow-hidden bg-slate-100 relative">
                      {resource.thumbnailUrl ? (
                        <img 
                          src={resource.thumbnailUrl} 
                          alt={resource.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <BookOpen size={48} />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur-md rounded-full text-white text-xs font-bold capitalize flex items-center gap-1.5 shadow-lg">
                        {resource.contentType === "course" && <Video size={14} />}
                        {resource.contentType === "e-book" && <BookOpen size={14} />}
                        {resource.contentType === "guide" && <FileText size={14} />}
                        {resource.contentType}
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col bg-white">
                      <h3 className="font-bold text-xl text-slate-800 line-clamp-2 mb-2 group-hover:text-teal-600 transition-colors">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-1 pr-4 leading-relaxed">
                        {resource.description}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2 text-teal-600 font-bold text-sm bg-teal-50 px-4 py-2 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          <span>Check it out</span>
                          <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
