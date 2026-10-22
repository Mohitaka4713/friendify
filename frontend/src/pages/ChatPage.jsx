import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import { getAvatarUrl } from "../lib/utils";
import { VideoIcon, X } from "lucide-react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY || "9dxzfaaentz4";

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const navigate = useNavigate();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCallId, setActiveCallId] = useState(null);

  const { authUser } = useAuthUser();
  const user = authUser?.user || authUser;

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    let isMounted = true;

    const initChat = async () => {
      if (!tokenData?.token || !user || !targetUserId) return;

      try {
        const client = StreamChat.getInstance(STREAM_API_KEY);
        const currentUserId = String(user._id || user.id);

        // Disconnect only if connected as a DIFFERENT user
        if (client.userID && client.userID !== currentUserId) {
          await client.disconnectUser();
        }

        // Connect user if not yet connected
        if (!client.userID) {
          await client.connectUser(
            {
              id: currentUserId,
              name: user.fullName || "User",
              image: getAvatarUrl(user),
            },
            tokenData.token
          );
        }

        if (!isMounted) return;

        const channelId = [currentUserId, String(targetUserId)].sort().join("-");

        const currChannel = client.channel("messaging", channelId, {
          members: [currentUserId, String(targetUserId)],
        });

        await currChannel.watch();

        if (!isMounted) return;

        // Check if a call invitation is still active (sent within last 3 mins and not dismissed)
        const isCallRecent = (callId, timestamp) => {
          if (!callId) return false;
          if (sessionStorage.getItem(`call_dismissed_${callId}`) === "true") {
            return false;
          }
          if (timestamp) {
            const ageMs = Date.now() - new Date(timestamp).getTime();
            if (ageMs > 3 * 60 * 1000) return false; // Expired after 3 minutes
          }
          return true;
        };

        // Listen for new call invitation messages
        currChannel.on("message.new", (event) => {
          if (event.message?.text?.includes("/call/")) {
            const match = event.message.text.match(/\/call\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
              const newCallId = match[1];
              sessionStorage.removeItem(`call_dismissed_${newCallId}`);
              setActiveCallId(newCallId);
            }
          }
        });

        // Scan existing messages only for very recent, non-dismissed calls
        if (currChannel.state?.messages) {
          const callMsg = [...currChannel.state.messages]
            .reverse()
            .find((m) => m.text?.includes("/call/"));
          if (callMsg) {
            const match = callMsg.text.match(/\/call\/([a-zA-Z0-9_-]+)/);
            if (match && match[1] && isCallRecent(match[1], callMsg.created_at)) {
              setActiveCallId(match[1]);
            } else {
              setActiveCallId(null);
            }
          }
        }

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        if (isMounted) {
          toast.error("Could not connect to chat. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initChat();

    return () => {
      isMounted = false;
    };
  }, [tokenData, user, targetUserId]);

  const handleVideoCall = async () => {
    if (!channel) return;

    try {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      await channel.sendMessage({
        text: `📞 I've started a video call on Friendify. Join me here: ${callUrl}`,
      });

      toast.success("Starting video call...");
      sessionStorage.removeItem(`call_dismissed_${channel.id}`);
      setActiveCallId(channel.id);
      navigate(`/call/${channel.id}`);
    } catch (err) {
      console.error("Error sending video call invite:", err);
      sessionStorage.removeItem(`call_dismissed_${channel.id}`);
      navigate(`/call/${channel.id}`);
    }
  };

  const handleDismissBanner = () => {
    if (activeCallId) {
      sessionStorage.setItem(`call_dismissed_${activeCallId}`, "true");
    }
    setActiveCallId(null);
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh] flex flex-col">
      {/* ACTIVE CALL BANNER */}
      {activeCallId && (
        <div className="bg-primary text-primary-content px-4 py-2 flex items-center justify-between text-sm shadow-md animate-fadeIn z-20">
          <div className="flex items-center gap-2">
            <VideoIcon className="size-4 animate-pulse text-white" />
            <span className="font-medium">Recent video call invite</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/call/${activeCallId}`)}
              className="btn btn-xs btn-accent text-white font-semibold"
            >
              Join Call
            </button>
            <button
              onClick={handleDismissBanner}
              className="btn btn-ghost btn-xs btn-circle text-white hover:bg-white/20"
              title="Dismiss banner"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <div className="w-full h-full relative">
              <CallButton handleVideoCall={handleVideoCall} />
              <Window>
                <ChannelHeader />
                <MessageList />
                <MessageInput focus />
              </Window>
            </div>
            <Thread />
          </Channel>
        </Chat>
      </div>
    </div>
  );
};

export default ChatPage;