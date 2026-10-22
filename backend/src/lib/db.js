import mongoose from "mongoose";

let isDbConnected = false;

// Attach connection event listeners
mongoose.connection.on("connected", () => {
  isDbConnected = true;
  console.log("✅ MongoDB Connection Established");
});

mongoose.connection.on("disconnected", () => {
  isDbConnected = false;
  console.warn("⚠️ MongoDB Disconnected. Operating in Temporary DB mode.");
});

mongoose.connection.on("error", (err) => {
  isDbConnected = false;
  console.warn(`⚠️ MongoDB Error: ${err.message}. Operating in Temporary DB mode.`);
});

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.warn("⚠️ MONGO_URI is not set. Operating in Temporary DB mode.");
      isDbConnected = false;
      return false;
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of hanging
    });

    isDbConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isDbConnected = false;
    console.warn(`⚠️ Could not connect to MongoDB (${error.message}).`);
    console.log("🚀 Friendify will run in Temporary In-Memory DB mode seamlessly!");
    return false;
  }
};

export const getIsDbConnected = () => isDbConnected;
