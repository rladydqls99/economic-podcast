import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const parsedPort = Number(process.env.PORT);
const port = Number.isFinite(parsedPort) ? parsedPort : 3000;

const newsCollectionTimeout = process.env.NEWS_COLLECTION_TIMEOUT ? Number(process.env.NEWS_COLLECTION_TIMEOUT) : 30000;

export const env = {
  port,
  newsCollectionTimeout,
};
