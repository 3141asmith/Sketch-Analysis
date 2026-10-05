const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const dir = path.join(__dirname, 'data');
const categories = fs.readFileSync(path.join(dir, 'categories.txt'), 'utf8').trim().split(/\r?\n/);
const jobs = new Map();
const indexes = new Map();
function fileFor(category) {
  if (!categories.includes(category)) throw new Error('Unknown category');
  return path.join(dir, category + '.ndjson');
}
async function prepare(category) {
  const file = fileFor(category);
  if (indexes.has(category)) return indexes.get(category);
  if (jobs.has(category)) return jobs.get(category);
  const job = (async () => {
    if (!fs.existsSync(file)) {
      const temp = file + '.part';
      try {
        const response = await fetch('https://storage.googleapis.com/quickdraw_dataset/full/simplified/' + encodeURIComponent(category) + '.ndjson', {signal: AbortSignal.timeout(600000)});
        if (!response.ok) throw new Error('Dataset download failed: ' + response.status);
        await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(temp));
        await fsp.rename(temp, file);
      } catch (error) { await fsp.rm(temp, {force:true}); throw error; }
    }
    const offsets = [0];
    let position = 0;
    for await (const chunk of fs.createReadStream(file)) {
      for (let i = 0; i < chunk.length; i++) if (chunk[i] === 10) offsets.push(position + i + 1);
      position += chunk.length;
    }
    if (offsets.at(-1) !== position) offsets.push(position);
    if (offsets.length < 2) throw new Error('Dataset is empty');
    indexes.set(category, offsets);
    return offsets;
  })();
  jobs.set(category, job);
  try { return await job; } finally { jobs.delete(category); }
}
async function page(category, number, size = 48) {
  const offsets = await prepare(category);
  const total = offsets.length - 1;
  const pages = Math.ceil(total / size);
  number = Math.min(number, pages);
  const start = (number - 1) * size;
  const end = Math.min(start + size, total);
  const file = await fsp.open(fileFor(category), 'r');
  try {
    const buffer = Buffer.alloc(offsets[end] - offsets[start]);
    let read = 0;
    while (read < buffer.length) {
      const result = await file.read(buffer, read, buffer.length - read, offsets[start] + read);
      if (!result.bytesRead) throw new Error('Incomplete dataset file');
      read += result.bytesRead;
    }
    return {category, page:number, pages, total, drawings:buffer.toString('utf8').trim().split('\n').map(JSON.parse)};
  } finally { await file.close(); }
}
module.exports = {categories, prepare, page, fileFor};
