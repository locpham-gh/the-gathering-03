import React, { useEffect, useState, useMemo, useDeferredValue } from "react";
import { resourcesApi } from "../../lib/api";
import { Filter, BookOpen, FileText, Video, X } from "lucide-react";
import { motion } from "framer-motion";

// Sub-components
import { LibrarySidebar } from "./library/LibrarySidebar";
import { LibraryHeader } from "./library/LibraryHeader";
import { LibraryGrid } from "./library/LibraryGrid";
import { ResourceDetail } from "./library/ResourceDetail";
import type { Resource, Category } from "./library/types";

export const LibraryModal: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [activeTab, setActiveTab] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null,
  );

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const res = await resourcesApi.getAll(
          deferredSearch,
          activeTab,
          selectedTag,
        );
        if (res.success) {
          setResources(res.resources);
        }
      } catch (e) {
        console.error("Failed to fetch library resources", e);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [deferredSearch, activeTab, selectedTag]);

  const sortedResources = useMemo(() => {
    return [...resources].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [resources]);

  const categories: Category[] = [
    { id: "", label: "All Repository", icon: Filter },
    { id: "e-book", label: "E-Books", icon: BookOpen },
    { id: "guide", label: "Guides", icon: FileText },
    { id: "course", label: "Courses", icon: Video },
  ];

  const allTags = useMemo(
    () => Array.from(new Set(resources.flatMap((r) => r.tags))).slice(0, 15),
    [resources],
  );

  const handleClearFilters = () => {
    setSearch("");
    setActiveTab("");
    setSelectedTag("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-950/90"
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-7xl h-[85vh] flex overflow-hidden relative [will-change:transform,opacity]"
      >
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <LibrarySidebar
          categories={categories}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
          allTags={allTags}
        />

        <div className="flex-1 flex flex-col relative h-full bg-white">
          <button
            onClick={onClose}
            className="absolute top-8 right-8 p-3 bg-slate-100 hover:bg-slate-900 hover:text-white rounded transition-all z-20 text-slate-500"
          >
            <X size={20} />
          </button>

          <LibraryHeader
            activeTab={activeTab}
            categories={categories}
            search={search}
            setSearch={setSearch}
          />

          <div className="flex-1 overflow-y-auto px-12 pb-12 scrollbar-hide overscroll-contain">
            <LibraryGrid
              loading={loading}
              resources={sortedResources}
              onCardClick={setSelectedResource}
              onClearFilters={handleClearFilters}
            />
          </div>
        </div>

        <ResourceDetail
          selectedResource={selectedResource}
          setSelectedResource={setSelectedResource}
        />
      </motion.div>
    </motion.div>
  );
};
