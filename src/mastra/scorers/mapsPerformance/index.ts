import type { LanguageModel } from "@mastra/core/llm";
import type {
  ScorerRunInputForAgent,
  ScorerRunOutputForAgent,
} from "@mastra/core/scores";
import { createScorer } from "@mastra/core/scores";

import { z } from "zod";
import { getAssistantMessageFromRunOutput, roundToTwoDecimals } from "../utils";
import { getGMapsDistanceAndTime } from "./gmaps";
import {
  createPerformanceExtractPrompt,
  createPerformanceReasonPrompt,
  PERFORMANCE_AGENT_INSTRUCTIONS,
} from "./prompts";

export function createMapsPerformanceScorer({
  model,
}: {
  model: LanguageModel;
}) {
  return createScorer<ScorerRunInputForAgent, ScorerRunOutputForAgent>({
    name: "Maps performance Scorer",
    description:
      "A scorer that evaluates the performance of a directions LLM output compared to a reference route",
    judge: {
      model,
      instructions: PERFORMANCE_AGENT_INSTRUCTIONS,
    },
  })
    .preprocess({
      description:
        "Extract total distance and time from the given output. Also extracts origin and destination.",
      outputSchema: z.object({
        distance: z.number(),
        time: z.number(),
        origin: z.string(),
        destination: z.string(),
      }),
      createPrompt: ({ run }) => {
        const prompt = createPerformanceExtractPrompt({
          output: getAssistantMessageFromRunOutput(run.output) ?? "",
        });
        return prompt;
      },
    })
    .analyze(async ({ results, run }) => {
      const { distance: gmapsDistance, time: gmapsTime } =
        await getGMapsDistanceAndTime(
          results.preprocessStepResult.origin,
          results.preprocessStepResult.destination
        );

      const distanceRatio =
        gmapsDistance / results.preprocessStepResult.distance;
      const timeRatio = gmapsTime / results.preprocessStepResult.time;

      return {
        distanceRatio,
        timeRatio,
        gmapsDistance,
        gmapsTime,
      };
    })
    .generateScore(({ results }) => {
      const distanceRatio = results.analyzeStepResult.distanceRatio;
      const timeRatio = results.analyzeStepResult.timeRatio;

      const score = (distanceRatio + timeRatio) / 2;

      return roundToTwoDecimals(score);
    })
    .generateReason({
      description: "Reason about the results",
      createPrompt: ({ run, results, score }) => {
        const prompt = createPerformanceReasonPrompt({
          distanceRatio: results.analyzeStepResult.distanceRatio,
          timeRatio: results.analyzeStepResult.timeRatio,
          score,
          distance: results.preprocessStepResult.distance,
          time: results.preprocessStepResult.time,
          gmapsDistance: results.analyzeStepResult.gmapsDistance,
          gmapsTime: results.analyzeStepResult.gmapsTime,
        });
        return prompt;
      },
    });
}
