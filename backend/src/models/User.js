import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { getIsDbConnected } from "../lib/db.js";
import { tempUserStore } from "../lib/tempStore.js";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    bio: {
      type: String,
      default: "",
    },
    profilePic: {
      type: String,
      default: "",
    },
    nativeLanguage: {
      type: String,
      default: "",
    },
    learningLanguage: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  const isPasswordCorrect = await bcrypt.compare(enteredPassword, this.password);
  return isPasswordCorrect;
};

const MongooseUser = mongoose.models.User || mongoose.model("User", userSchema);

// Proxy that routes database operations to real MongoDB if connected,
// or fallback Temporary In-Memory store if DB is disconnected.
const User = new Proxy(MongooseUser, {
  get(target, prop, receiver) {
    if (!getIsDbConnected()) {
      if (prop in tempUserStore) {
        const val = tempUserStore[prop];
        if (typeof val === "function") {
          return val.bind(tempUserStore);
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

export default User;
