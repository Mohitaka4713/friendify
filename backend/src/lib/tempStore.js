import bcrypt from "bcryptjs";

// Helper to generate 24-char hex IDs compatible with MongoDB ObjectId format
function generateObjectId() {
  return Array.from({ length: 24 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

class TempDatabaseStore {
  constructor() {
    this.users = [];
    this.friendRequests = [];
    this.seedDefaultData();
  }

  async seedDefaultData() {
    if (this.users.length > 0) return;
    const defaultPassword = await bcrypt.hash("password123", 10);
    this.users = [
      {
        _id: "65f1a2b3c4d5e6f7a8b9c001",
        fullName: "Elena Rostova",
        email: "elena@friendify.com",
        password: defaultPassword,
        bio: "Passionate about Russian literature and learning conversational English!",
        profilePic: "https://api.dicebear.com/9.x/avataaars/svg?seed=Elena",
        nativeLanguage: "russian",
        learningLanguage: "english",
        location: "Saint Petersburg, Russia",
        isOnboarded: true,
        friends: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "65f1a2b3c4d5e6f7a8b9c002",
        fullName: "Carlos Silva",
        email: "carlos@friendify.com",
        password: defaultPassword,
        bio: "Software developer from Madrid looking to practice French & English.",
        profilePic: "https://api.dicebear.com/9.x/avataaars/svg?seed=Carlos",
        nativeLanguage: "spanish",
        learningLanguage: "english",
        location: "Madrid, Spain",
        isOnboarded: true,
        friends: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "65f1a2b3c4d5e6f7a8b9c003",
        fullName: "Yuki Tanaka",
        email: "yuki@friendify.com",
        password: defaultPassword,
        bio: "Graphic designer in Tokyo learning Spanish. Let's exchange languages!",
        profilePic: "https://api.dicebear.com/9.x/avataaars/svg?seed=Yuki",
        nativeLanguage: "japanese",
        learningLanguage: "spanish",
        location: "Tokyo, Japan",
        isOnboarded: true,
        friends: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "65f1a2b3c4d5e6f7a8b9c004",
        fullName: "Sophie Laurent",
        email: "sophie@friendify.com",
        password: defaultPassword,
        bio: "Coffee lover and photographer in Paris. Happy to chat in French or German!",
        profilePic: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sophie",
        nativeLanguage: "french",
        learningLanguage: "german",
        location: "Paris, France",
        isOnboarded: true,
        friends: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  wrapUserDoc(user, excludePassword = false) {
    if (!user) return null;
    const doc = { ...user };
    doc._id = String(doc._id);
    doc.id = String(doc._id);

    if (excludePassword) {
      delete doc.password;
    }

    doc.matchPassword = async function (enteredPassword) {
      return bcrypt.compare(enteredPassword, user.password);
    };

    doc.toObject = function () {
      return { ...this };
    };

    doc.toJSON = function () {
      const obj = { ...this };
      delete obj.password;
      return obj;
    };

    doc.save = async function () {
      const index = tempStore.users.findIndex((u) => String(u._id) === String(doc._id));
      if (index !== -1) {
        tempStore.users[index] = { ...tempStore.users[index], ...doc, updatedAt: new Date() };
      }
      return doc;
    };

    return doc;
  }

  wrapFriendRequestDoc(req) {
    if (!req) return null;
    const doc = { ...req };
    doc._id = String(doc._id);
    doc.id = String(doc._id);

    doc.save = async function () {
      const index = tempStore.friendRequests.findIndex(
        (r) => String(r._id) === String(doc._id)
      );
      if (index !== -1) {
        tempStore.friendRequests[index] = {
          ...tempStore.friendRequests[index],
          ...doc,
          updatedAt: new Date(),
        };
      }
      return doc;
    };

    return doc;
  }
}

export const tempStore = new TempDatabaseStore();

// Temp User Model interface compatible with Mongoose User model
export const tempUserStore = {
  async findOne(query) {
    await tempStore.seedDefaultData();
    let found = null;
    if (query.email) {
      const emailLower = String(query.email).toLowerCase();
      found = tempStore.users.find(
        (u) => String(u.email).toLowerCase() === emailLower
      );
    } else if (query._id) {
      found = tempStore.users.find(
        (u) => String(u._id) === String(query._id)
      );
    }
    return tempStore.wrapUserDoc(found);
  },

  async create(data) {
    await tempStore.seedDefaultData();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const newId = generateObjectId();

    const newUser = {
      _id: newId,
      fullName: data.fullName,
      email: data.email,
      password: hashedPassword,
      bio: data.bio || "",
      profilePic:
        data.profilePic ||
        `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
          data.fullName
        )}`,
      nativeLanguage: data.nativeLanguage || "",
      learningLanguage: data.learningLanguage || "",
      location: data.location || "",
      isOnboarded: data.isOnboarded || false,
      friends: data.friends || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    tempStore.users.push(newUser);
    return tempStore.wrapUserDoc(newUser);
  },

  findById(id) {
    const runFind = async (excludePassword = false, populateFriends = false, populateFields = "") => {
      await tempStore.seedDefaultData();
      const user = tempStore.users.find(
        (u) => String(u._id) === String(id)
      );
      if (!user) return null;

      const doc = tempStore.wrapUserDoc(user, excludePassword);
      if (populateFriends && doc.friends && doc.friends.length > 0) {
        const friendIds = doc.friends.map(String);
        const friendDocs = tempStore.users
          .filter((u) => friendIds.includes(String(u._id)))
          .map((u) => {
            const wrapped = tempStore.wrapUserDoc(u, true);
            if (populateFields) {
              const allowed = populateFields.split(" ");
              const filtered = { _id: wrapped._id, id: wrapped.id };
              allowed.forEach((f) => {
                if (f && wrapped[f] !== undefined) filtered[f] = wrapped[f];
              });
              return filtered;
            }
            return wrapped;
          });
        doc.friends = friendDocs;
      }
      return doc;
    };

    let excludePassword = false;
    let populateField = "";
    let populateFields = "";

    const queryPromise = {
      select(fields) {
        if (typeof fields === "string" && fields.includes("-password")) {
          excludePassword = true;
        }
        return this;
      },
      populate(field, fields) {
        populateField = field;
        populateFields = fields || "";
        return this;
      },
      then(resolve, reject) {
        return runFind(
          excludePassword,
          populateField === "friends",
          populateFields
        ).then(resolve, reject);
      },
      catch(reject) {
        return runFind(
          excludePassword,
          populateField === "friends",
          populateFields
        ).catch(reject);
      },
    };

    return queryPromise;
  },

  async findByIdAndUpdate(id, update, options = {}) {
    await tempStore.seedDefaultData();
    const index = tempStore.users.findIndex(
      (u) => String(u._id) === String(id)
    );
    if (index === -1) return null;

    let target = { ...tempStore.users[index] };

    // Handle $addToSet
    if (update.$addToSet) {
      for (const [key, val] of Object.entries(update.$addToSet)) {
        if (!Array.isArray(target[key])) {
          target[key] = [];
        }
        const valStr = String(val);
        const exists = target[key].some((item) => String(item) === valStr);
        if (!exists) {
          target[key] = [...target[key], valStr];
        }
      }
    }

    // Handle direct field updates
    const updates = { ...update };
    delete updates.$addToSet;
    delete updates.$set;

    if (update.$set) {
      Object.assign(updates, update.$set);
    }

    Object.assign(target, updates);
    target.updatedAt = new Date();
    tempStore.users[index] = target;

    return tempStore.wrapUserDoc(target);
  },

  async find(query = {}) {
    await tempStore.seedDefaultData();
    let result = [...tempStore.users];

    if (query.$and && Array.isArray(query.$and)) {
      for (const condition of query.$and) {
        if (condition._id) {
          if (condition._id.$ne) {
            const neId = String(condition._id.$ne);
            result = result.filter((u) => String(u._id) !== neId);
          }
          if (condition._id.$nin) {
            const ninIds = (condition._id.$nin || []).map(String);
            result = result.filter((u) => !ninIds.includes(String(u._id)));
          }
        }
        if (condition.isOnboarded !== undefined) {
          result = result.filter((u) => Boolean(u.isOnboarded) === Boolean(condition.isOnboarded));
        }
      }
    }

    return result.map((u) => tempStore.wrapUserDoc(u, true));
  },
};

// Temp FriendRequest Model interface compatible with Mongoose FriendRequest model
export const tempFriendRequestStore = {
  async create(data) {
    await tempStore.seedDefaultData();
    const newId = generateObjectId();
    const newReq = {
      _id: newId,
      sender: String(data.sender),
      recipient: String(data.recipient),
      status: data.status || "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    tempStore.friendRequests.push(newReq);
    return tempStore.wrapFriendRequestDoc(newReq);
  },

  async findOne(query) {
    await tempStore.seedDefaultData();
    if (query.$or && Array.isArray(query.$or)) {
      for (const cond of query.$or) {
        const found = tempStore.friendRequests.find((r) => {
          const matchSender = String(r.sender) === String(cond.sender);
          const matchRecipient = String(r.recipient) === String(cond.recipient);
          return matchSender && matchRecipient;
        });
        if (found) {
          return tempStore.wrapFriendRequestDoc(found);
        }
      }
    }
    return null;
  },

  async findById(id) {
    await tempStore.seedDefaultData();
    const found = tempStore.friendRequests.find(
      (r) => String(r._id) === String(id)
    );
    return tempStore.wrapFriendRequestDoc(found);
  },

  find(query = {}) {
    const runFind = async (populates = []) => {
      await tempStore.seedDefaultData();
      let matches = tempStore.friendRequests.filter((r) => {
        if (query.recipient && String(r.recipient) !== String(query.recipient)) {
          return false;
        }
        if (query.sender && String(r.sender) !== String(query.sender)) {
          return false;
        }
        if (query.status && r.status !== query.status) {
          return false;
        }
        return true;
      });

      return matches.map((req) => {
        const doc = tempStore.wrapFriendRequestDoc(req);
        for (const pop of populates) {
          const path = pop.path;
          const targetId = String(req[path]);
          const user = tempStore.users.find(
            (u) => String(u._id) === targetId
          );
          if (user) {
            const wrapped = tempStore.wrapUserDoc(user, true);
            if (pop.fields) {
              const allowed = pop.fields.split(" ");
              const filtered = { _id: wrapped._id, id: wrapped.id };
              allowed.forEach((f) => {
                if (f && wrapped[f] !== undefined) filtered[f] = wrapped[f];
              });
              doc[path] = filtered;
            } else {
              doc[path] = wrapped;
            }
          }
        }
        return doc;
      });
    };

    const populates = [];
    const queryPromise = {
      populate(path, fields) {
        populates.push({ path, fields });
        return this;
      },
      then(resolve, reject) {
        return runFind(populates).then(resolve, reject);
      },
      catch(reject) {
        return runFind(populates).catch(reject);
      },
    };

    return queryPromise;
  },
};
