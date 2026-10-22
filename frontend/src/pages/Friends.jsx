import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserFriends } from "../lib/api";
import FriendCard from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import { Users, Search, UserPlus } from "lucide-react";
import { Link } from "react-router";

const Friends = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const filteredFriends = friends.filter((friend) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = friend.fullName?.toLowerCase().includes(q);
    const nativeMatch = friend.nativeLanguage?.toLowerCase().includes(q);
    const learningMatch = friend.learningLanguage?.toLowerCase().includes(q);
    const locationMatch = friend.location?.toLowerCase().includes(q);
    return nameMatch || nativeMatch || learningMatch || locationMatch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-base-300 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Users className="size-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                My Friends
              </h1>
              <span className="badge badge-primary font-semibold">
                {friends.length}
              </span>
            </div>
            <p className="text-sm opacity-70 mt-1 pl-11">
              Your connected language partners. Start a chat or jump directly into a video call.
            </p>
          </div>

          <Link to="/" className="btn btn-primary btn-sm gap-2 shadow-sm">
            <UserPlus className="size-4" />
            Find More Learners
          </Link>
        </div>

        {/* SEARCH BAR */}
        {friends.length > 0 && (
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 size-4 text-base-content opacity-50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends by name, language, or location..."
                className="input input-bordered w-full pl-10 input-sm sm:input-md"
              />
            </div>
          </div>
        )}

        {/* CONTENT */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : friends.length === 0 ? (
          <NoFriendsFound />
        ) : filteredFriends.length === 0 ? (
          <div className="card bg-base-200 p-8 text-center max-w-md mx-auto space-y-3">
            <p className="font-semibold text-lg">No matching friends found</p>
            <p className="text-sm opacity-70">
              Try a different search term or clear the filter to see all your friends.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="btn btn-outline btn-sm mx-auto"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFriends.map((friend) => (
              <FriendCard key={friend._id} friend={friend} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
