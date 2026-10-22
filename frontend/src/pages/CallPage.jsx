import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";
import { getAvatarUrl } from "../lib/utils";
import {
  Copy,
  MessageCircleHeart,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ArrowLeft,
} from "lucide-react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY || "9dxzfaaentz4";

const CallPage = () => {
  const { id: callId } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [useFallbackMode, setUseFallbackMode] = useState(false);

  const { authUser, isLoading: isAuthLoading } = useAuthUser();
  const user = authUser?.user || authUser;

  const { data: tokenData, isLoading: isTokenLoading } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  const handleExitCall = async () => {
    if (callId) {
      sessionStorage.setItem(`call_dismissed_${callId}`, "true");
    }

    try {
      if (call && call.state?.callingState !== CallingState.LEFT) {
        await call.leave().catch(() => {});
      }
    } catch {
      // safe ignore
    }

    // Always navigate back to previous screen or home
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    let activeClient = null;
    let activeCall = null;
    let isMounted = true;

    const initCall = async () => {
      if (!tokenData?.token || !user || !callId) return;

      try {
        setIsConnecting(true);
        console.log("Initializing Stream video client for Friendify...");

        const currentUserId = String(user._id || user.id);
        const streamUser = {
          id: currentUserId,
          name: user.fullName || "Friendify User",
          image: getAvatarUrl(user),
        };

        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: streamUser,
          token: tokenData.token,
        });

        activeClient = videoClient;

        const callInstance = videoClient.call("default", callId);
        activeCall = callInstance;

        // Wrap callInstance.leave to safely handle "Cannot leave call that has already been left"
        const originalLeave = callInstance.leave.bind(callInstance);
        callInstance.leave = async (...args) => {
          try {
            if (callInstance.state?.callingState === CallingState.LEFT) {
              return;
            }
            return await originalLeave(...args);
          } catch (err) {
            console.warn("Handled call.leave safely:", err?.message);
          }
        };

        // Listen for call termination events from remote participant
        callInstance.on("call.ended", () => {
          console.log("Remote call.ended received");
          if (isMounted) {
            toast("The call was ended.");
            handleExitCall();
          }
        });

        callInstance.on("call.session_ended", () => {
          console.log("Remote call.session_ended received");
          if (isMounted) {
            toast("The call session has ended.");
            handleExitCall();
          }
        });

        await callInstance.join({ create: true });

        if (isMounted) {
          console.log("Joined call successfully");
          setClient(videoClient);
          setCall(callInstance);
          setIsConnecting(false);
        }
      } catch (error) {
        console.warn("Stream Video API join issue:", error?.message);
        if (isMounted) {
          setUseFallbackMode(true);
          setIsConnecting(false);
        }
      }
    };

    initCall();

    return () => {
      isMounted = false;
      if (activeCall) {
        activeCall.leave().catch(() => {});
      }
      if (activeClient) {
        activeClient.disconnectUser().catch(() => {});
      }
    };
  }, [tokenData, user, callId]);

  const copyCallLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Call link copied to clipboard!");
  };

  if (isAuthLoading || (isTokenLoading && !tokenData) || isConnecting) {
    return <PageLoader />;
  }

  return (
    <div className="h-screen w-screen bg-neutral text-neutral-content flex flex-col justify-between overflow-hidden">
      {/* HEADER BAR */}
      <header className="h-14 bg-base-300 border-b border-base-100/20 px-4 flex items-center justify-between z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExitCall}
            className="btn btn-ghost btn-circle btn-sm"
            title="Leave room"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2">
            <MessageCircleHeart className="size-6 text-primary" />
            <span className="font-bold font-mono tracking-wider text-lg hidden sm:inline">
              Friendify Call
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-base-100/40 px-2 py-1 rounded font-mono hidden md:inline truncate max-w-xs">
            Room: {callId}
          </span>
          <button
            onClick={copyCallLink}
            className="btn btn-sm btn-outline btn-primary gap-1.5"
            title="Copy invite link"
          >
            <Copy className="size-3.5" />
            <span className="hidden sm:inline text-xs">Copy Link</span>
          </button>
          <button
            onClick={handleExitCall}
            className="btn btn-sm btn-error text-white gap-1.5 shadow hover:scale-105 active:scale-95 transition-all"
            title="End Call and return"
          >
            <PhoneOff className="size-4" />
            <span className="hidden sm:inline text-xs font-bold">End Call</span>
          </button>
        </div>
      </header>

      {/* CALL BODY */}
      <main className="flex-1 w-full h-full relative flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        {client && call && !useFallbackMode ? (
          <div className="w-full h-full max-w-6xl flex flex-col items-center justify-center">
            <StreamVideo client={client}>
              <StreamCall call={call}>
                <CallContent callId={callId} onLeave={handleExitCall} />
              </StreamCall>
            </StreamVideo>
          </div>
        ) : (
          <FallbackVideoRoom
            callId={callId}
            user={user}
            onLeave={handleExitCall}
          />
        )}
      </main>
    </div>
  );
};

