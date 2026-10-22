import { Link } from "react-router";
import { LANGUAGE_TO_FLAG } from "../constants";
import { getAvatarUrl, handleImageError, capitialize } from "../lib/utils";
import { MessageSquare, Video } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";

const FriendCard = ({ friend }) => {
  const { authUser } = useAuthUser();
  const user = authUser?.user || authUser;
  const currentUserId = user?._id || user?.id;

  const callId = currentUserId
    ? [String(currentUserId), String(friend._id)].sort().join("-")
    : friend._id;

  return (
    <div className="card bg-base-200 hover:shadow-lg transition-all duration-200 border border-base-300">
      <div className="card-body p-4">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar size-12 rounded-full ring-2 ring-primary/20 overflow-hidden bg-base-300">
            <img
              src={getAvatarUrl(friend)}
              alt={friend.fullName}
              onError={(e) => handleImageError(e, friend.fullName)}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold truncate">{friend.fullName}</h3>
            {friend.location && (
              <p className="text-xs opacity-60 truncate">{friend.location}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="badge badge-secondary text-xs">
            {getLanguageFlag(friend.nativeLanguage)}
            Native: {capitialize(friend.nativeLanguage)}
          </span>
          <span className="badge badge-outline text-xs">
            {getLanguageFlag(friend.learningLanguage)}
            Learning: {capitialize(friend.learningLanguage)}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-auto pt-2">
          <Link
            to={`/chat/${friend._id}`}
            className="btn btn-outline btn-sm flex-1 gap-1"
          >
            <MessageSquare className="size-4" />
            Chat
          </Link>
          <Link
            to={`/call/${callId}`}
            className="btn btn-success btn-sm text-white"
            title="Start Video Call"
          >
            <Video className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FriendCard;

export function getLanguageFlag(language) {
  if (!language) return null;

  const langLower = language.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];

  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${langLower} flag`}
        className="h-3 mr-1 inline-block"
      />
    );
  }
  return null;
}
