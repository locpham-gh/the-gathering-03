import { User } from "../models/User.js";

export async function verifySessionPayload(jwt: any, authHeader?: string) {
  if (!authHeader) return null;
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;
  const payload = await jwt.verify(token);
  if (!payload || !payload.userId) return null;

  const user = await User.findById(payload.userId).select(
    "_id email role status activeSessionId",
  );
  if (!user || user.status !== "active") return null;

  const payloadSessionId = payload.sessionId?.toString?.() || "";
  const activeSessionId = user.activeSessionId?.toString?.() || "";
  if (!payloadSessionId || !activeSessionId || payloadSessionId !== activeSessionId) {
    return null;
  }

  return {
    userId: user._id.toString(),
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    status: user.status,
    sessionId: activeSessionId,
  };
}
