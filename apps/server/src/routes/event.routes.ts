import { Elysia, t } from "elysia";
import { Event } from "../models/Event.js";
import { User } from "../models/User.js";
import { Room } from "../models/Room.js";
import crypto from "crypto";
import { sendEventEmail } from "../services/email.service.js";
import { jwt } from "@elysiajs/jwt";

export const eventRoutes: any = new Elysia({ prefix: "/api/events" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "fallback_secret_for_development",
    }),
  )
  .derive(async ({ jwt, headers }: any) => {
    const auth = headers["authorization"];
    if (!auth) return { user: null };
    const token = auth.split(" ")[1];
    const payload = await jwt.verify(token);
    return { user: payload };
  })
  .get("/", async ({ user }: any) => {
    if (!user) return new Response("Unauthorized", { status: 401 });
    
    try {
      const events = await Event.find({
        $or: [
          { hostId: user.id },
          { guestEmails: user.email }
        ]
      })
      .populate('roomId', 'code name')
      .populate('hostId', 'displayName avatarUrl')
      .sort({ startTime: 1 });
      
      return { success: true, events };
    } catch (e: any) {
      console.error(e);
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  })
  .post("/", async ({ body, headers, user }: any) => {
    try {
      if (!user) return new Response("Unauthorized", { status: 401 });

      const { roomId, title, description, startTime, endTime, guestEmails, hostId } = body;

      let actualRoomId = roomId;
      let roomCodeForLink = roomId; // default fallback

      // Khởi tạo phòng mới nếu luồng "Trọn gói All-in-one" được gọi
      if (roomId === "new") {
        const code = crypto.randomBytes(5).toString("hex");
        const newRoom = new Room({
          name: title || "Scheduled Meeting",
          code,
          ownerId: hostId,
          members: [hostId],
        });
        await newRoom.save();
        actualRoomId = newRoom._id.toString();
        roomCodeForLink = code;
      } else {
        // Nếu room có sẵn, chúng ta cần tìm code của room đó để ghép URL email
        const existingRoom = await Room.findById(roomId);
        if (existingRoom) {
          roomCodeForLink = existingRoom.code;
        }
      }

      const newEvent = new Event({
        title,
        description,
        roomId: actualRoomId,
        hostId,
        startTime,
        endTime,
        guestEmails
      });

      await newEvent.save();

      const host = await User.findById(hostId);

      // Trigger Emails
      if (guestEmails && guestEmails.length > 0) {
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const roomLink = `${clientUrl}/room/${roomCodeForLink}`;
        
        await sendEventEmail(guestEmails, {
          title,
          description,
          startTime,
          endTime,
          roomLink,
          hostName: host ? host.displayName : 'A Gathering Member'
        });
      }

      return { success: true, event: newEvent };
    } catch (e: any) {
      console.error(e);
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }, {
    body: t.Object({
      roomId: t.String(),
      hostId: t.String(),
      title: t.String(),
      description: t.String(),
      startTime: t.String(),
      endTime: t.String(),
      guestEmails: t.Array(t.String()),
    })
  });
