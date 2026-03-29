import { Elysia, t } from "elysia";
import { verifyGoogleTokenAndUpsertUser } from "../controllers/auth.controller.js";

export const authRoutes = new Elysia({ prefix: "/api/auth" }).post(
  "/google",
  async ({ body, jwt, set }: any) => {
    try {
      const { credential } = body;
      const user = await verifyGoogleTokenAndUpsertUser(credential);

      // Issue Custom JWT
      const token = await jwt.sign({
        userId: user._id,
        email: user.email,
        displayName: user.displayName,
      });

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        token,
      };
    } catch (error: any) {
      set.status = 401;
      return { success: false, error: error.message };
    }
  },
  {
    body: t.Object({
      credential: t.String(),
    }),
  },
);
