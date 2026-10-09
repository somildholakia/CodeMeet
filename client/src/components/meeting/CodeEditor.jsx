import { useEffect, useRef, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Loader2, Terminal, Keyboard, CheckCircle2, AlertCircle } from 'lucide-react';
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

const CURSOR_COLORS = ['#f45d3e', '#23866a', '#d99124', '#cf5785', '#8666d7', '#2f9da0'];

function colorForSocketId(socketId) {
  let hash = 0;
  for (let i = 0; i < socketId.length; i += 1) hash = (hash * 31 + socketId.charCodeAt(i)) | 0;
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

export default function CodeEditor({ socket, roomId, initialCode }) {
  const [code, setCode] = useState(initialCode || '// Start coding together...\n');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState(null);
  const [stdin, setStdin] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const debounceRef = useRef(null);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationIdsRef = useRef({}); // socketId -> decoration id array
  const cursorThrottleRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleRemoteChange = ({ code: remoteCode, language: remoteLanguage }) => {
      if (typeof remoteCode === 'string') setCode(remoteCode);
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
            content: '${(user?.name || 'Guest').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ')}';
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
      clearTimeout(debounceRef.current);
      clearTimeout(cursorThrottleRef.current);
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
      const nextCode = value ?? '';
      setCode(nextCode);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        socket?.emit('code-change', { roomId, code: nextCode, language });
      }, 200);
    },
    [socket, roomId, language]
  );

  const handleRun = async () => {
    setIsRunning(true);
    setOutput(null);
    try {
      const { data } = await api.post('/execute', { meetingId: roomId, language, code, stdin });
      setOutput(data.result);
      if (data.result?.status === 'Accepted') toast.success('Code ran successfully', { duration: 1800 });
    } catch (err) {
      setOutput({ status: 'Request failed', stderr: err.message || 'Unable to execute code.', stdout: '' });
      toast.error(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-[#eee4d8] bg-[#fffaf4] px-3 py-2.5">
        <select
          value={language}
          onChange={(e) => {
            const nextLanguage = e.target.value;
            setLanguage(nextLanguage);
            setOutput(null);
            socket?.emit('code-change', { roomId, code, language: nextLanguage });
          }}
          className="h-9 rounded-xl border border-[#e8ded2] bg-white px-3 text-xs text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-[#f45d3e]/10"
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
          loading={<div className="flex h-full items-center justify-center gap-2 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin"/>Loading editor…</div>}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            padding: { top: 12 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>

      <div className="grid max-h-[42%] min-h-[170px] shrink-0 grid-cols-1 border-t border-[#eee4d8] bg-[#fffaf4] sm:grid-cols-[minmax(130px,.75fr)_minmax(0,1.25fr)]">
        <div className="flex min-h-[76px] flex-col border-b border-[#eee4d8] sm:border-b-0 sm:border-r">
          <div className="flex items-center gap-2 px-3 pt-2.5 text-[10px] font-bold uppercase tracking-[.14em] text-text-muted"><Keyboard className="h-3.5 w-3.5"/> Standard input</div>
          <textarea aria-label="Standard input" value={stdin} onChange={(e) => setStdin(e.target.value)} placeholder="Input passed to your program…" className="min-h-[60px] flex-1 resize-y bg-transparent px-3 py-2 font-mono text-xs text-text outline-none placeholder:text-[#b0a59a] focus:ring-2 focus:ring-inset focus:ring-[#f45d3e]/15" />
        </div>
        <div className="flex min-h-[76px] flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-[#eee4d8] px-3 py-2"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-text-muted"><Terminal className="h-3.5 w-3.5"/> Output</span>{isRunning ? <span className="flex items-center gap-1.5 text-[10px] text-text-muted"><Loader2 className="h-3 w-3 animate-spin"/>Running</span> : output && <span className={`flex items-center gap-1 text-[10px] font-semibold ${output.status === 'Accepted' ? 'text-[#23866a]' : 'text-danger'}`}>{output.status === 'Accepted' ? <CheckCircle2 className="h-3 w-3"/> : <AlertCircle className="h-3 w-3"/>}{output.status}</span>}</div>
          <div className="min-h-[60px] flex-1 overflow-auto p-3 font-mono text-xs">
            {isRunning && <div className="flex items-center gap-2 text-text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin"/>Running your code…</div>}
            {!isRunning && output && <><pre className="whitespace-pre-wrap break-words text-text-secondary">{output.stdout || (output.status === 'Accepted' ? '(Program finished with no output)' : '')}</pre>{output.stderr && <pre className="mt-2 whitespace-pre-wrap break-words text-danger">{output.stderr}</pre>}<div className="mt-2 border-t border-[#eee4d8] pt-2 text-[10px] text-text-muted">{output.executionTime ?? '—'}s · {output.memoryUsed ?? '—'} KB{output.exitCode != null ? ` · exit ${output.exitCode}` : ''}</div></>}
            {!isRunning && !output && <span className="text-text-muted">Run your code to see output here.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
