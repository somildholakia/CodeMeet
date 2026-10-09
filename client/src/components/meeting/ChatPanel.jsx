import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { api } from '../../lib/api.js';

function normalizeMessage(message) {
  return {
    id: message.id || message._id || null,
    senderId: message.senderId || message.sender?._id || message.sender,
    senderName: message.senderName || message.sender?.name || 'Unknown',
    text: message.text,
    createdAt: message.createdAt,
  };
}

function mergeMessages(existing, incoming) {
  const byId = new Map();
  existing.forEach((message) => {
    if (message.id) byId.set(message.id, message);
    else byId.set(`${message.createdAt}-${message.senderId}-${message.text}`, message);
  });

  incoming.forEach((message) => {
    const normalized = normalizeMessage(message);
    const key = normalized.id || `${normalized.createdAt}-${normalized.senderId}-${normalized.text}`;
    if (!byId.has(key)) byId.set(key, normalized);
  });

  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export default function ChatPanel({ socket, roomId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    api.get(`/messages/${roomId}`)
      .then(({ data }) => {
        if (!cancelled) {
          setMessages((previous) =>
            mergeMessages(
              previous,
              (data.messages || []).map((message) => ({
                id: message._id,
                senderId: message.sender?._id || message.sender,
                senderName: message.senderName,
                text: message.text,
                createdAt: message.createdAt,
              }))
            )
          );
        }
      })
      .catch(() => {
        if (!cancelled) setMessages((previous) => previous);
      });

    if (!socket) return () => { cancelled = true; };

    const handleReceive = (message) => {
      setMessages((prev) => mergeMessages(prev, [message]));
    };
    const handleTyping = ({ user, isTyping }) => {
      setTypingUser(isTyping ? user.name : null);
    };

    socket.on('receive-message', handleReceive);
    socket.on('typing', handleTyping);

    return () => {
      cancelled = true;
      socket.off('receive-message', handleReceive);
      socket.off('typing', handleTyping);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, roomId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !socket?.connected) return;

    socket.emit('send-message', { roomId, message: { text: trimmed } });
    setText('');
    socket.emit('typing', { roomId, isTyping: false });
    clearTimeout(typingTimeoutRef.current);
  };

  const handleTypingChange = (e) => {
    const nextText = e.target.value.slice(0, 2000);
    setText(nextText);
    socket?.emit('typing', { roomId, isTyping: Boolean(nextText.trim()) });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('typing', { roomId, isTyping: false });
    }, 1500);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-text-muted">No messages yet — say hi!</p>
        )}
        {messages.map((m, i) => {
          const isSelf = m.senderId === currentUser.id;
          return (
            <div key={m.id || `${m.createdAt}-${m.senderId}-${i}`} className={isSelf ? 'text-right' : 'text-left'}>
              <p className="text-[11px] text-text-muted">
                {isSelf ? 'You' : m.senderName} · {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p
                className={
                  isSelf
                    ? 'ml-auto mt-1 inline-block max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2 text-left text-sm text-white shadow-sm shadow-[#f45d3e]/10'
                    : 'mt-1 inline-block max-w-[85%] rounded-2xl rounded-tl-sm bg-[#f2ece4] px-3.5 py-2 text-sm text-text'
                }
              >
                {m.text}
              </p>
            </div>
          );
        })}
      </div>

      {typingUser && <p className="px-3 pb-1 text-xs text-text-muted">{typingUser} is typing…</p>}

      <form onSubmit={handleSend} className="flex gap-2 border-t border-[#eee4d8] bg-[#fffaf4] p-3">
        <Input placeholder="Type a message" value={text} onChange={handleTypingChange} maxLength={2000} />
        <Button type="submit" size="sm" disabled={!socket?.connected}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
