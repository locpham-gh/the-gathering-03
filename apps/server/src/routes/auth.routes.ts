import { Elysia, t } from "elysia";
import { verifyGoogleTokenAndUpsertUser } from "../controllers/auth.controller.js";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .post(
    "/google",
    async ({ body, jwt, set }: any) => {
      try {
        const { credential } = body;
        const user = await verifyGoogleTokenAndUpsertUser(credential);

        // Issue Custom JWT
        const token = await jwt.sign({
          userId: user._id.toString(),
          email: user.email,
          displayName: user.displayName,
        });

        return {
          success: true,
          user: {
            id: user._id.toString(),
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
  )
  .put(
    "/profile",
    async ({ body, jwt, headers, set }: any) => {
      const { displayName, avatarUrl } = body;
      const auth = headers["authorization"];
      if (!auth) return { success: false, error: "Unauthorized" };

      const token = auth.split(" ")[1];
      const decoded = await jwt.verify(token);
      if (!decoded) return { success: false, error: "Invalid session" };

      const { User } = await import("../models/User.js");
      const user = await User.findByIdAndUpdate(
        decoded.userId,
        { displayName, avatarUrl },
        { new: true },
      );

      if (!user) return { success: false, error: "User not found" };

      return {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      };
    },
    {
      body: t.Object({
        displayName: t.String(),
        avatarUrl: t.String(),
      }),
    },
  );
