import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';

export default function ChatPanel({ socket, roomId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleReceive = (message) => setMessages((prev) => [...prev, message]);
    const handleTyping = ({ user, isTyping }) => {
      setTypingUser(isTyping ? user.name : null);
    };

    socket.on('receive-message', handleReceive);
    socket.on('typing', handleTyping);

    return () => {
      socket.off('receive-message', handleReceive);
      socket.off('typing', handleTyping);
    };
  }, [socket]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const message = {
      senderName: currentUser.name,
      senderId: currentUser.id,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, message]);
    socket.emit('send-message', { roomId, message });
    setText('');
  };

  const handleTypingChange = (e) => {
    setText(e.target.value);
    socket.emit('typing', { roomId, user: currentUser, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { roomId, user: currentUser, isTyping: false });
    }, 1500);
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-text-muted">No messages yet — say hi!</p>
        )}
        {messages.map((m, i) => {
          const isSelf = m.senderId === currentUser.id;
          return (
            <div key={i} className={isSelf ? 'text-right' : 'text-left'}>
              <p className="text-[11px] text-text-muted">
                {isSelf ? 'You' : m.senderName} · {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p
                className={
                  isSelf
                    ? 'ml-auto mt-0.5 inline-block max-w-[85%] rounded-lg bg-primary px-3 py-1.5 text-sm text-white'
                    : 'mt-0.5 inline-block max-w-[85%] rounded-lg bg-card px-3 py-1.5 text-sm text-text'
                }
              >
                {m.text}
              </p>
            </div>
          );
        })}
      </div>

      {typingUser && <p className="px-3 pb-1 text-xs text-text-muted">{typingUser} is typing…</p>}

      <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-3">
        <Input placeholder="Type a message" value={text} onChange={handleTypingChange} />
        <Button type="submit" size="sm">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
