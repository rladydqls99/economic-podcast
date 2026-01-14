//npx tsx src/script/run-full-flow.ts

import { GoogleNewsService } from '@/modules/news-collector/index.js';
import { ScriptGenerator } from '@/modules/script-generator/index.js';

const runFullFlow = async () => {
  const googleNewsService = new GoogleNewsService();
  const scriptGenerator = new ScriptGenerator();

  const before = new Date();
  before.setDate(before.getDate() - 1);
  const after = new Date();

  const result = await googleNewsService.collectNews(before, after);
  const script = await scriptGenerator.generateScript(result.newsItems);

  console.log(script);
};

runFullFlow();
