import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      // Fallback for development if env is not completely setup yet
      console.warn(
        "⚠️ MONGODB_URI is not defined in environment variables. Using local fallback.",
      );
    }

    // In strict mode we should throw an error, but let's connect to local as fallback for rapid prototyping
    const uri = mongoUri || "mongodb://127.0.0.1:27017/the-gathering";

    const connection = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    process.exit(1);
  }
};
