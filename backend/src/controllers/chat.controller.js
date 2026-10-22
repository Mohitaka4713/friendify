import { generateStreamToken, upsertStreamUser } from "../lib/stream.js";

export async function getStreamToken(req, res) {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const token = generateStreamToken(userId);

    // Ensure user profile exists in Stream
    try {
      await upsertStreamUser({
        id: userId,
        name: req.user.fullName || "Friendify User",
        image: req.user.profilePic || "",
      });
    } catch (upsertErr) {
      console.warn("Could not upsert user to Stream:", upsertErr.message);
    }

    res.status(200).json({ token });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
