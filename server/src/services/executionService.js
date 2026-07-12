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

export async function runCode({ language, code, stdin }) {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  const { data } = await axios.post(
    `${process.env.JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
    { source_code: code, language_id: languageId, stdin },
    {
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
      },
    }
  );

  return {
    stdout: data.stdout || '',
    stderr: data.stderr || data.compile_output || '',
    executionTime: data.time,
    memoryUsed: data.memory,
    status: data.status?.description,
  };
}
