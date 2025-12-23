import express, { Express } from 'express';
import { env } from './config/env.js';

const app: Express = express();
const PORT = env.port;

app.set('port', PORT);

app.get('/', (_req, res) => {
  res.send('⭐️ Economic Podcast Server is running');
});

export default app;
