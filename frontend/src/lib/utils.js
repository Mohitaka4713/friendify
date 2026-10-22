export const capitialize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const AVATAR_STYLES = [
  "avataaars",
  "bottts",
  "adventurer",
  "lorelei",
  "personas",
  "fun-emoji",
];

export const getRandomDicebearAvatar = (seed = "", style = "") => {
  const selectedStyle =
    style && AVATAR_STYLES.includes(style)
      ? style
      : AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
  const randomSeed =
    seed || Math.random().toString(36).substring(2, 9);
  return `https://api.dicebear.com/9.x/${selectedStyle}/svg?seed=${encodeURIComponent(
    randomSeed
  )}`;
};

export const getAvatarUrl = (userOrPic, fallbackName = "User") => {
  if (typeof userOrPic === "string" && userOrPic) {
    if (
      userOrPic.includes("avatar.iran.liara.run") ||
      userOrPic.trim() === ""
    ) {
      return getRandomDicebearAvatar(fallbackName, "avataaars");
    }
    return userOrPic;
  }

  if (userOrPic && typeof userOrPic === "object") {
    const pic = userOrPic.profilePic;
    const name = userOrPic.fullName || userOrPic.name || fallbackName;
    if (pic && !pic.includes("avatar.iran.liara.run") && pic.trim() !== "") {
      return pic;
    }
    return getRandomDicebearAvatar(name, "avataaars");
  }

  return getRandomDicebearAvatar(fallbackName, "avataaars");
};

export const handleImageError = (e, fallbackName = "User") => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = getRandomDicebearAvatar(fallbackName, "avataaars");
};
