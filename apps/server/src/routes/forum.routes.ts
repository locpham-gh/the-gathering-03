import { Elysia, t } from "elysia";
import { getAllTopics, createTopic, addReply, deleteTopic } from "../controllers/forum.controller.js";

export const forumRoutes = new Elysia({ prefix: "/api/forum" })
    .get("/topics", async () => {
        const topics = await getAllTopics();
        return { success: true, topics };
    })
    .post("/topics", async ({ body, jwt, set, headers }: any) => {
        try {
            const authHeader = headers['authorization'];
            if (!authHeader) {
                set.status = 401;
                return { success: false, message: "Unauthorized" };
            }
            
            const token = authHeader.split(' ')[1];
            const payload = await jwt.verify(token);
            
            if (!payload || !payload.userId) {
                set.status = 401;
                return { success: false, message: "Unauthorized" };
            }

            const { title } = body;
            const topic = await createTopic(title, payload.userId);
            return { success: true, topic };
        } catch (error: any) {
            set.status = 500;
            return { success: false, message: error.message };
        }
    }, {
        body: t.Object({
            title: t.String()
        })
    })
    .post("/topics/:id/replies", async ({ params, body, jwt, set, headers }: any) => {
        try {
            const authHeader = headers['authorization'];
            if (!authHeader) {
                set.status = 401;
                return { success: false, message: "Unauthorized" };
            }
            
            const token = authHeader.split(' ')[1];
            const payload = await jwt.verify(token);
            
            if (!payload || !payload.userId) {
                set.status = 401;
                return { success: false, message: "Unauthorized" };
            }

            const { content } = body;
            const topic = await addReply(params.id, content, payload.userId);
            return { success: true, topic };
        } catch (error: any) {
            set.status = 500;
            return { success: false, message: error.message };
        }
    }, {
        body: t.Object({
            content: t.String()
        })
    })
    .delete("/topics/:id", async ({ params, jwt, set, headers }: any) => {
        try {
            const authHeader = headers['authorization'];
            if (!authHeader) {
                set.status = 401;
                return { success: false, message: "Unauthorized" };
            }
            
            const token = authHeader.split(' ')[1];
            const payload = await jwt.verify(token);
            
            if (!payload || !payload.userId) {
                set.status = 401;
                return { success: false, message: "Unauthorized" };
            }

            await deleteTopic(params.id, payload.userId);
            return { success: true };
        } catch (error: any) {
            set.status = 500;
            return { success: false, message: error.message };
        }
    });
