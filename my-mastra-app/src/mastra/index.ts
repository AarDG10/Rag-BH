import { Mastra } from '@mastra/core/mastra';
import { PgVector, PostgresStore } from '@mastra/pg';
import { PinoLogger } from '@mastra/loggers';
import { berkshireAgent } from './agents/berkshire-agent';

// Hardcode your Postgres connection string here: (temp fix)
const PG_CONNECTION_STRING = "postgresql://postgres:postgres@localhost:5433/mastra_rag_db";

export const pgVector = new PgVector({
  connectionString: PG_CONNECTION_STRING,
  schemaName: "berkshire_intelligence", // optional
});

const pgStorage = new PostgresStore({
  connectionString: PG_CONNECTION_STRING,
});

export const mastra = new Mastra({
  workflows: {},
  agents: {berkshireAgent},
  storage: pgStorage, // Postgres storage for agent memory
  vectors: {
    pg: pgVector, // Store embeddings in pgvector
  },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
