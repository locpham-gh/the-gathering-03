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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 w-full max-w-5xl h-[80vh] flex overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-64 bg-white/50 dark:bg-zinc-950/50 border-r border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Public Library</h2>
              <p className="text-xs text-zinc-500">Knowledge CMS</p>
            </div>
          </div>

          <div className="space-y-1 mt-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === cat.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <cat.icon size={18} />
                <span className="font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative h-full">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors z-10"
          >
            <X size={20} className="text-zinc-500" />
          </button>

          {/* Top Bar / Actions */}
          <div className="p-8 pb-4">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              {categories.find(c => c.id === activeTab)?.label || "Library Content"}
            </h1>
            
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Search guides, books, and courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/70 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Grid Area */}
          <div className="flex-1 overflow-y-auto p-8 pt-4">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : resources.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                <BookOpen size={48} className="mb-4 opacity-50" />
                <p>No resources found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((resource) => (
                  <div
                    key={resource._id}
                    className="group flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1"
                    onClick={() => window.open(resource.fileUrl, '_blank')}
                  >
                    <div className="h-40 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950 relative">
                      {resource.thumbnailUrl ? (
                        <img 
                          src={resource.thumbnailUrl} 
                          alt={resource.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-300">
                          <BookOpen size={48} />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-medium capitalize flex items-center gap-1">
                        {resource.contentType === "course" && <Video size={12} />}
                        {resource.contentType === "e-book" && <BookOpen size={12} />}
                        {resource.contentType === "guide" && <FileText size={12} />}
                        {resource.contentType}
                      </div>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 line-clamp-1 mb-2">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 flex-1">
                        {resource.description}
                      </p>
                      
                      <div className="flex items-center gap-2 text-primary font-medium text-sm mt-auto">
                        <span>Check it out</span>
                        <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform" />
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
