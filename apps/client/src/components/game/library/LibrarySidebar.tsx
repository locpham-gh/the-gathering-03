import React from "react";
import { Bookmark, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { Category } from "./types";

interface LibrarySidebarProps {
  categories: Category[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  selectedTag: string;
  setSelectedTag: (tag: string) => void;
  allTags: string[];
}

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({
  categories,
  activeTab,
  setActiveTab,
  selectedTag,
  setSelectedTag,
  allTags,
}) => {
  return (
    <aside className="w-80 bg-white border-r border-slate-200 p-10 flex flex-col gap-10 shrink-0 z-10">
      <div className="space-y-1">
        <div className="w-10 h-10 bg-primary rounded shadow-sm shadow-primary/20 flex items-center justify-center text-white font-black text-xl mb-6">
          G
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-800">
          Digital Library
        </h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          The Gathering Repository
        </p>
      </div>

      <nav className="space-y-6">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Categories</p>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveTab(cat.id);
                  setSelectedTag("");
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded transition-all duration-200 group ${
                  activeTab === cat.id
                    ? "bg-primary text-white font-bold shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <cat.icon
                    size={18}
                    strokeWidth={activeTab === cat.id ? 2.5 : 1.5}
                  />
                  <span className="text-sm font-bold tracking-tight">{cat.label}</span>
                </div>
                {activeTab === cat.id && (
                  <motion.div layoutId="catActive">
                    <ChevronRight size={14} />
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Popular Tags</p>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                className={`px-3 py-1.5 rounded border transition-all text-[10px] font-black uppercase tracking-wider ${
                  selectedTag === tag
                    ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                }`}
              >
                {tag.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="mt-auto">
        <div className="p-6 bg-slate-50 rounded border border-slate-200 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700 text-slate-900">
             <Bookmark size={80} />
          </div>
          <h4 className="text-xs font-bold text-slate-800 mb-2">Public Access</h4>
          <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
            Discover curated guides and ebooks in the Gathering archive.
          </p>
        </div>
      </div>
    </aside>
  );
};
