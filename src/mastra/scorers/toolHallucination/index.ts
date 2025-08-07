// Very strongly inspired by the official hallucination scorer from Mastra

import type { LanguageModel } from "@mastra/core/llm";
import type {
  ScorerRunInputForAgent,
  ScorerRunOutputForAgent,
} from "@mastra/core/scores";
import { createScorer } from "@mastra/core/scores";

import { z } from "zod";
import {
  getAssistantMessageFromRunOutput,
  getUserMessageFromRunInput,
  roundToTwoDecimals,
} from "../utils";
import {
  createHallucinationAnalyzePrompt,
  createHallucinationExtractPrompt,
  createHallucinationReasonPrompt,
  HALLUCINATION_AGENT_INSTRUCTIONS,
} from "./prompts";

export interface HallucinationMetricOptions {
  scale?: number;
}

export function createToolHallucinationScorer({
  model,
  options,
}: {
  model: LanguageModel;
  options?: HallucinationMetricOptions;
}) {
  return createScorer<ScorerRunInputForAgent, ScorerRunOutputForAgent>({
    name: "Tool hallucination Scorer",
    description:
      "A scorer that evaluates the hallucination of an LLM output to tool results",
    judge: {
      model,
      instructions: HALLUCINATION_AGENT_INSTRUCTIONS,
    },
  })
    .preprocess({
      description: "Extract all claims from the given output",
      outputSchema: z.object({
        claims: z.array(z.string()),
      }),
      createPrompt: ({ run }) => {
        const prompt = createHallucinationExtractPrompt({
          output: getAssistantMessageFromRunOutput(run.output) ?? "",
        });
        return prompt;
      },
    })
    .analyze({
      description: "Score the relevance of the statements to the input",
      outputSchema: z.object({
        verdicts: z.array(
          z.object({
            statement: z.string(),
            verdict: z.string(),
            reason: z.string(),
          })
        ),
      }),
      createPrompt: ({ results, run }) => {
        const toolResults = run.output
          ?.find(({ role }) => role === "assistant")
          ?.parts.map((part) =>
            part.type === "tool-invocation" &&
            part.toolInvocation.state === "result"
              ? JSON.stringify(part.toolInvocation.result)
              : ""
          );

        const prompt = createHallucinationAnalyzePrompt({
          claims: results.preprocessStepResult.claims,
          context: toolResults ?? [],
        });
        return prompt;
      },
    })
    .generateScore(({ results }) => {
      const totalStatements = results.analyzeStepResult.verdicts.length;
      const contradictedStatements = results.analyzeStepResult.verdicts.filter(
        (v) => v.verdict === "yes"
      ).length;

      if (totalStatements === 0) {
        return 0;
      }

      const score =
        (contradictedStatements / totalStatements) * (options?.scale || 1);

      return roundToTwoDecimals(score);
    })
    .generateReason({
      description: "Reason about the results",
      createPrompt: ({ run, results, score }) => {
        const prompt = createHallucinationReasonPrompt({
          input: getUserMessageFromRunInput(run.input) ?? "",
          output: getAssistantMessageFromRunOutput(run.output) ?? "",
          score,
          scale: options?.scale || 1,
          verdicts: results.analyzeStepResult?.verdicts || [],
        });
        return prompt;
      },
    });
}
