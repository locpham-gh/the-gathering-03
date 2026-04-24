import { Elysia, t } from "elysia";
import { broadcastForumUpdate } from "../index.js";
import {
  getAllTopics,
  createTopic,
  addReply,
  deleteTopic,
  toggleLikeTopic,
  toggleLikeReply,
  deleteReply,
  getUserNotifications,
  markNotificationAsRead,
} from "../controllers/forum.controller.js";

export const forumRoutes = new Elysia({ prefix: "/api/forum" })
  .get("/topics", async () => {
    const topics = await getAllTopics();
    return { success: true, topics };
  })
  .post(
    "/topics",
    async ({ body, jwt, set, headers }: any) => {
      try {
        const authHeader = headers["authorization"];
        if (!authHeader) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.split(" ")[1];
        const payload = await jwt.verify(token);

        if (!payload || !payload.userId) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const { title } = body;
        const topic = await createTopic(title, payload.userId);
        broadcastForumUpdate();
        return { success: true, topic };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        title: t.String(),
      }),
    },
  )
  .post(
    "/topics/:id/replies",
    async ({ params, body, jwt, set, headers }: any) => {
      try {
        const authHeader = headers["authorization"];
        if (!authHeader) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.split(" ")[1];
        const payload = await jwt.verify(token);

        if (!payload || !payload.userId) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const { content, replyToId } = body;
        const topic = await addReply(params.id, content, payload.userId, replyToId);
        broadcastForumUpdate();
        return { success: true, topic };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        content: t.String(),
        replyToId: t.Optional(t.String()),
      }),
    },
  )
  .delete("/topics/:id", async ({ params, jwt, set, headers }: any) => {
    try {
      const authHeader = headers["authorization"];
      if (!authHeader) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);

      if (!payload || !payload.userId) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      await deleteTopic(params.id, payload.userId);
      broadcastForumUpdate();
      return { success: true };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message };
    }
  })
  .post("/topics/:id/like", async ({ params, jwt, set, headers }: any) => {
    try {
      const authHeader = headers["authorization"];
      if (!authHeader) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);

      if (!payload || !payload.userId) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      const topic = await toggleLikeTopic(params.id, payload.userId);
      broadcastForumUpdate();
      return { success: true, topic };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message };
    }
  })
  .post(
    "/topics/:id/replies/:replyId/like",
    async ({ params, jwt, set, headers }: any) => {
      try {
        const authHeader = headers["authorization"];
        if (!authHeader) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.split(" ")[1];
        const payload = await jwt.verify(token);

        if (!payload || !payload.userId) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const topic = await toggleLikeReply(
          params.id,
          params.replyId,
          payload.userId,
        );
        broadcastForumUpdate();
        return { success: true, topic };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
  )
  .delete(
    "/topics/:id/replies/:replyId",
    async ({ params, jwt, set, headers }: any) => {
      try {
        const authHeader = headers["authorization"];
        if (!authHeader) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.split(" ")[1];
        const payload = await jwt.verify(token);

        if (!payload || !payload.userId) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const topic = await deleteReply(
          params.id,
          params.replyId,
          payload.userId,
        );
        broadcastForumUpdate();
        return { success: true, topic };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
  )
  .get("/notifications", async ({ jwt, set, headers }: any) => {
    try {
      const authHeader = headers["authorization"];
      if (!authHeader) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);

      if (!payload || !payload.userId) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      const notifications = await getUserNotifications(payload.userId);
      return { success: true, notifications };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message };
    }
  })
  .post("/notifications/:id/read", async ({ params, jwt, set, headers }: any) => {
    try {
      const authHeader = headers["authorization"];
      if (!authHeader) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);

      if (!payload || !payload.userId) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      await markNotificationAsRead(params.id, payload.userId);
      return { success: true };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message };
    }
  });
