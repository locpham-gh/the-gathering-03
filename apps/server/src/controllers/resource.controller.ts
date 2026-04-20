import { Resource } from "../models/Resource.js";

export const getAllResources = async (search?: string, contentType?: string, tag?: string) => {
    try {
        const query: any = {};
        
        if (contentType) {
            query.contentType = contentType;
        }
        
        if (tag) {
            query.tags = tag;
        }

        if (search) {
            const searchRegex = { $regex: search, $options: "i" };
            query.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { tags: searchRegex }
            ];
        }

        let resources = await Resource.find(query).sort({ createdAt: -1 });
        
        // If no resources found (or if we want to ensure fresh seeds), check if we need to seed
        const totalCount = await Resource.countDocuments();
        
        // Seed if empty OR if we only have the old basic 3 items (optional cleanup)
        if (totalCount < 5 && !search && !contentType && !tag) {
            console.log("🌱 Database feels stale. Seeding high-quality library resources...");
            
            // Optional: delete old low-quality items if they exist
            // await Resource.deleteMany({ tags: { $size: 0 } }); 

            const defaults = [
                {
                    title: "Modern React Architecture 2025",
                    description: "Learn how to build scalable React applications using the latest patterns, Server Components, and advanced state management.",
                    contentType: "guide",
                    fileUrl: "https://react.dev",
                    thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
                    tags: ["react", "architecture", "frontend", "2025"]
                },
                {
                    title: "The Bun Handbook",
                    description: "A comprehensive guide to using Bun as your runtime, package manager, and test runner. Master the speed of the modern web.",
                    contentType: "e-book",
                    fileUrl: "https://bun.sh",
                    thumbnailUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
                    tags: ["bun", "backend", "javascript", "runtime"]
                },
                {
                    title: "Mastering TypeScript: Pro Patterns",
                    description: "Deep dive into advanced TypeScript types, generics, and utility patterns for enterprise applications.",
                    contentType: "course",
                    fileUrl: "https://www.typescriptlang.org",
                    thumbnailUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80",
                    tags: ["typescript", "programming", "course", "advanced"]
                },
                {
                    title: "UI Design for Developers",
                    description: "Learn the fundamentals of color theory, typography, and layout to build beautiful user interfaces without a designer.",
                    contentType: "guide",
                    fileUrl: "https://refactoringui.com",
                    thumbnailUrl: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=800&q=80",
                    tags: ["design", "ui", "ux", "frontend"]
                },
                {
                    title: "Rust for Web Developers",
                    description: "Transition from JavaScript to Rust. Learn memory management, ownership, and building high-performance web servers.",
                    contentType: "e-book",
                    fileUrl: "https://www.rust-lang.org",
                    thumbnailUrl: "https://images.unsplash.com/photo-1629904853716-f0bc54ea4813?w=800&q=80",
                    tags: ["rust", "backend", "performance", "systems"]
                },
                {
                    title: "Next.js 15 Masterclass",
                    description: "The ultimate guide to Next.js 15, App Router, and the new streaming paradigms.",
                    contentType: "course",
                    fileUrl: "https://nextjs.org",
                    thumbnailUrl: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&q=80",
                    tags: ["nextjs", "react", "fullstack", "v15"]
                },
                {
                    title: "Database Design Master",
                    description: "Schema design, indexing strategies, and query optimization for SQL and NoSQL databases.",
                    contentType: "guide",
                    fileUrl: "https://www.mongodb.com",
                    thumbnailUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80",
                    tags: ["database", "backend", "sql", "nosql"]
                },
                {
                    title: "Productivity for Solopreneurs",
                    description: "Systems and habits to stay focused and productive when building your own SaaS.",
                    contentType: "e-book",
                    fileUrl: "https://notion.so",
                    thumbnailUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80",
                    tags: ["productivity", "saas", "entrepreneurship"]
                },
                {
                    title: "Animation with Framer Motion",
                    description: "Bring your React apps to life with fluid gestures and complex layout animations.",
                    contentType: "course",
                    fileUrl: "https://framer.com/motion",
                    thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
                    tags: ["animation", "react", "framer"]
                },
                {
                    title: "Clean Code Principles in JS",
                    description: "Refactoring legacy code into clean, maintainable, and testable JavaScript.",
                    contentType: "guide",
                    fileUrl: "https://clean-code-javascript.com",
                    thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
                    tags: ["javascript", "best-practices", "clean-code"]
                }
            ];
            await Resource.insertMany(defaults);
            resources = await Resource.find(query).sort({ createdAt: -1 });
        }
        
        return resources;
    } catch (error) {
        console.error("Error fetching resources:", error);
        throw new Error("Failed to fetch resources");
    }
};
