import React from "react";
import { Search, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import type { Resource } from "./types";
import { LibraryCard } from "./LibraryCard";

interface LibraryGridProps {
  loading: boolean;
  resources: Resource[];
  onCardClick: (resource: Resource) => void;
  onClearFilters: () => void;
}

export const LibraryGrid: React.FC<LibraryGridProps> = ({
  loading,
  resources,
  onCardClick,
  onClearFilters,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-slate-400 font-bold animate-pulse text-sm">
          Fetching archival data...
        </p>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
        <div className="w-20 h-20 bg-slate-100 rounded border border-slate-200 flex items-center justify-center mb-6">
          <Search size={32} className="text-slate-300" />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">
          No artifacts found
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-8 font-medium">
          Try adjusting your search or filters to find what you're looking for.
        </p>
        <button
          onClick={onClearFilters}
          className="px-6 py-3 bg-slate-900 text-white rounded font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
        >
          Clear all filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-8">
      <AnimatePresence mode="popLayout">
        {resources.map((resource) => (
          <LibraryCard
            key={resource._id}
            resource={resource}
            onClick={onCardClick}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
