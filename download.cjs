const {categories, prepare} = require('./dataset.cjs');
(async () => {
  const requested = process.argv.slice(2);
  for (const category of requested.length ? requested : categories) {
    console.log('Downloading / indexing:', category);
    await prepare(category);
  }
  console.log('Download complete.');
})().catch(error => {console.error(error.message); process.exitCode = 1;});
