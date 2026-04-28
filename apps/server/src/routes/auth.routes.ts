import { Elysia, t } from "elysia";
import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .post("/google", authController.verifyGoogle, {
    body: t.Object({ credential: t.String() }),
  })
  .post("/otp/request", authController.requestOtp, {
    body: t.Object({ email: t.String() }),
  })
  .post("/otp/verify", authController.verifyOtp, {
    body: t.Object({ email: t.String(), code: t.String() }),
  })
  .use(authMiddleware)
  .put("/profile", authController.updateProfile, {
    body: t.Object({
      displayName: t.String(),
      avatarUrl: t.String(),
    }),
  });
