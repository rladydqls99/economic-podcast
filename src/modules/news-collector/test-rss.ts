//npx tsx src/modules/news-collector/test-rss.ts

import { GoogleNewsService } from './google-news/service.js';

const googleNewsService = new GoogleNewsService();

const before = new Date();
before.setDate(before.getDate() - 1);
const after = new Date();

googleNewsService.collectNews(before, after);
