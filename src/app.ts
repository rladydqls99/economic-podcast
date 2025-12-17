import express from 'express';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3000;

app.set('port', PORT);

app.get('/', (_req, res) => {
  res.send('⭐️ Economic Podcast Server is running');
});

export default app;
