import * as fs from "fs";
import * as path from "path";

interface StoredChunk {
  id: string;
  topic: string;
  skill_level: string;
  content_type: string;
  text: string;
  source: string;
  embedding: number[];
}

export interface RetrievedChunk {
  topic: string;
  content_type: string;
  text: string;
  source: string;
  score: number;
}

function normalize(vec: number[]): number[] {
  const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (mag === 0) return vec;
  return vec.map((v) => v / mag);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const na = normalize(a);
  const nb = normalize(b);
  return na.reduce((sum, v, i) => sum + v * nb[i], 0);
}

let chunks: StoredChunk[] | null = null;

function loadChunks(): StoredChunk[] {
  if (chunks) return chunks;
  const filePath = path.join(process.cwd(), "data", "embeddings.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  chunks = JSON.parse(raw) as StoredChunk[];
  return chunks;
}

export function retrieveTopK(
  queryEmbedding: number[],
  k: number = 5
): RetrievedChunk[] {
  const stored = loadChunks();
  const scored = stored.map((chunk) => ({
    topic: chunk.topic,
    content_type: chunk.content_type,
    text: chunk.text,
    source: chunk.source,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
