//ingestion and chunking script for Mastra application, choosing to save into individual JSON files per document
import fs from 'fs/promises';
import path from 'path';
import { MDocument } from '@mastra/rag';

const PARSED_DIR = '../parsed';
const CHUNKS_DIR = '../chunks';

async function ingestAndChunkDocuments() {
  await fs.mkdir(CHUNKS_DIR, { recursive: true }); // ensure chunks dir exists

  const files = await fs.readdir(PARSED_DIR);

  for (const file of files) {
    if (file.endsWith('.txt')) {
      const filePath = path.join(PARSED_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');

      const doc = MDocument.fromText(content);
      const chunks = await doc.chunk({
        strategy: 'recursive',
        size: 512,
        overlap: 50,
        separator: '\n',
      });

      // Extract year from filename (e.g., "letter_1977.txt")
      const year = file.match(/\d{4}/)?.[0] || 'unknown';

      // Enrich chunks with metadata
      const enrichedChunks = chunks.map(chunk => ({
        ...chunk,
        metadata: {
          ...chunk.metadata,
          source: file,
          year: year
        }
      }));

      // Save this file's chunks separately
      const outFile = path.join(CHUNKS_DIR, file.replace('.txt', '.json'));
      await fs.writeFile(outFile, JSON.stringify(enrichedChunks, null, 2), 'utf-8');

      console.log(`Saved ${enrichedChunks.length} chunks → ${outFile}`);
    }
  }

  console.log(`\nDone! All files processed and saved in '${CHUNKS_DIR}/'`);
}

ingestAndChunkDocuments().catch(console.error);
