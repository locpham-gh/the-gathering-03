import { Resource } from "../models/Resource.js";

export const getAllResources = async (search?: string, contentType?: string) => {
    try {
        const query: any = {};
        if (contentType) {
            query.contentType = contentType;
        }
        if (search) {
            query.$text = { $search: search };
        }

        let resources = await Resource.find(query);
        
        // If no resources, seed some defaults
        if (resources.length === 0 && !search && !contentType) {
            console.log("🌱 Seeding default CMS resources...");
            const defaults = [
                {
                    title: "Advanced React Hooks Guide",
                    description: "Learn how to master useMemo, useCallback, and custom hooks in this comprehensive guide for frontend developers.",
                    contentType: "guide",
                    fileUrl: "https://react.dev/reference/react",
                    thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&q=80",
                    tags: ["react", "frontend", "hooks"]
                },
                {
                    title: "Building Scalable Architecture",
                    description: "An e-book detailing the journey of scaling Node.js applications with Bun and Elysia.",
                    contentType: "e-book",
                    fileUrl: "https://bun.sh/docs",
                    thumbnailUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80",
                    tags: ["architecture", "backend", "bun"]
                },
                {
                    title: "Full-Stack Web Development Course",
                    description: "A complete video course on building Metaverses using PixiJS and React.",
                    contentType: "course",
                    fileUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Safe placeholder
                    thumbnailUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=500&q=80",
                    tags: ["course", "pixijs", "video"]
                }
            ];
            await Resource.insertMany(defaults);
            resources = await Resource.find(query);
        }
        
        return resources;
    } catch (error) {
        console.error("Error fetching resources:", error);
        throw new Error("Failed to fetch resources");
    }
};
