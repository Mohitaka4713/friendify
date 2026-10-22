import { VideoIcon } from "lucide-react";

function CallButton({ handleVideoCall }) {
  return (
    <div className="absolute top-3 right-4 z-20">
      <button
        onClick={handleVideoCall}
        className="btn btn-success btn-sm text-white shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
        title="Start Video Call"
        type="button"
      >
        <VideoIcon className="size-4" />
        <span className="hidden sm:inline text-xs font-semibold">Video Call</span>
      </button>
    </div>
  );
}

export default CallButton;
