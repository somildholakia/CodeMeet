import axios from 'axios';

const LANGUAGE_IDS = {
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
  c: 50,
  cpp: 54,
  go: 60,
  rust: 73,
};

const MAX_CODE_LENGTH = 20000;
const MAX_STDIN_LENGTH = 5000;
const REQUEST_TIMEOUT_MS = 20000;

export async function runCode({ language, code, stdin = '' }) {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);
  if (typeof code !== 'string' || !code.trim()) throw new Error('Code is required');
  if (code.length > MAX_CODE_LENGTH) throw new Error('Code exceeds the 20,000 character limit');
  if (typeof stdin !== 'string') throw new Error('stdin must be text');
  if (stdin.length > MAX_STDIN_LENGTH) throw new Error('Input exceeds the 5,000 character limit');

  const baseUrl = process.env.JUDGE0_API_URL;
  if (!baseUrl) throw new Error('Code execution service is not configured');

  try {
    const { data } = await axios.post(
      `${baseUrl.replace(/\/$/, '')}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageId,
        stdin,
        cpu_time_limit: 5,
        wall_time_limit: 10,
        memory_limit: 256000,
        max_processes_and_or_threads: 10,
      },
      {
        headers: {
          'content-type': 'application/json',
          ...(process.env.JUDGE0_API_KEY
            ? { 'X-RapidAPI-Key': process.env.JUDGE0_API_KEY }
            : {}),
        },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    return {
      stdout: data.stdout || '',
      stderr: data.stderr || data.compile_output || '',
      executionTime: data.time ?? null,
      memoryUsed: data.memory ?? null,
      status: data.status?.description || 'Unknown',
    };
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Code execution timed out. Please try again.');
    }

    const providerMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;

    throw new Error(`Code execution service unavailable: ${providerMessage}`);
  }
}
