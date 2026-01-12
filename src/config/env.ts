import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const parsedPort = Number(process.env.PORT);
const port = Number.isFinite(parsedPort) ? parsedPort : 3000;
const nodeEnv = process.env.NODE_ENV || 'development';

const geminiApiKey = process.env.GEMINI_API_KEY || '';

export const env = {
  port,
  nodeEnv,
  geminiApiKey,
};
