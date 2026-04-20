import { Elysia, t } from "elysia";
import { verifyGoogleTokenAndUpsertUser } from "../controllers/auth.controller.js";
import { sendOtpEmail } from "../services/email.service.js";
import {
  CHARACTER_2D,
  getDefaultCharacterByGender,
  GENDERS,
  resolveAvatarUrl,
  resolveDisplayName,
  sanitizeCharacter2D,
  sanitizeGender,
} from "../utils/profile.js";

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
            gender: user.gender,
            character2d: user.character2d,
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
  .post(
    "/otp/request",
    async ({ body, set }: any) => {
      try {
        const { email } = body;
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        const { User } = await import("../models/User.js");
        let user = await User.findOne({ email });
        if (!user) {
          user = new User({
            email,
            displayName: resolveDisplayName(undefined, email),
            gender: "other",
            character2d: getDefaultCharacterByGender("other"),
            avatarUrl: resolveAvatarUrl(undefined, "other"),
          });
        }
        user.otpCode = otpCode;
        user.otpExpiresAt = otpExpiresAt;
        await user.save();

        const sent = await sendOtpEmail(email, otpCode);
        if (!sent) {
          set.status = 500;
          return { success: false, error: "Failed to send OTP email" };
        }

        return { success: true, message: "OTP sent successfully" };
      } catch (error: any) {
        set.status = 500;
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({ email: t.String() }),
    }
  )
  .post(
    "/otp/verify",
    async ({ body, jwt, set }: any) => {
      try {
        const { email, code } = body;
        const { User } = await import("../models/User.js");
        
        const user = await User.findOne({ email });
        if (!user) {
          set.status = 404;
          return { success: false, error: "User not found" };
        }

        if (user.otpCode !== code) {
          set.status = 401;
          return { success: false, error: "Invalid OTP code" };
        }

        if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
          set.status = 401;
          return { success: false, error: "OTP expired" };
        }

        // Clear OTP usage
        user.otpCode = undefined;
        user.otpExpiresAt = undefined;
        await user.save();

        // Issue JWT token
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
            gender: user.gender,
            character2d: user.character2d,
          },
          token,
        };
      } catch (error: any) {
        set.status = 500;
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({ email: t.String(), code: t.String() }),
    }
  )
  .put(
    "/profile",
    async ({ body, jwt, headers, set }: any) => {
      const { displayName, avatarUrl, gender, character2d } = body;
      const auth = headers["authorization"];
      if (!auth) return { success: false, error: "Unauthorized" };

      const token = auth.split(" ")[1];
      const decoded = await jwt.verify(token);
      if (!decoded) return { success: false, error: "Invalid session" };

      const { User } = await import("../models/User.js");
      const normalizedGender = sanitizeGender(gender);
      const normalizedCharacter = character2d
        ? sanitizeCharacter2D(character2d)
        : getDefaultCharacterByGender(normalizedGender);
      const user = await User.findByIdAndUpdate(
        decoded.userId,
        {
          displayName: resolveDisplayName(displayName, decoded.email || ""),
          gender: normalizedGender,
          character2d: normalizedCharacter,
          avatarUrl: resolveAvatarUrl(avatarUrl, normalizedGender),
        },
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
          gender: user.gender,
          character2d: user.character2d,
        },
      };
    },
    {
      body: t.Object({
        displayName: t.String(),
        avatarUrl: t.Optional(t.String()),
        gender: t.Union(GENDERS.map((value) => t.Literal(value))),
        character2d: t.Optional(
          t.Union(CHARACTER_2D.map((value) => t.Literal(value))),
        ),
      }),
    },
  );
