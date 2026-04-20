import React from "react";
import { X, ExternalLink, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Resource } from "./types";

interface ResourceDetailProps {
  selectedResource: Resource | null;
  setSelectedResource: (res: Resource | null) => void;
}

export const ResourceDetail: React.FC<ResourceDetailProps> = ({
  selectedResource,
  setSelectedResource,
}) => {
  return (
    <AnimatePresence>
      {selectedResource && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 p-4 md:p-12 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white shadow-xl rounded-lg w-full max-w-5xl overflow-hidden relative flex flex-col md:flex-row min-h-[500px] border border-slate-200 [will-change:transform,opacity]"
          >
            <button
              onClick={() => setSelectedResource(null)}
              className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-500 rounded transition-all z-20"
            >
              <X size={20} />
            </button>

            <div className="w-full md:w-5/12 relative h-64 md:h-auto">
              {selectedResource.thumbnailUrl ? (
                <img
                  src={selectedResource.thumbnailUrl}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                  <BookOpen size={80} strokeWidth={1} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent md:hidden" />
            </div>

            <div className="flex-1 p-8 md:p-14 flex flex-col justify-center">
              <div className="mb-8">
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full mb-4 inline-block">
                  {selectedResource.contentType}
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                  {selectedResource.title}
                </h2>
              </div>

              <div className="prose prose-slate max-w-none mb-10">
                <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                  {selectedResource.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-12">
                {selectedResource.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-400"
                  >
                    #{tag.toLowerCase()}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 mt-auto">
                <button
                  onClick={() => window.open(selectedResource.fileUrl, "_blank")}
                  className="w-full sm:w-auto px-10 py-4 bg-primary text-white rounded-xl font-bold hover:bg-teal-700 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-3 group"
                >
                  <ExternalLink size={18} />
                  Access Resource
                </button>
                <button
                  onClick={() => setSelectedResource(null)}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-50 text-slate-500 rounded-xl font-bold hover:bg-slate-100 transition-all"
                >
                  Close Archive
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
