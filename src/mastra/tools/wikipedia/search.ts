import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { searchWikipedia } from "./wikipediaClient";

export const searchWikipediaTool = createTool({
  id: "wikipedia_search",
  description: "Search Wikipedia for articles matching a query.",
  inputSchema: z.object({
    query: z.string().min(1, "Query is required"),
    limit: z.number().min(1).max(50).default(5),
    language: z.string().default("en"),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        summary: z.string(),
        size: z.number(),
        snippet: z.string(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const results = await searchWikipedia(
      context.query,
      context.limit,
      context.language
    );
    return {
      results: results.map((result) => ({
        title: result.title,
        summary: result.extract,
        size: result.size,
        snippet: result.snippet,
      })),
    };
  },
});
