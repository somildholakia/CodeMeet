import { useEffect, useRef } from "react";
import { MicOff, User } from "lucide-react";

export default function VideoTile({
  stream,
  name,
  muted,
  isSelf,
  isMicMuted,
  isCameraOff,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-surface">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full object-cover transition-opacity duration-200 ${
          stream && !isCameraOff ? "opacity-100" : "opacity-0"
        }`}
      />

      {(!stream || isCameraOff) && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card">
            <User className="h-6 w-6 text-text-muted" />
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 text-xs text-white">
        {isMicMuted && <MicOff className="h-3 w-3 text-danger" />}
        {name} {isSelf && "(You)"}
      </div>
    </div>
  );
}
