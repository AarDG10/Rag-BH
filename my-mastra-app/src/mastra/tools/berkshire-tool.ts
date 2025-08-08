import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { Client } from 'pg';

export const berkshireTool = createTool({
  id: "berkshire_tool",
  description: "A tool to search Berkshire Hathaway shareholder letters...",
  inputSchema: z.object({
    query: z.string().describe("The search query..."),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      text: z.string(),
      source: z.string().optional(),
      year: z.string().optional(),
      score: z.number().optional(),
    })),
  }),
  
  execute: async (input: any) => { // Accept a generic 'any' type for the complex input
    const connectionString = "postgresql://postgres:postgres@localhost:5433/mastra_rag_db";  //TEMP fix (import fail frm .env?)
    const client = new Client({ connectionString });

    try {
      await client.connect();

      // FIX: Extract the query from the correct nested path
      const query = input.context?.query;

      // Add a safety check to ensure the query was found
      if (!query || typeof query !== 'string') {
        throw new Error(`Failed to extract query from input: ${JSON.stringify(input)}`);
      }
      
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: query,
      });

      const sqlQuery = `
        SELECT
          metadata->>'text' AS text,
          metadata->>'source' AS source,
          metadata->>'year' AS year,
          1 - (embedding <=> '[${embedding.toString()}]') AS score
        FROM
          berkshire_intelligence.searchexamples
        ORDER BY
          score DESC
        LIMIT 5;
      `;

      const { rows } = await client.query(sqlQuery);
      
      return { results: rows };

    } catch (error) {
      console.error('Error in berkshire tool:', error);
      return { results: [] };
    } finally {
      await client.end();
    }
  },
});