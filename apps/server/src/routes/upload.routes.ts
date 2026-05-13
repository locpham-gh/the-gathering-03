import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import fs from "fs";
import path from "path";

// Ensure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const uploadRoutes = new Elysia({ prefix: "/api/upload" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "fallback_secret_for_development",
    })
  )
  .post("/", async ({ body, headers, jwt, set }) => {
    try {
      // Validate auth
      const auth = headers["authorization"];
      if (!auth) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      const token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : auth;
      const profile = await jwt.verify(token);
      if (!profile) {
        set.status = 401;
        return { error: "Invalid token" };
      }

      const file = body.file as any;
      if (!file) {
        set.status = 400;
        return { error: "No file provided" };
      }

      // Generate unique filename
      const ext = path.extname(file.name || "");
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const filePath = path.join(UPLOAD_DIR, uniqueName);

      // Write file
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(filePath, buffer);

      const fileUrl = `/public/uploads/${uniqueName}`;

      return {
        success: true,
        fileUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      };
    } catch (err: any) {
      console.error("Upload error:", err);
      set.status = 500;
      return { error: "Upload failed: " + err.message };
    }
  }, {
    body: t.Object({
      file: t.Any()
    })
  });
