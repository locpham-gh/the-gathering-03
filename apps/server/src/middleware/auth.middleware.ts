import { Elysia } from "elysia";

export const authMiddleware = (app: Elysia) =>
  app.derive(async ({ jwt, headers, set }: any) => {
    const auth = headers["authorization"];
    if (!auth) {
      set.status = 401;
      return { user: null };
    }

    const token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : auth;
    const decoded = await jwt.verify(token);

    if (!decoded) {
      set.status = 401;
      return { user: null };
    }

    return { user: decoded };
  });

export const isAdmin = async ({ user, set }: any) => {
  if (!user || user.role !== "admin") {
    set.status = 403;
    throw new Error("Forbidden: Admin access required");
  }
};
