import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const parsedPort = Number(process.env.PORT);
const port = Number.isFinite(parsedPort) ? parsedPort : 3000;

export const env = {
  port,
};