const CallContent = ({ callId, onLeave }) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (callingState === CallingState.JOINED) {
      setHasJoined(true);
    }
  }, [callingState]);

  // When call ends or callingState transitions to LEFT / IDLE after having joined, exit automatically
  useEffect(() => {
    if (
      hasJoined &&
      (callingState === CallingState.LEFT || callingState === CallingState.IDLE)
    ) {
      toast.success("Call ended");
      if (callId) {
        sessionStorage.setItem(`call_dismissed_${callId}`, "true");
      }
      onLeave();
    }
  }, [callingState, hasJoined, onLeave, callId]);

  return (
    <StreamTheme className="w-full h-full flex flex-col items-center justify-between">
      <div className="w-full flex-1 flex items-center justify-center min-h-0">
        <SpeakerLayout />
      </div>
      <div className="py-4">
        <CallControls onLeave={onLeave} />
      </div>
    </StreamTheme>
  );
};

// Resilient Fallback Video Call Room (uses local media streams)
const FallbackVideoRoom = ({ callId, user, onLeave }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let localStream = null;

    const startMedia = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = localStream;
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }
      } catch (err) {
        console.warn("Could not access camera/mic:", err.message);
        setMediaError("Camera or microphone access was not granted.");
      }
    };

    startMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl h-full flex flex-col items-center justify-between p-4">
      <div className="w-full flex-1 flex flex-col items-center justify-center relative rounded-2xl bg-base-200/50 border border-base-100/30 overflow-hidden shadow-2xl">
        {!mediaError && !isVideoOff ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100 rounded-2xl"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="avatar size-28 rounded-full ring-4 ring-primary/40 overflow-hidden bg-base-300">
              <img
                src={getAvatarUrl(user)}
                alt={user?.fullName || "User"}
              />
            </div>
            <h3 className="text-xl font-bold">{user?.fullName || "You"}</h3>
            <p className="text-sm opacity-70 max-w-md">
              {mediaError
                ? mediaError
                : "Your camera is turned off. Ready to connect with your friend."}
            </p>
          </div>
        )}

        {/* User Tag */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-white">
          <span className="size-2 rounded-full bg-success inline-block animate-pulse" />
          <span>{user?.fullName || "You"} (In Call)</span>
          {isMuted && <MicOff className="size-3 text-error ml-1" />}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center gap-4 py-6">
        <button
          onClick={toggleMute}
          className={`btn btn-circle shadow-lg ${
            isMuted ? "btn-error" : "btn-neutral"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`btn btn-circle shadow-lg ${
            isVideoOff ? "btn-error" : "btn-neutral"
          }`}
          title={isVideoOff ? "Start Video" : "Stop Video"}
        >
          {isVideoOff ? (
            <VideoOff className="size-5" />
          ) : (
            <Video className="size-5" />
          )}
        </button>

        <button
          onClick={onLeave}
          className="btn btn-error btn-circle shadow-lg hover:scale-105 active:scale-95 transition-transform"
          title="End Call"
        >
          <PhoneOff className="size-5" />
        </button>
      </div>
    </div>
  );
};

export default CallPage;
