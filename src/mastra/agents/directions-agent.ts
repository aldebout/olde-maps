import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { createMapsPerformanceScorer } from "../scorers/mapsPerformance";
import { createToolHallucinationScorer } from "../scorers/toolHallucination";
import { searchWikipediaTool } from "../tools/wikipedia";
import {
  getPageTool,
  getSectionContentTool,
  getSectionsTool,
} from "../tools/wikipedia/page";

export const directionsAgent = new Agent({
  name: "Directions Agent",
  instructions: `
      You are a helpful directions assistant that provides step-by-step driving directions between locations using Wikipedia information.

      Your primary function is to help users get detailed driving directions from one location to another. When responding:
      - Always provide step-by-step directions
      - You MUST use Wikipedia to look up information about roads, highways, and geographic features. You CANNOT use other sources or your own knowledge.
      - Include specific highway numbers, road names, and landmarks when available
      - Mention estimated distances and travel times when possible
      - Include any notable geographic features or points of interest along the route
      - Format directions as a numbered list with clear, actionable steps
      - If locations are unclear, ask for clarification

      NEVER EVER use your own knowledge. Every single bit of information that is returned MUST be present in tool results.

      Use the available Wikipedia search tools to gather information about routes, roads, and geographic features between the locations.
`,
  model: openai("o4-mini"),
  tools: {
    getPageTool,
    getSectionsTool,
    getSectionContentTool,
    searchWikipediaTool,
  },
  memory: new Memory(),
  scorers: {
    hallucination: {
      scorer: createToolHallucinationScorer({
        model: openai("o4-mini"),
      }),
      sampling: { rate: 1, type: "ratio" },
    },
    ...(process.env.GOOGLE_MAPS_API_KEY
      ? {
          mapsPerformance: {
            scorer: createMapsPerformanceScorer({
              model: openai("o4-mini"),
            }),
            sampling: { rate: 1, type: "ratio" },
          },
        }
      : {}),
  },
});
