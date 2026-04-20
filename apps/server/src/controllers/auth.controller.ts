import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import {
  getDefaultCharacterByGender,
  resolveAvatarUrl,
  resolveDisplayName,
  sanitizeCharacter2D,
  sanitizeGender,
} from "../utils/profile.js";

// Init generic client, actual client ID is verified inside verifyIdToken
const client = new OAuth2Client();

export const verifyGoogleTokenAndUpsertUser = async (credential: string) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn(
        "⚠️ GOOGLE_CLIENT_ID is not configured. Google Auth might fail.",
      );
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      throw new Error("Invalid Google token payload");
    }

    const { email, name, picture, sub: googleId } = payload;

    // Upsert User based on EMAIL identity
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        displayName: resolveDisplayName(name, email),
        gender: "other",
        character2d: getDefaultCharacterByGender("other"),
        avatarUrl: resolveAvatarUrl(picture, "other"),
        googleId,
      });
      await user.save();
    } else {
      user.gender = sanitizeGender(user.gender);
      user.character2d = sanitizeCharacter2D(user.character2d);
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatarUrl) {
        user.avatarUrl = resolveAvatarUrl(picture, user.gender);
      }
      
      // Nếu user cũ thiếu trường displayName do database version trước, ta phải cập nhật nó
      if (!user.displayName) {
        user.displayName = resolveDisplayName(name, email);
      }
      await user.save();
    }

    return user;
  } catch (error) {
    console.error("Google verify error:", error);
    throw new Error("Authentication failed");
  }
};
