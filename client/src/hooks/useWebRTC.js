import { useCallback, useEffect, useRef, useState } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    ...(import.meta.env.VITE_TURN_URL
      ? [{
          urls: import.meta.env.VITE_TURN_URL,
          username: import.meta.env.VITE_TURN_USERNAME,
          credential: import.meta.env.VITE_TURN_CREDENTIAL,
        }]
      : []),
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC(socket, roomId, localStream) {
  const [remoteStreams, setRemoteStreams] = useState({});
  const peersRef = useRef({});
  const pendingIceRef = useRef({});
  const makingOfferRef = useRef({});

  const removePeer = useCallback((socketId) => {
    const pc = peersRef.current[socketId];
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;
      pc.close();
      delete peersRef.current[socketId];
    }

    delete pendingIceRef.current[socketId];
    delete makingOfferRef.current[socketId];

    setRemoteStreams((prev) => {
      if (!prev[socketId]) return prev;
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
  }, []);

  const createPeer = useCallback(
    (socketId) => {
      if (!socketId || socketId === socket?.id) return null;
      if (peersRef.current[socketId]) return peersRef.current[socketId];

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current[socketId] = pc;
      pendingIceRef.current[socketId] = [];

      localStream?.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream) {
          setRemoteStreams((prev) => ({ ...prev, [socketId]: stream }));
        }
      };

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          socket.emit('webrtc-ice-candidate', {
            to: socketId,
            candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed') {
          pc.restartIce?.();
        } else if (['disconnected', 'closed'].includes(pc.connectionState)) {
          removePeer(socketId);
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          pc.restartIce?.();
        }
      };

      return pc;
    },
    [localStream, removePeer, socket]
  );

  const flushPendingIce = useCallback(async (socketId) => {
    const pc = peersRef.current[socketId];
    const pending = pendingIceRef.current[socketId] || [];

    if (!pc?.remoteDescription) return;

    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.debug('Ignoring stale ICE candidate:', error);
      }
    }

    pendingIceRef.current[socketId] = [];
  }, []);

  const createAndSendOffer = useCallback(async (socketId) => {
    const pc = peersRef.current[socketId] || createPeer(socketId);
    if (!pc || makingOfferRef.current[socketId]) return;

    makingOfferRef.current[socketId] = true;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc-offer', {
        to: socketId,
        offer: pc.localDescription,
      });
    } catch (error) {
      console.error('Unable to create WebRTC offer:', error);
    } finally {
      makingOfferRef.current[socketId] = false;
    }
  }, [createPeer, socket]);

  useEffect(() => {
    if (!socket || !localStream) return;

    const handleParticipants = (socketIds = []) => {
      socketIds.forEach((id) => {
        createPeer(id);
        void createAndSendOffer(id);
      });
    };

    const handleOffer = async ({ from, offer }) => {
      try {
        const pc = createPeer(from);
        if (!pc) return;

        const polite = socket.id > from;

        if (pc.signalingState !== 'stable') {
          if (!polite) return;
          await pc.setLocalDescription({ type: 'rollback' });
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await flushPendingIce(from);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc-answer', {
          to: from,
          answer: pc.localDescription,
        });
      } catch (error) {
        console.error('WebRTC offer handling failed:', error);
      }
    };

    const handleAnswer = async ({ from, answer }) => {
      try {
        const pc = peersRef.current[from];
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingIce(from);
      } catch (error) {
        console.error('WebRTC answer handling failed:', error);
      }
    };

    const handleIceCandidate = async ({ from, candidate }) => {
      try {
        const pc = peersRef.current[from] || createPeer(from);
        if (!pc) return;

        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingIceRef.current[from] ||= [];
          pendingIceRef.current[from].push(candidate);
        }
      } catch (error) {
        console.error('WebRTC ICE candidate handling failed:', error);
      }
    };

    const handleUserLeft = ({ socketId }) => removePeer(socketId);

    socket.on('room-participants', handleParticipants);
    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('room-participants', handleParticipants);
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      socket.off('user-left', handleUserLeft);

      Object.keys(peersRef.current).forEach((id) => removePeer(id));
    };
  }, [createAndSendOffer, createPeer, flushPendingIce, localStream, removePeer, socket]);

  const replaceVideoTrack = useCallback(async (newTrack) => {
    await Promise.all(
      Object.values(peersRef.current).map(async (pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newTrack);
        }
      })
    );
  }, []);

  return { remoteStreams, replaceVideoTrack, peerConnections: peersRef };
}
