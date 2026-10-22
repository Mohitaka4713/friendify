import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.friendifyjwt || req.cookies.snapsyncjwt;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    // Auto-fix broken iran.liara avatar URLs for existing users
    if (user.profilePic && user.profilePic.includes("avatar.iran.liara.run")) {
      user.profilePic = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
        user.fullName || "User"
      )}`;
      try {
        await User.findByIdAndUpdate(user._id, { profilePic: user.profilePic });
      } catch (e) {
        // non-blocking
      }
    }

    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
