import React from "react";
import { BookOpen, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import type { Resource } from "./types";

interface LibraryCardProps {
  resource: Resource;
  onClick: (resource: Resource) => void;
}

export const LibraryCard: React.FC<LibraryCardProps> = ({
  resource,
  onClick,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      onClick={() => onClick(resource)}
      className="group bg-white border border-slate-200 rounded overflow-hidden cursor-pointer flex flex-col h-[420px] shadow-sm hover:shadow-md hover:border-slate-800 transition-all duration-200 [will-change:transform]"
    >
      <div className="h-44 w-full relative overflow-hidden bg-slate-100 border-b border-slate-100">
        {resource.thumbnailUrl ? (
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <BookOpen size={48} strokeWidth={1} />
          </div>
        )}
        <div className="absolute top-4 right-4 px-2.5 py-1 bg-white text-slate-800 text-[10px] font-black uppercase tracking-wider rounded border border-slate-200 shadow-sm">
          {resource.contentType}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex gap-2 mb-3">
          {resource.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-black text-slate-400 uppercase tracking-tighter"
            >
              #{tag.toLowerCase()}
            </span>
          ))}
        </div>
        
        <h3 className="text-lg font-black text-slate-800 line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-snug">
          {resource.title}
        </h3>
        
        <p className="text-sm text-slate-500 line-clamp-3 mb-4 leading-relaxed flex-1 font-medium">
          {resource.description}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {new Date(resource.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all text-slate-400">
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
