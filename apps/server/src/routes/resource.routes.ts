import { Elysia } from "elysia";
import { getAllResources } from "../controllers/resource.controller.js";

export const resourceRoutes = new Elysia({ prefix: "/api/resources" })
    .get("/", async () => {
        const resources = await getAllResources();
        return { success: true, resources };
    });
