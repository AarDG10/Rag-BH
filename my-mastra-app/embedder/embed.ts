import { randomUUID, randomBytes } from 'crypto';
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { embed } from "ai";
import { mastra } from "../src/mastra/index";
import { openai } from "@ai-sdk/openai";

// Crypto polyfill
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = {
    randomUUID,
    getRandomValues(array: Uint8Array): Uint8Array {
      const bytes = randomBytes(array.length);
      array.set(bytes);
      return array;
    },
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Starting correct ingestion workflow...");
  const chunksDir = path.join(__dirname, "chunks");
  const files = await fs.readdir(chunksDir);
  const jsonFiles = files.filter(f => f.endsWith(".json"));

  const pgVector = mastra.getVector("pg");
  const embeddingModel = openai.embedding('text-embedding-3-small');

  await pgVector.createIndex({
    indexName: "searchexamples",
    dimension: 1536,
  });

  for (const file of jsonFiles) {
    console.log(`\n📄 Processing ${file}...`);
    const filePath = path.join(chunksDir, file);
    // FIX: The variable here is named 'chunks' (plural)
    const chunks = JSON.parse(await fs.readFile(filePath, "utf8"));

    if (!Array.isArray(chunks) || chunks.length === 0) {
      console.log(`   No chunks in ${file}. Skipping.`);
      continue;
    }

    const embeddingsToUpsert: number[][] = [];
    const metadataToUpsert: object[] = [];

    // The variable for each item in the loop is 'chunk' (singular)
    for (const chunk of chunks) {
      const { embedding } = await embed({
        model: embeddingModel,
        value: chunk.text,
      });

      embeddingsToUpsert.push(embedding);
      metadataToUpsert.push({
        ...chunk.metadata,
        text: chunk.text,
      });
    }

    console.log(`   Generated ${embeddingsToUpsert.length} embeddings for this file.`);

    await pgVector.upsert({
      indexName: "searchexamples",
      vectors: embeddingsToUpsert,
      metadata: metadataToUpsert,
    });

    console.log(`Upserted ${embeddingsToUpsert.length} records from ${file}.`);
  }

  console.log("\nAll chunks processed and stored correctly.");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});