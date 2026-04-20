import React from "react";
import { Search } from "lucide-react";
import type { Category } from "./types";

interface LibraryHeaderProps {
  activeTab: string;
  categories: Category[];
  search: string;
  setSearch: (val: string) => void;
}

export const LibraryHeader: React.FC<LibraryHeaderProps> = ({
  activeTab,
  categories,
  search,
  setSearch,
}) => {
  return (
    <div className="px-12 py-10 flex items-center justify-between gap-12 border-b border-slate-100 bg-white/95 sticky top-0 z-20">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {activeTab
            ? categories.find((c) => c.id === activeTab)?.label
            : "Browse Archive"}
        </h1>
        <p className="text-slate-400 text-sm font-medium">
          Discover {activeTab || "all"} digital artifacts in the Gathering.
        </p>
      </div>

      <div className="relative group max-w-sm w-full">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary"
          size={18}
        />
        <input
          type="text"
          placeholder="Search repository..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-sm text-slate-700 placeholder:text-slate-400"
        />
      </div>
    </div>
  );
};
