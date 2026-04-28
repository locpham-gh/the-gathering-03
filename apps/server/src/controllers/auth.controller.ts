import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import { Whitelist } from "../models/Whitelist.js";
import { sendOtpEmail } from "../services/email.service.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const authController = {
  verifyGoogle: async ({ body, jwt, set }: any) => {
    try {
      const { credential } = body;
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) throw new Error("Invalid Google token");

      const { email, sub, name, picture } = payload;
      if (!email) throw new Error("Email not found in Google token");

      const masterAdminEmails = (process.env.MASTER_ADMIN_EMAIL || "")
        .toLowerCase()
        .split(",")
        .map((e) => e.trim());

      const isMasterAdmin = masterAdminEmails.includes(email.toLowerCase());
      const whitelisted = await Whitelist.findOne({ email: email.toLowerCase() });
      const isAdmin = isMasterAdmin || !!whitelisted;
      const assignedRole = isAdmin ? "admin" : "user";

      let user = await User.findOne({ email: email.toLowerCase() });
      let changed = false;

      if (!user) {
        user = new User({
          email: email.toLowerCase(),
          displayName: name,
          avatarUrl: picture,
          googleId: sub,
          role: assignedRole,
        });
        changed = true;
      } else {
        if (!user.googleId) {
          user.googleId = sub;
          changed = true;
        }
        if (user.role !== assignedRole) {
          user.role = assignedRole;
          changed = true;
        }
      }

      if (changed) await user.save();

      const token = await jwt.sign({
        userId: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
      });

      return {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          status: user.status,
        },
        token,
      };
    } catch (error: any) {
      set.status = 401;
      return { success: false, error: error.message };
    }
  },

  requestOtp: async ({ body, set }: any) => {
    try {
      const { email } = body;
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

      let user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        user = new User({
          email: email.toLowerCase(),
          displayName: email.split("@")[0],
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

  verifyOtp: async ({ body, jwt, set }: any) => {
    try {
      const { email, code } = body;
      const user = await User.findOne({ email: email.toLowerCase() });
      
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

      const masterAdminEmails = (process.env.MASTER_ADMIN_EMAIL || "")
        .toLowerCase()
        .split(",")
        .map((e) => e.trim());

      const isMasterAdmin = masterAdminEmails.includes(email.toLowerCase());
      const whitelisted = await Whitelist.findOne({ email: email.toLowerCase() });
      const isAdmin = isMasterAdmin || !!whitelisted;
      const assignedRole = isAdmin ? "admin" : "user";

      user.otpCode = undefined;
      user.otpExpiresAt = undefined;
      
      if (user.role !== assignedRole) {
        user.role = assignedRole;
      }
      
      await user.save();

      const token = await jwt.sign({
        userId: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
      });

      return {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          status: user.status,
        },
        token,
      };
    } catch (error: any) {
      set.status = 500;
      return { success: false, error: error.message };
    }
  },

  updateProfile: async ({ body, user, set }: any) => {
    const { displayName, avatarUrl } = body;
    const dbUser = await User.findByIdAndUpdate(
      user.userId,
      { displayName, avatarUrl },
      { new: true }
    );

    if (!dbUser) {
      set.status = 404;
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      user: {
        id: dbUser._id.toString(),
        email: dbUser.email,
        displayName: dbUser.displayName,
        avatarUrl: dbUser.avatarUrl,
        role: dbUser.role,
        status: dbUser.status,
      },
    };
  },
};
