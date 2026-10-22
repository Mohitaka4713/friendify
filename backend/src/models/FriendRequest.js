import mongoose from "mongoose";
import { getIsDbConnected } from "../lib/db.js";
import { tempFriendRequestStore } from "../lib/tempStore.js";

const friendRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const MongooseFriendRequest =
  mongoose.models.FriendRequest ||
  mongoose.model("FriendRequest", friendRequestSchema);

// Proxy that routes friend request operations to real MongoDB if connected,
// or fallback Temporary In-Memory store if DB is disconnected.
const FriendRequest = new Proxy(MongooseFriendRequest, {
  get(target, prop, receiver) {
    if (!getIsDbConnected()) {
      if (prop in tempFriendRequestStore) {
        const val = tempFriendRequestStore[prop];
        if (typeof val === "function") {
          return val.bind(tempFriendRequestStore);
        }
        return val;
      }
    }
    const val = Reflect.get(target, prop, receiver);
    if (typeof val === "function") {
      return val.bind(target);
    }
    return val;
  },
});

export default FriendRequest;
