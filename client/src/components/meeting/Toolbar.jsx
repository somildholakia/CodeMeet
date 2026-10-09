import { Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff, Link2, MessageSquare, Code2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/cn.js';

function ToolbarButton({ active, danger, onClick, children, label }) {
  return <button onClick={onClick} aria-label={label} title={label} className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-150',danger?'bg-[#f45d3e] text-white shadow-md shadow-[#f45d3e]/20 hover:bg-[#df492e]':active?'bg-[#ffe4df] text-[#d94358]':'bg-white text-[#6f655d] ring-1 ring-[#eee4d8] hover:bg-[#fff0e9] hover:text-primary')}>
    {children}
  </button>;
}

export default function Toolbar({ isMuted,isCameraOff,isSharingScreen,onToggleMic,onToggleCamera,onToggleScreenShare,onLeave,onToggleChat,onToggleEditor,roomId }) {
  const copyLink=()=>{navigator.clipboard.writeText(`${window.location.origin}/meeting/${roomId}`);toast.success('Room link copied');};
  return <div className="flex items-center justify-center gap-2 overflow-x-auto border-t border-[#eee4d8] bg-white/95 px-3 py-3 sm:gap-3 sm:px-4">
    <ToolbarButton active={isMuted} onClick={onToggleMic} label="Toggle microphone">{isMuted?<MicOff className="h-5 w-5"/>:<Mic className="h-5 w-5"/>}</ToolbarButton>
    <ToolbarButton active={isCameraOff} onClick={onToggleCamera} label="Toggle camera">{isCameraOff?<VideoOff className="h-5 w-5"/>:<Video className="h-5 w-5"/>}</ToolbarButton>
    <ToolbarButton active={isSharingScreen} onClick={onToggleScreenShare} label="Share screen"><ScreenShare className="h-5 w-5"/></ToolbarButton>
    <span className="mx-1 h-7 w-px shrink-0 bg-[#eee4d8]"/>
    <ToolbarButton onClick={onToggleEditor} label="Toggle editor"><Code2 className="h-5 w-5"/></ToolbarButton>
    <ToolbarButton onClick={onToggleChat} label="Toggle chat"><MessageSquare className="h-5 w-5"/></ToolbarButton>
    <ToolbarButton onClick={copyLink} label="Copy room link"><Link2 className="h-5 w-5"/></ToolbarButton>
    <span className="mx-1 h-7 w-px shrink-0 bg-[#eee4d8]"/>
    <ToolbarButton danger onClick={onLeave} label="Leave meeting"><PhoneOff className="h-5 w-5"/></ToolbarButton>
  </div>;
}
