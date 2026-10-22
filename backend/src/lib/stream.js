import { StreamChat } from "stream-chat";
import "dotenv/config";
import jwt from "jsonwebtoken";

const apiKey =
  process.env.STREAM_API_KEY || process.env.STEAM_API_KEY || "9dxzfaaentz4";
const apiSecret =
  process.env.STREAM_API_SECRET ||
  process.env.STEAM_API_SECRET ||
  "g5rhzrryzrwx2numapxj94g2g5d34k4sxd4kmxe7zqsfpreh27ba5ab3sykrbatr";

let streamClient = null;

try {
  if (apiKey && apiSecret) {
    streamClient = StreamChat.getInstance(apiKey, apiSecret);
  } else {
    console.warn("⚠️ Stream API key or Secret is missing");
  }
} catch (error) {
  console.warn("⚠️ Could not initialize Stream client:", error.message);
}

export const upsertStreamUser = async (userData) => {
  try {
    if (streamClient) {
      await streamClient.upsertUsers([userData]);
    }
    return userData;
  } catch (error) {
    console.error("Error upserting Stream user:", error.message);
    return userData;
  }
};

export const generateStreamToken = (userId) => {
  try {
    const userIdStr = (userId || "").toString();
    if (!userIdStr) return null;

    if (streamClient) {
      return streamClient.createToken(userIdStr);
    }

    // Fallback JWT token if StreamClient instance is unavailable
    const secret =
      apiSecret ||
      process.env.JWT_SECRET_KEY ||
      "friendify_fallback_stream_secret";
    return jwt.sign({ user_id: userIdStr }, secret);
  } catch (error) {
    console.error("Error generating Stream token:", error.message);
    return null;
  }
};
