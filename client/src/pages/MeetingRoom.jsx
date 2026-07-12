import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { cn } from '../lib/cn.js';
import { getSocket } from '../lib/socket.js';
import { api } from '../lib/api.js';
import { useLocalMedia } from '../hooks/useLocalMedia.js';
import { useWebRTC } from '../hooks/useWebRTC.js';
import VideoGrid from '../components/meeting/VideoGrid.jsx';
import Toolbar from '../components/meeting/Toolbar.jsx';
import CodeEditor from '../components/meeting/CodeEditor.jsx';
import ChatPanel from '../components/meeting/ChatPanel.jsx';

export default function MeetingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useMemo(() => getSocket(), []);

  const [meeting, setMeeting] = useState(null);
  const [participantMeta, setParticipantMeta] = useState({}); // socketId -> { user, isMicMuted, isCameraOff }
  const [panel, setPanel] = useState('editor'); // 'editor' | 'chat' | null
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [displayStream, setDisplayStream] = useState(null); // set while screen-sharing, shown in local tile
  const screenStreamRef = useRef(null);

  const { stream: localStream, isMuted, isCameraOff, toggleMic, toggleCamera } = useLocalMedia();
  const { remoteStreams, replaceVideoTrack } = useWebRTC(socket, roomId, localStream);

  useEffect(() => {
    api
      .get(`/meetings/${roomId}`)
      .then(({ data }) => setMeeting(data.meeting))
      .catch((err) => {
        toast.error(err.message);
        navigate('/dashboard');
      });
  }, [roomId, navigate]);

  useEffect(() => {
    if (!localStream || !user) return;

    socket.connect();
    socket.emit('join-room', { roomId, user: { id: user.id, name: user.name } });

    const handleUserJoined = ({ socketId, user: joinedUser }) => {
      setParticipantMeta((prev) => ({ ...prev, [socketId]: { user: joinedUser } }));
      toast(`${joinedUser.name} joined`, { icon: '👋' });
    };

    const handleUserLeft = ({ socketId, user: leftUser }) => {
      setParticipantMeta((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
      if (leftUser?.name) toast(`${leftUser.name} left`, { icon: '👋' });
    };

    const handleMicToggle = ({ socketId, isMuted: muted }) => {
      setParticipantMeta((prev) => ({
        ...prev,
        [socketId]: { ...prev[socketId], isMicMuted: muted },
      }));
    };

    const handleCameraToggle = ({ socketId, isCameraOff: off }) => {
      setParticipantMeta((prev) => ({
        ...prev,
        [socketId]: { ...prev[socketId], isCameraOff: off },
      }));
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('mic-toggle', handleMicToggle);
    socket.on('camera-toggle', handleCameraToggle);

    return () => {
      socket.emit('leave-room');
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('mic-toggle', handleMicToggle);
      socket.off('camera-toggle', handleCameraToggle);
      socket.disconnect();
    };
  }, [localStream, user, socket, roomId]);

  const participants = Object.entries(remoteStreams).map(([socketId, stream]) => ({
    socketId,
    stream,
    user: participantMeta[socketId]?.user,
    isMicMuted: participantMeta[socketId]?.isMicMuted,
    isCameraOff: participantMeta[socketId]?.isCameraOff,
  }));

  const handleToggleMic = () => {
    toggleMic();
    socket.emit('mic-toggle', { roomId, isMuted: !isMuted });
  };

  const handleToggleCamera = () => {
    toggleCamera();
    socket.emit('camera-toggle', { roomId, isCameraOff: !isCameraOff });
  };

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setDisplayStream(null);
    setIsSharingScreen(false);

    const cameraTrack = localStream?.getVideoTracks()[0];
    if (cameraTrack) replaceVideoTrack(cameraTrack);

    socket.emit('screen-share', { roomId, isSharing: false });
  };

  const handleToggleScreenShare = async () => {
    if (isSharingScreen) {
      stopScreenShare();
      return;
    }

    try {
      const captured = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = captured.getVideoTracks()[0];

      screenStreamRef.current = captured;
      setDisplayStream(captured);
      setIsSharingScreen(true);
      replaceVideoTrack(screenTrack);
      socket.emit('screen-share', { roomId, isSharing: true });
      toast.success('Screen sharing started');

      // Fires when the user clicks the browser's native "Stop sharing"
      // control instead of our toolbar button — make sure we revert too.
      screenTrack.onended = stopScreenShare;
    } catch {
      toast.error('Screen share was cancelled');
    }
  };

  const handleLeave = () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    navigate('/dashboard');
  };

  if (!meeting) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div>
          <p className="text-sm font-medium text-text">{meeting.title}</p>
          <p className="text-xs text-text-muted">Room · {roomId}</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <VideoGrid
            localStream={displayStream || localStream}
            localUser={user}
            isMuted={isMuted}
            isCameraOff={isCameraOff && !displayStream}
            participants={participants}
          />
        </div>

        {panel && (
          <div
            className={cn(
              'flex flex-col border-border bg-background',
              // Mobile: full-screen overlay above everything else.
              // Desktop (md+): fixed-width side panel, in normal flow.
              'fixed inset-0 z-50 md:static md:z-auto md:w-96 md:shrink-0 md:border-l'
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
                {panel === 'editor' ? 'Code Editor' : 'Chat'}
              </span>
              <button onClick={() => setPanel(null)} className="text-text-muted hover:text-text">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {panel === 'editor' ? (
                <CodeEditor socket={socket} roomId={roomId} initialCode={meeting.code} />
              ) : (
                <ChatPanel socket={socket} roomId={roomId} currentUser={user} />
              )}
            </div>
          </div>
        )}
      </div>

      <Toolbar
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isSharingScreen={isSharingScreen}
        onToggleMic={handleToggleMic}
        onToggleCamera={handleToggleCamera}
        onToggleScreenShare={handleToggleScreenShare}
        onLeave={handleLeave}
        onToggleChat={() => setPanel((p) => (p === 'chat' ? null : 'chat'))}
        onToggleEditor={() => setPanel((p) => (p === 'editor' ? null : 'editor'))}
        roomId={roomId}
      />
    </div>
  );
}
