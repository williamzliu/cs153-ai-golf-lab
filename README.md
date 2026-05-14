# AI Golf Lab

**Live demo:** https://cs153-ai-golf-lab.vercel.app/

AI Golf Lab is a RAG-powered personal golf coaching application built as a CS 153 class project. It combines retrieval-augmented generation with a curated instructional corpus to deliver personalized, context-aware coaching advice. Users enter their handicap, typical miss, and current goal; the app embeds their question with Voyage AI, retrieves the most relevant chunks from a local knowledge base, and passes them to Claude to generate coaching responses grounded in real instructional content rather than generic golf knowledge.

## Tech Stack

- **Next.js 14+** with App Router and TypeScript
- **Tailwind CSS** for styling
- **Anthropic SDK** (`@anthropic-ai/sdk`) with model `claude-sonnet-4-5`
- **Voyage AI SDK** (`voyageai`) with model `voyage-3.5-lite`
- Embeddings stored in `data/embeddings.json`; retrieval via in-memory cosine similarity (no database, no auth, no vector DB)

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set environment variables** — edit `.env.local` and fill in both keys:
   ```
   ANTHROPIC_API_KEY=your_key_here
   VOYAGE_API_KEY=your_key_here
   ```

3. **Build the embeddings index** (run once after setting `VOYAGE_API_KEY`):
   ```bash
   npx tsx scripts/build-embeddings.ts
   ```
   This reads `data/corpus.json`, calls Voyage AI to embed all 25 chunks, and writes `data/embeddings.json`.

4. **Start the dev server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
data/
  corpus.json          25 instructional chunks (source of truth)
  embeddings.json      corpus + Voyage embeddings (generated artifact)

lib/
  embed.ts             Voyage AI client: embed() for queries, embedDocuments() for ingestion
  retrieval.ts         Loads embeddings.json, exposes retrieveTopK() via cosine similarity
  prompt.ts            buildSystemPrompt() — assembles system prompt with profile + chunks

scripts/
  build-embeddings.ts  One-shot ingestion script (npx tsx scripts/build-embeddings.ts)

app/
  page.tsx             Two-state root: ProfileForm -> ChatInterface
  api/chat/route.ts    POST /api/chat — embed query, retrieve, prompt, call Claude

components/
  ProfileForm.tsx      Handicap / typical miss / current goal form
  ChatInterface.tsx    Chat UI with message history and source disclosure
```

**Request flow:** User sends a question -> `/api/chat` embeds it with Voyage AI -> retrieves top-5 chunks by cosine similarity -> builds system prompt with player profile + chunks -> calls Claude `claude-sonnet-4-5` with full conversation history -> returns reply + retrieved metadata -> UI renders response and collapsible sources panel.

## Future Implementation

- **Persistent user profiles** via Supabase — save and reload player profiles across sessions
- **Expanded corpus with metadata filtering** — filter retrieval by `skill_level` or `content_type` before ranking
- **Structured output enforcement** — use Claude tool use to enforce typed schemas for drills, practice plans, and strategy responses
- **Reranking for retrieval quality** — add a cross-encoder reranker pass after initial cosine recall
- **Drill library UI** — browseable, searchable index of all drills in the corpus
- **Saved practice plans** — persist generated practice plans and allow editing
- **Shareable session summaries** — generate and export coaching session recaps
- **Feedback loop for retrieval improvement** — thumbs up/down on retrieved sources to surface relevance signal
