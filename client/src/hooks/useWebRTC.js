import { useCallback, useEffect, useRef, useState } from 'react';

const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export function useWebRTC(socket, roomId, localStream) {
  const [remoteStreams, setRemoteStreams] = useState({}); // socketId -> MediaStream
  const peersRef = useRef({}); // socketId -> RTCPeerConnection

  const createPeer = useCallback(
    (socketId, isInitiator) => {
      if (peersRef.current[socketId]) return peersRef.current[socketId];

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current[socketId] = pc;

      localStream?.getTracks().forEach((track) => pc.addTrack(track, localStream));

      pc.ontrack = (event) => {
        setRemoteStreams((prev) => ({ ...prev, [socketId]: event.streams[0] }));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', { to: socketId, candidate: event.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        if (['disconnected', 'closed', 'failed'].includes(pc.connectionState)) {
          removePeer(socketId);
        }
      };

      if (isInitiator) {
        pc.onnegotiationneeded = async () => {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc-offer', { to: socketId, offer });
        };
      }

      return pc;
    },
    [localStream, socket]
  );

  const removePeer = useCallback((socketId) => {
    peersRef.current[socketId]?.close();
    delete peersRef.current[socketId];
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!socket || !localStream) return;

    const handleParticipants = (socketIds) => {
      socketIds.forEach((id) => createPeer(id, true));
    };

    const handleUserJoined = ({ socketId }) => {
      createPeer(socketId, false);
    };

    const handleOffer = async ({ from, offer }) => {
      const pc = createPeer(from, false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', { to: from, answer });
    };

    const handleAnswer = async ({ from, answer }) => {
      const pc = peersRef.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIceCandidate = async ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    };

    const handleUserLeft = ({ socketId }) => removePeer(socketId);

    socket.on('room-participants', handleParticipants);
    socket.on('user-joined', handleUserJoined);
    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('room-participants', handleParticipants);
      socket.off('user-joined', handleUserJoined);
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      socket.off('user-left', handleUserLeft);
      Object.keys(peersRef.current).forEach(removePeer);
    };
  }, [socket, localStream, createPeer, removePeer]);

  const replaceVideoTrack = useCallback((newTrack) => {
    Object.values(peersRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      sender?.replaceTrack(newTrack);
    });
  }, []);

  return { remoteStreams, replaceVideoTrack };
}
