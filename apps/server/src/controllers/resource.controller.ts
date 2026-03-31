import { Resource } from "../models/Resource.js";

export const getAllResources = async () => {
    try {
        const resources = await Resource.find();
        
        // If no resources, seed some defaults
        if (resources.length === 0) {
            console.log("🌱 Seeding default resources...");
            const defaults = [
                {
                    title: "Welcome Guide.pdf",
                    type: "pdf",
                    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    size: 1024 * 50 // 50KB
                },
                {
                    title: "Platform Demo.mp4",
                    type: "video",
                    fileUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
                    size: 1024 * 1024 * 5 // 5MB
                },
                {
                    title: "Community Guidelines.pdf",
                    type: "pdf",
                    fileUrl: "https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf",
                    size: 1024 * 120 // 120KB
                }
            ];
            await Resource.insertMany(defaults);
            return await Resource.find();
        }
        
        return resources;
    } catch (error) {
        console.error("Error fetching resources:", error);
        throw new Error("Failed to fetch resources");
    }
};
