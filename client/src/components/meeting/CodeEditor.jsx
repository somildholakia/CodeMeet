import { useEffect, useRef, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button.jsx';
import { api } from '../../lib/api.js';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

const CURSOR_COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ec4899', '#a855f7', '#06b6d4'];

function colorForSocketId(socketId) {
  let hash = 0;
  for (let i = 0; i < socketId.length; i += 1) hash = (hash * 31 + socketId.charCodeAt(i)) | 0;
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

export default function CodeEditor({ socket, roomId, initialCode }) {
  const [code, setCode] = useState(initialCode || '// Start coding together...\n');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const isRemoteUpdate = useRef(false);
  const debounceRef = useRef(null);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationIdsRef = useRef({}); // socketId -> decoration id array
  const cursorThrottleRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleRemoteChange = ({ code: remoteCode, language: remoteLanguage }) => {
      isRemoteUpdate.current = true;
      setCode(remoteCode);
      if (remoteLanguage) setLanguage(remoteLanguage);
    };

    const handleCursorChange = ({ socketId, position, user }) => {
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      if (!editor || !monaco || !position) return;

      const color = colorForSocketId(socketId);
      const className = `remote-cursor-${socketId.replace(/[^a-zA-Z0-9]/g, '')}`;

      // Inject a per-user style once so the cursor color/label are unique.
      if (!document.getElementById(className)) {
        const style = document.createElement('style');
        style.id = className;
        style.textContent = `
          .${className} { border-left: 2px solid ${color}; margin-left: -1px; }
          .${className}::after {
            content: '${(user?.name || 'Guest').replace(/'/g, '')}';
            position: relative; top: -1.1em; left: -1px;
            background: ${color}; color: #fff; font-size: 10px;
            padding: 0 4px; border-radius: 3px; white-space: nowrap;
          }
        `;
        document.head.appendChild(style);
      }

      const newDecorations = [
        {
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          options: { beforeContentClassName: className },
        },
      ];

      decorationIdsRef.current[socketId] = editor.deltaDecorations(
        decorationIdsRef.current[socketId] || [],
        newDecorations
      );
    };

    const handleUserLeft = ({ socketId }) => {
      const editor = editorRef.current;
      if (editor && decorationIdsRef.current[socketId]) {
        editor.deltaDecorations(decorationIdsRef.current[socketId], []);
        delete decorationIdsRef.current[socketId];
      }
    };

    socket.on('code-change', handleRemoteChange);
    socket.on('cursor-change', handleCursorChange);
    socket.on('user-left', handleUserLeft);
    socket.emit('code-sync-request', { roomId });

    return () => {
      socket.off('code-change', handleRemoteChange);
      socket.off('cursor-change', handleCursorChange);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, roomId]);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e) => {
      clearTimeout(cursorThrottleRef.current);
      cursorThrottleRef.current = setTimeout(() => {
        socket?.emit('cursor-change', { roomId, position: e.position });
      }, 80);
    });
  };

  const handleChange = useCallback(
    (value) => {
      setCode(value);
      if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false;
        return;
      }
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        socket?.emit('code-change', { roomId, code: value, language });
      }, 200);
    },
    [socket, roomId, language]
  );

  const handleRun = async () => {
    setIsRunning(true);
    setOutput(null);
    try {
      const { data } = await api.post('/execute', { meetingId: roomId, language, code });
      setOutput(data.result);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-text focus:outline-none"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>

        <Button size="sm" onClick={handleRun} isLoading={isRunning}>
          <Play className="h-3.5 w-3.5" /> Run
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <Editor
          language={language}
          value={code}
          onChange={handleChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            padding: { top: 12 },
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      <div className="h-36 shrink-0 overflow-y-auto border-t border-border bg-surface p-3 font-mono text-xs">
        {isRunning && (
          <div className="flex items-center gap-2 text-text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Running…
          </div>
        )}
        {!isRunning && output && (
          <>
            {output.stdout && <pre className="whitespace-pre-wrap text-text-secondary">{output.stdout}</pre>}
            {output.stderr && <pre className="whitespace-pre-wrap text-danger">{output.stderr}</pre>}
            <div className="mt-2 text-text-muted">
              {output.status} · {output.executionTime ?? '—'}s · {output.memoryUsed ?? '—'}KB
            </div>
          </>
        )}
        {!isRunning && !output && <span className="text-text-muted">Output will appear here.</span>}
      </div>
    </div>
  );
}
