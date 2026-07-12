import VideoTile from './VideoTile.jsx';
import { cn } from '../../lib/cn.js';

export default function VideoGrid({ localStream, localUser, isMuted, isCameraOff, participants }) {
  const total = participants.length + 1;
  const cols = total <= 1 ? 'grid-cols-1' : total <= 4 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className={cn('grid gap-3 p-3', cols)}>
      <VideoTile
        stream={localStream}
        name={localUser?.name}
        muted
        isSelf
        isMicMuted={isMuted}
        isCameraOff={isCameraOff}
      />
      {participants.map((p) => (
        <VideoTile
          key={p.socketId}
          stream={p.stream}
          name={p.user?.name || 'Guest'}
          isMicMuted={p.isMicMuted}
          isCameraOff={p.isCameraOff}
        />
      ))}
    </div>
  );
}
