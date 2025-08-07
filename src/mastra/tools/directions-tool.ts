import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { directionsAgent } from "../agents/directions-agent";

export const directionsTool = createTool({
  id: "get-directions",
  description: "Get driving directions between two locations",
  inputSchema: z.object({
    startingLocation: z.string().describe("Starting location"),
    destination: z.string().describe("Destination location"),
  }),
  outputSchema: z.object({
    directions: z.string().describe("Step-by-step driving directions"),
  }),
  execute: async ({ context }) => {
    const { startingLocation, destination } = context;

    const prompt = `I want to go from ${startingLocation} to ${destination}`;

    const result = await directionsAgent.generate(prompt, { maxSteps: 20 });

    return {
      directions: result.text,
    };
  },
});
