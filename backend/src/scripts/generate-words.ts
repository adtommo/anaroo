import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import leoProfanity from 'leo-profanity';

const NOUN_SOURCES = [
  'https://gist.githubusercontent.com/fogleman/7b26877050cac235343d/raw/nouns.txt',
  'https://raw.githubusercontent.com/psobko/Common-English-Nouns/master/common-nouns.txt',
  'https://gist.githubusercontent.com/trag1c/f74b2ab3589bc4ce5706f934616f6195/raw/nouns.txt',
];

const NAME_SOURCE =
  'https://raw.githubusercontent.com/dominictarr/random-name/master/names.txt';
const FREQ_SOURCE =
  'https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt';

const OUTPUT_DIR = path.resolve(__dirname, '../data/words/en');
const ALPHA = /^[a-z]+$/;

function difficulty(word: string): 'easy' | 'medium' | 'hard' | null {
  const len = word.length;
  if (len >= 4 && len <= 5) return 'easy';
  if (len === 6) return 'medium';
  if (len >= 7 && len <= 8) return 'hard';
  return null;
}

function downloadList(url: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    console.log('Downloading:', url);
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Bad status code: ${res.statusCode} for ${url}`));
        return;
      }
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => {
        const words = data
          .split('\n')
          .map((w) => w.trim().toLowerCase())
          .filter((w) => w.length > 0);
        resolve(words);
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function loadSetFromURLs(urls: string[]): Promise<Set<string>> {
  const set = new Set<string>();
  for (const url of urls) {
    try {
      const words = await downloadList(url);
      for (const w of words) set.add(w);
    } catch (err) {
      console.error('Error downloading:', url, err);
    }
  }
  return set;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const [names, freqWords, nounSet] = await Promise.all([
    loadSetFromURLs([NAME_SOURCE]),
    loadSetFromURLs([FREQ_SOURCE]),
    loadSetFromURLs(NOUN_SOURCES),
  ]);

  // Build frequency-ordered list for sorting
  const freqList = await downloadList(FREQ_SOURCE);
  const freqRank = new Map<string, number>();
  freqList.forEach((w, i) => freqRank.set(w, i));

  // Filter words
  const finalWords: string[] = [];
  for (const w of nounSet) {
    if (w.length < 4 || !ALPHA.test(w)) continue;
    if (names.has(w)) continue;
    if (!freqWords.has(w)) continue;
    if (leoProfanity.check(w)) continue;
    finalWords.push(w);
  }

  // Sort by frequency rank (lower = more common)
  finalWords.sort((a, b) => (freqRank.get(a) ?? Infinity) - (freqRank.get(b) ?? Infinity));

  // Bucket by difficulty
  const buckets: Record<string, string[]> = {
    easy: [],
    medium: [],
    hard: [],
  };

  for (const w of finalWords) {
    const diff = difficulty(w);
    if (diff) buckets[diff].push(w);
  }

  // Write JSON
  for (const [diff, words] of Object.entries(buckets)) {
    const filePath = path.join(OUTPUT_DIR, `${diff}.json`);
    fs.writeFileSync(filePath, JSON.stringify(words, null, 2) + '\n');
    console.log(`Written ${words.length} words to ${filePath}`);
  }

  console.log('Done! JSON files are ready in', OUTPUT_DIR);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
