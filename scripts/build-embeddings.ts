import * as fs from "fs";
import * as path from "path";

// Load .env.local since this script runs outside Next.js
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

import { embedDocuments } from "../lib/embed";

interface CorpusChunk {
  id: string;
  topic: string;
  skill_level: string;
  content_type: string;
  text: string;
  source: string;
}

async function main() {
  const corpusPath = path.join(process.cwd(), "data", "corpus.json");
  const outputPath = path.join(process.cwd(), "data", "embeddings.json");

  console.log("Reading corpus...");
  const corpus: CorpusChunk[] = JSON.parse(fs.readFileSync(corpusPath, "utf-8"));
  console.log(`Loaded ${corpus.length} chunks.`);

  const texts = corpus.map((chunk) => chunk.text);

  console.log("Generating embeddings via Voyage AI (voyage-3-large)...");
  const embeddings = await embedDocuments(texts);
  console.log(`Generated ${embeddings.length} embeddings.`);

  const enriched = corpus.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));

  fs.writeFileSync(outputPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Done. Wrote embeddings to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
