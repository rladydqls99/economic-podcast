import app from './app.js';

app.listen(app.get('port'), () => {
  console.log(`⭐️ Economic Podcast Server is running on port ${app.get('port')}`);
});
