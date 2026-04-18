import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";

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
    const fallbackAvatar = `https://api.dicebear.com/8.x/notionists/svg?seed=${encodeURIComponent(email)}`;
    const actualAvatar = picture || fallbackAvatar;

    // Upsert User based on EMAIL identity
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        displayName: name || email.split("@")[0],
        avatarUrl: actualAvatar,
        googleId,
      });
      await user.save();
    } else {
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatarUrl) user.avatarUrl = actualAvatar;
      
      // Nếu user cũ thiếu trường displayName do database version trước, ta phải cập nhật nó
      if (!user.displayName) {
        user.displayName = name || "User";
      }
      await user.save();
    }

    return user;
  } catch (error) {
    console.error("Google verify error:", error);
    throw new Error("Authentication failed");
  }
};
