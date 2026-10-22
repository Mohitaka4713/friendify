import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, MessageCircleHeart } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";
import { getAvatarUrl, handleImageError } from "../lib/utils";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");
  const { logoutMutation } = useLogout();

  const user = authUser?.user || authUser;

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full">
          {/* BRAND LOGO */}
          {isChatPage ? (
            <div className="pl-1">
              <Link to="/" className="flex items-center gap-2.5">
                <MessageCircleHeart className="size-8 text-primary" />
                <span className="text-2xl sm:text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
                  Friendify
                </span>
              </Link>
            </div>
          ) : (
            <div className="lg:hidden flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2">
                <MessageCircleHeart className="size-7 text-primary" />
                <span className="text-xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  Friendify
                </span>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            <Link to={"/notifications"} title="Notifications">
              <button className="btn btn-ghost btn-circle">
                <BellIcon className="h-6 w-6 text-base-content opacity-70" />
              </button>
            </Link>

            <ThemeSelector />

            {/* Profile Avatar */}
            <div className="avatar" title={user?.fullName || "User"}>
              <div className="w-9 h-9 rounded-full ring-2 ring-primary/30 overflow-hidden bg-base-300">
                <img
                  src={getAvatarUrl(user)}
                  alt={user?.fullName || "User Avatar"}
                  onError={(e) => handleImageError(e, user?.fullName)}
                  rel="noreferrer"
                />
              </div>
            </div>

            {/* Logout button */}
            <button
              className="btn btn-ghost btn-circle"
              onClick={logoutMutation}
              title="Sign Out"
            >
              <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
