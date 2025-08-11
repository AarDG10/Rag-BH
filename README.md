# Berkshire Hathaway Intelligence (Mastra RAG)

Retrieval‑Augmented Generation (RAG) system built with the Mastra framework that answers questions about Warren Buffett’s investment philosophy using Berkshire Hathaway shareholder letters. Includes ingestion, chunking, embedding, pgvector storage, a retrieval tool, and a GPT‑4o‑powered agent with persistent memory.


## Features

- Mastra Agent (`berkshireAgent`) powered by GPT‑4o
- Document processing with `MDocument` and metadata enrichment (year, source)
- Vector storage via `pgvector` with cosine distance search
- Retrieval tool (`berkshire_tool`) that embeds queries and returns top matches with source/year/score


## Repository layout

```
my-mastra-app/
  docker-compose.yml          # Postgres + pgvector
  ingestion/ingest-and-chunk.js
  embedder/embed.ts           # Creates index + upserts embeddings/metadata
  src/mastra/
    index.ts                  # Mastra app wiring (agent, memory, vectors)
    agents/berkshire-agent.ts
    tools/berkshire-tool.ts
  parsed/*.txt                # Raw shareholder letters (plain text)
  chunks/*.json               # Chunked documents with metadata
```


## Prerequisites

- Node.js 20.9+ (ESM)
- Docker (for Postgres/pgvector)
- OpenAI API key

Environment variables (set in your shell):

```
export OPENAI_API_KEY=YOUR_KEY
```

The default Postgres connection string is:

```
postgresql://postgres:postgres@localhost:5433/mastra_rag_db
```

It matches the provided `docker-compose.yml`. You can change it in `src/mastra/index.ts` if needed.


## Quick start

1) Start Postgres with pgvector

```
cd my-mastra-app
docker compose up -d
```

2) Install dependencies

```
npm install
```

3) Ingest and chunk the shareholder letters (This can be skipped since the chunks are already ready, but for a diff. use case, need to update and run the script)

This script uses `MDocument` to chunk text and enrich metadata. Run it from its directory so relative paths resolve.

```
cd ingestion
node ingest-and-chunk.js
cd ..
```

4) Create embeddings and upsert into pgvector

The embedder is written in TypeScript. Use `tsx` to run it directly:

```
npm i -D tsx
npx tsx embedder/embed.ts
```

This will:
- Create the `searchexamples` index (1536 dims)
- Generate OpenAI embeddings for each chunk
- Upsert vectors + metadata into `pgvector`

5) Run Mastra locally (optional, for playground/dev)

```
npm run dev
```

## How it works

1) Ingestion and chunking (`ingestion/ingest-and-chunk.js`)
- Reads `parsed/*.txt`
- Uses `MDocument.fromText(...).chunk({ strategy: 'recursive', size: 512, overlap: 50 })`
- Adds metadata: `source`, `year`
- Writes `chunks/*.json`

2) Embedding and storage (`embedder/embed.ts`)
- Creates pgvector index `searchexamples`
- Embeds each chunk with `text-embedding-3-small`
- Upserts `vectors + metadata` into the `berkshire_intelligence` schema

3) Retrieval tool (`src/mastra/tools/berkshire-tool.ts`)
- Embeds user query, runs similarity search via `<=>` against pgvector
- Returns `text`, `source`, `year`, `score`

4) Agent (`src/mastra/agents/berkshire-agent.ts`)
- GPT‑4o model, wired with the retrieval tool
- Persistent memory via `Memory` + `PostgresStore` for conversation continuity

5) App wiring (`src/mastra/index.ts`)
- Registers agent, storage, and vector store (`PgVector`)


## Configuration

- OpenAI: set `OPENAI_API_KEY`
- Postgres/pgvector: default connection string is hard-coded in `src/mastra/index.ts`. Update if your DB differs.


## Testing checklist

- Document processing
  - `node ingestion/ingest-and-chunk.js` creates `chunks/*.json`
  - `npx tsx embedder/embed.ts` creates index and upserts embeddings
  - Vector search returns relevant rows (validated by the tool)

- Agent & memory
  - Agent responds with grounded answers (tool results used)
  - Conversation context persists across turns (Postgres store)

- Retrieval & citations
  - Tool returns `text`, `source`, `year`, `score`
  - Agent instructions encourage quoting + citation by year/source

## Application Preview

Here is a preview of the application in action, showing the agent retrieving information and providing source-based answers.

<img width="1920" height="831" alt="Screenshot (1087)" src="https://github.com/user-attachments/assets/2608d977-1d0d-4f56-bcae-189f6adffb73" />

<img width="1920" height="833" alt="Screenshot (1088)" src="https://github.com/user-attachments/assets/8e346117-aac4-4927-90a5-f8ddddf79759" />

<img width="1920" height="809" alt="Screenshot (1089)" src="https://github.com/user-attachments/assets/73894deb-0e46-4f6c-bd00-ea3af0993374" />
