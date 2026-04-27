import { connectDB } from "./src/db/connection.js";
import { User } from "./src/models/User.js";

async function makeAdmin(email: string) {
  await connectDB();
  const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { new: true });
  if (user) {
    console.log(`✅ User ${email} is now an ADMIN.`);
  } else {
    console.log(`❌ User ${email} not found.`);
  }
  process.exit(0);
}

const email = process.argv[2];
if (!email) {
  console.log("Usage: bun run set_admin.ts <email>");
  process.exit(1);
}

makeAdmin(email);
