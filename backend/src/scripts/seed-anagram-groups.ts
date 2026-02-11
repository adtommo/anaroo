import fs from 'fs';
import path from 'path';
import { signature } from '@anaroo/shared';
import { AnagramGroupModel } from '../models';

const WORDS_DIR = path.resolve(__dirname, '../data/words');

export default async function seed() {
  const langDirs = fs.readdirSync(WORDS_DIR).filter((f) =>
    fs.statSync(path.join(WORDS_DIR, f)).isDirectory()
  );

  let totalUpserted = 0;
  let totalModified = 0;

  for (const lang of langDirs) {
    const langDir = path.join(WORDS_DIR, lang);
    const files = fs.readdirSync(langDir).filter((f) => f.endsWith('.json'));

    for (const file of files) {
      const difficulty = path.basename(file, '.json');
      const filePath = path.join(langDir, file);
      const words: string[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // Group words by signature
      const groups: Record<string, string[]> = {};
      for (const word of words) {
        const sig = signature(word);
        if (!groups[sig]) groups[sig] = [];
        groups[sig].push(word);
      }

      // Prepare bulk upsert operations
      const ops = Object.entries(groups).map(([sig, groupWords]) => ({
        updateOne: {
          filter: { lang, difficulty, signature: sig },
          update: { $set: { lang, difficulty, signature: sig, words: groupWords } },
          upsert: true,
        },
      }));

      if (ops.length > 0) {
        const result = await AnagramGroupModel.bulkWrite(ops);
        totalUpserted += result.upsertedCount;
        totalModified += result.modifiedCount;

        console.log(
          `  ${lang}/${difficulty}: ${ops.length} groups (Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount})`
        );
      }
    }
  }

  console.log(`\nSeeding complete. Total upserted: ${totalUpserted}, total modified: ${totalModified}`);
}
