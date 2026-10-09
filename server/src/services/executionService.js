import axios from 'axios';

const LANGUAGE_IDS = Object.freeze({
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
  c: 50,
  cpp: 54,
  go: 60,
  rust: 73,
});
const MAX_CODE_LENGTH = 20000;
const MAX_STDIN_LENGTH = 5000;
const REQUEST_TIMEOUT_MS = 12000;
const POLL_INTERVAL_MS = 900;
const MAX_POLL_ATTEMPTS = 18;
const TERMINAL_STATUSES = new Set(['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Compilation Error', 'Runtime Error (SIGSEGV)', 'Runtime Error (SIGXFSZ)', 'Runtime Error (SIGFPE)', 'Runtime Error (SIGABRT)', 'Runtime Error (NZEC)', 'Runtime Error (Other)', 'Internal Error', 'Exec Format Error']);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function judgeHeaders() {
  const headers = { 'content-type': 'application/json' };
  if (process.env.JUDGE0_API_KEY) headers['X-RapidAPI-Key'] = process.env.JUDGE0_API_KEY;
  if (process.env.JUDGE0_API_HOST) headers['X-RapidAPI-Host'] = process.env.JUDGE0_API_HOST;
  return headers;
}

function formatResult(data) {
  return {
    stdout: data.stdout || '',
    stderr: data.stderr || data.compile_output || data.message || '',
    executionTime: data.time ?? null,
    memoryUsed: data.memory ?? null,
    status: data.status?.description || 'Unknown',
    exitCode: data.exit_code ?? null,
  };
}

export async function runCode({ language, code, stdin = '' }) {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);
  if (typeof code !== 'string' || !code.trim()) throw new Error('Code is required');
  if (code.length > MAX_CODE_LENGTH) throw new Error('Code exceeds the 20,000 character limit');
  if (typeof stdin !== 'string') throw new Error('Input must be text');
  if (stdin.length > MAX_STDIN_LENGTH) throw new Error('Input exceeds the 5,000 character limit');

  // Judge0 CE is the no-key default. A hosted/RapidAPI endpoint can override it.
  const baseUrl = (process.env.JUDGE0_API_URL || 'https://ce.judge0.com').replace(/\/+$/, '');
  const headers = judgeHeaders();
  const client = axios.create({ baseURL: baseUrl, headers, timeout: REQUEST_TIMEOUT_MS });

  try {
    const { data: submission } = await client.post('/submissions?base64_encoded=false&wait=false', {
      source_code: code,
      language_id: languageId,
      stdin,
      cpu_time_limit: 5,
      wall_time_limit: 10,
      memory_limit: 256000,
      max_processes_and_or_threads: 10,
    });
    if (!submission?.token) {
      if (submission?.status?.description) return formatResult(submission);
      throw new Error('The execution provider did not return a submission token.');
    }

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      await sleep(POLL_INTERVAL_MS);
      const { data } = await client.get(`/submissions/${encodeURIComponent(submission.token)}?base64_encoded=false`);
      const status = data.status?.description || 'Unknown';
      if (data.status?.id > 2 || TERMINAL_STATUSES.has(status)) return formatResult(data);
    }
    throw new Error('Execution is taking longer than expected. Please run it again in a moment.');
  } catch (error) {
    if (error.message?.startsWith('Execution is taking') || error.message?.startsWith('The execution provider')) throw error;
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') throw new Error('The execution service timed out. Please try again.');
    const status = error.response?.status;
    if (status === 401 || status === 403) throw new Error('The execution provider rejected its credentials. Check the Judge0 API key and host settings.');
    if (status === 429) throw new Error('The execution service is rate-limited. Please wait a moment and try again.');
    const providerMessage = error.response?.data?.message || error.response?.data?.error;
    if (providerMessage) throw new Error(`Execution provider: ${String(providerMessage).slice(0, 300)}`);
    throw new Error('The execution service is temporarily unavailable. Please try again.');
  }
}
