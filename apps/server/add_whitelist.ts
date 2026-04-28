import mongoose from "mongoose";
import { Whitelist } from "./src/models/Whitelist";
import dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({ path: path.resolve(__dirname, ".env") });

async function addEmailToWhitelist(email: string) {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/gathering";
  
  try {
    await mongoose.connect(mongoUri);
    console.log("📡 Connected to MongoDB.");

    const normalizedEmail = email.toLowerCase().trim();
    
    let entry = await Whitelist.findOne({ email: normalizedEmail });
    if (entry) {
      console.log(`⚠️  Email ${normalizedEmail} is already in the whitelist.`);
    } else {
      entry = new Whitelist({ email: normalizedEmail });
      await entry.save();
      console.log(`✅ Success: ${normalizedEmail} added to Whitelist.`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

const email = process.argv[2];
if (!email) {
  console.log("Usage: bun run add_whitelist.ts <email>");
  process.exit(1);
}

addEmailToWhitelist(email);
