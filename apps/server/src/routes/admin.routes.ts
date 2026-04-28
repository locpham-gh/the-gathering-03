import { Elysia, t } from "elysia";
import { adminController } from "../controllers/admin.controller.js";
import { authMiddleware, isAdmin } from "../middleware/auth.middleware.js";

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  .use(authMiddleware)
  .onBeforeHandle(isAdmin)
  
  // --- WHITELIST MANAGEMENT ---
  .get("/whitelist", adminController.getWhitelist)
  .post("/whitelist", adminController.addToWhitelist, {
    body: t.Object({ email: t.String() })
  })
  .delete("/whitelist/:email", adminController.removeFromWhitelist)
  
  // --- STATS OVERVIEW ---
  .get("/stats", adminController.getStats)

  // --- USER MANAGEMENT ---
  .get("/users", adminController.getUsers)
  .patch("/users/:id/role", adminController.updateUserRole, {
    body: t.Object({ role: t.String() })
  })
  .patch("/users/:id/status", adminController.updateUserStatus, {
    body: t.Object({ status: t.String() })
  })
  .delete("/users/:id", adminController.deleteUser)

  // --- ROOM MANAGEMENT ---
  .get("/rooms", adminController.getRooms)
  .delete("/rooms/:id", adminController.deleteRoom)

  // --- FORUM MANAGEMENT ---
  .get("/forum/topics", adminController.getForumTopics)
  .delete("/forum/topics/:id", adminController.deleteForumTopic)

  // --- LIBRARY MANAGEMENT ---
  .get("/library", adminController.getLibrary)
  .post("/library", adminController.addResource, {
    body: t.Object({
      title: t.String(),
      description: t.String(),
      contentType: t.String(),
      fileUrl: t.String(),
      thumbnailUrl: t.String(),
      tags: t.Array(t.String()),
    })
  })
  .delete("/library/:id", adminController.deleteResource);

