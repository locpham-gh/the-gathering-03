import { Elysia } from "elysia";
import { getAllResources } from "../controllers/resource.controller.js";

export const resourceRoutes = new Elysia({ prefix: "/api/resources" })
    .get("/", async ({ query }: any) => {
        const { search, type, tag } = query;
        const resources = await getAllResources(search, type, tag);
        return { success: true, resources };
    });
