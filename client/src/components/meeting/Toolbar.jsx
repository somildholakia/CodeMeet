import { Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff, Link2, MessageSquare, Code2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/cn.js';

function ToolbarButton({ active, danger, onClick, children, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors',
        danger
          ? 'bg-danger hover:bg-danger/80 text-white'
          : active
          ? 'bg-danger/90 text-white hover:bg-danger'
          : 'bg-card text-text-secondary hover:bg-border hover:text-text'
      )}
    >
      {children}
    </button>
  );
}

export default function Toolbar({
  isMuted,
  isCameraOff,
  isSharingScreen,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onLeave,
  onToggleChat,
  onToggleEditor,
  roomId,
}) {
  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${roomId}`);
    toast.success('Room link copied');
  };

  return (
    <div className="flex items-center justify-start gap-3 overflow-x-auto border-t border-border bg-surface px-4 py-3 sm:justify-center">
      <ToolbarButton active={isMuted} onClick={onToggleMic} label="Toggle microphone">
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </ToolbarButton>

      <ToolbarButton active={isCameraOff} onClick={onToggleCamera} label="Toggle camera">
        {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
      </ToolbarButton>

      <ToolbarButton active={isSharingScreen} onClick={onToggleScreenShare} label="Share screen">
        <ScreenShare className="h-5 w-5" />
      </ToolbarButton>

      <ToolbarButton onClick={onToggleEditor} label="Toggle editor">
        <Code2 className="h-5 w-5" />
      </ToolbarButton>

      <ToolbarButton onClick={onToggleChat} label="Toggle chat">
        <MessageSquare className="h-5 w-5" />
      </ToolbarButton>

      <ToolbarButton onClick={copyLink} label="Copy room link">
        <Link2 className="h-5 w-5" />
      </ToolbarButton>

      <ToolbarButton danger onClick={onLeave} label="Leave meeting">
        <PhoneOff className="h-5 w-5" />
      </ToolbarButton>
    </div>
  );
}
