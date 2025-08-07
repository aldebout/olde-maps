export const HALLUCINATION_AGENT_INSTRUCTIONS = `You are a precise and thorough hallucination evaluator. Your job is to determine if an LLM's output contains information not supported by or contradicts the provided context.

Key Principles:
1. First extract all claims from the output (both factual and speculative)
2. Then verify each extracted claim against the provided context
3. Consider it a hallucination if a claim contradicts the context
4. Consider it a hallucination if a claim makes assertions not supported by context
5. Empty outputs should be handled as having no hallucinations
6. Speculative language (may, might, possibly) about facts IN the context is NOT a hallucination
7. Speculative language about facts NOT in the context IS a hallucination
8. Never use prior knowledge in judgments - only use what's explicitly stated in context
9. The following are NOT hallucinations:
   - Using less precise dates (e.g., year when context gives month)
   - Reasonable numerical approximations
   - Omitting additional details while maintaining factual accuracy
10. Subjective claims ("made history", "pioneering", "leading") are hallucinations unless explicitly stated in context
`;

export function createHallucinationExtractPrompt({
  output,
}: {
  output: string;
}) {
  return `Extract all claims from the given output. A claim is any statement that asserts information, including both factual and speculative assertions.

Guidelines for claim extraction:
- Break down compound statements into individual claims
- Include all statements that assert information
- Include both definitive and speculative claims (using words like may, might, could)
- Extract specific details like numbers, dates, and quantities
- Keep relationships between entities
- Include predictions and possibilities
- Extract claims with their full context
- Exclude only questions and commands
- Output contains directions, claims are geographic features, roads, intersections, distances, travel times, etc.

===== Example =====
Example:
Text: "From Chatou town centre, head east on Rue des Impressionnistes toward the Seine. Follow signs for D 186.
– Distance: 1.8 km (≈ 5 min)
– Landmark: you’ll pass the Maison Fournaise and approach the Île des Impressionnistes.

Remain on D 186 and cross the Pont de Chatou over the Seine into Rueil-Malmaison (Hauts-de-Seine).
– Distance: 0.7 km (≈ 2 min)
– Note: this bridge rests on the Île des Impressionnistes and links Chatou to Rueil.

Immediately after the bridge, follow brown-and-white signs for “Autoroute A 86 – Créteil-Paris” and take the right-hand ramp.
– Distance to ramp: 0.5 km (≈ 1 min)
– Junction: merges onto A 86 eastbound.

Merge onto the A 86 “super-périphérique” and stay in a lane marked “Paris” (inner ring).
– Distance: 8.0 km (≈ 10 min)
– Note: on the south-western section you’ll pass through the 10 km Duplex A 86 tunnel (height limit 2 m; commercial vehicles prohibited).

After emerging from the tunnel, keep right to follow signs for “Périphérique Paris – Porte d’Auteuil.”
– Distance to change-over: 1.5 km (≈ 2 min)

Merge onto the Boulevard Périphérique (inner ring, speed limit 50 km/h) heading south-west toward Porte d’Auteuil.
– Distance: 3.0 km (≈ 5 min)
– Landmarks: Bois de Boulogne is on your right; Parc des Princes lies just beyond.

Take the exit signed “Porte d’Auteuil – Paris 16e.” You have now entered the City of Paris.
– Distance into the 16th arrondissement: 0.5 km (≈ 1 min)"

{
    "claims": [
      "From Chatou town centre, you can head east on Rue des Impressionnistes toward the Seine",
      "There is a road named D 186 in Chatou",
      "Maison Fournaise is near the road D 186",
      "From Chatou, D186 goes toward Île des Impressionnistes",
      "The distance from Chatou center to Île des Impressionnistes is 1.8 km",
      "D 186 from Chatou to Rueil Malmaison crosses the Seine on the Pont de Chatou",
      "Pont de Chatou rests on the Île des Impressionnistes",
      "There is a connection from D 186 to A 86 eastbound",
      "The connection from D 186 to A 86 is immediately after the Pont de Chatou",
      "The signs for the A 86 eastbound are brown-and-white",
      "There is a lane named Paris on the A 86 eastbound",
      "The distance to the ramp is 0.5 km",
      "The distance from Rueil to périphérique is 8 + 1.5 = 9.5 km",
      "There is a tunnel on the A 86 eastbound between Rueil and périphérique",
      "The height limit of the tunnel is 2 m",
      "Commercial vehicles are prohibited in the tunnel",
      "The distance from périphérique to Porte d'Auteuil is 3 km",
      "There is a road named Boulevard Périphérique in Paris",
      "The speed limit on Boulevard Périphérique is 50 km/h",
      "The distance from périphérique to Porte d'Auteuil is 3 km",
      "There is a road named Avenue de la Porte d'Auteuil in Paris",
      "There is a location called Porte d'Auteuil in Paris",
      "Porte d'Auteuil is in the 16th arrondissement of Paris",
      "Porte d'Auteuil is on Périphérique",
    ]
}
Note: All assertions are included, even speculative ones, as they need to be verified against the context.

===== END OF EXAMPLE ======
Please return only JSON format with "claims" array.
Return empty list for empty OUTPUT.

Output:
===== OUTPUT =====

${output}

===== END OF OUTPUT =====

# Important Instructions
- If the output above is empty (contains no text), you MUST return exactly this JSON: {"claims": []}
- Only extract claims if there is actual text in the output section

JSON:
`;
}

export function createHallucinationAnalyzePrompt({
  context,
  claims,
}: {
  context: string[];
  claims: string[];
}) {
  return `Verify if the claims contain any information not supported by or contradicting the provided context. A hallucination occurs when a claim either:
1. Contradicts the context
2. Makes assertions not supported by the context

Claims to verify:
${claims.join("\n")}

Number of claims: ${claims.length}

Number of context statements: ${context.length}

Context statements:
${context.join("\n")}

For each claim, determine if it is supported by the context. When evaluating:

1. NOT Hallucinations:
   - Using less precise dates (e.g., year when context gives month)
   - Reasonable numerical approximations
   - Omitting additional details while maintaining factual accuracy
   - Speculative language about facts present in context

2. ARE Hallucinations:
   - Claims that contradict the context
   - Assertions not supported by context
   - Speculative claims about facts not in context
   - Subjective claims not explicitly supported by context

=== Example ===
Context: [
  "SpaceX achieved first successful landing in December 2015.",
  "Their reusable rocket technology reduced launch costs by 30%."
]
Claims: [
  "SpaceX made history in 2015",
  "SpaceX had pioneering reusable rockets",
  "reusable rockets significantly cut costs",
  "They might expand operations globally"
]
{
    "verdicts": [
        {
            "statement": "SpaceX made history in 2015",
            "verdict": "yes",
            "reason": "The subjective claim 'made history' and the year are not supported by context"
        },
        {
            "statement": "SpaceX had pioneering reusable rockets",
            "verdict": "yes",
            "reason": "The subjective claim 'pioneering' is not supported by context"
        },
        {
            "statement": "reusable rockets significantly cut costs",
            "verdict": "no",
            "reason": "Context supports that costs were reduced by 30%, this is a reasonable paraphrase"
        },
        {
            "statement": "They might expand operations globally",
            "verdict": "yes",
            "reason": "This speculative claim about facts not in context is a hallucination"
        }
    ]
}

Rules:
- Mark as hallucination if information contradicts context
- Mark as hallucination if assertions aren't supported by context
- Every factual claim must be verified
- Never use prior knowledge in your judgment
- Provide clear reasoning for each verdict
- Be specific about what information is or isn't supported by context
- Allow reasonable approximations and less precise dates

Format:
{
    "verdicts": [
        {
            "statement": "individual claim",
            "verdict": "yes/no",
            "reason": "explanation of whether the claim is supported by context"
        }
    ]
}

If there are no claims, return an empty array for verdicts.
`;
}

export function createHallucinationReasonPrompt({
  input,
  output,
  score,
  scale,
  verdicts,
}: {
  input: string;
  output: string;
  score: number;
  scale: number;
  verdicts: { verdict: string; reason: string }[];
}) {
  return `Explain the hallucination score where 0 is the lowest and ${scale} is the highest for the LLM's response using this context:
  Input:
  ${input}
  Output:
  ${output}
  Score: ${score}
  Verdicts:
  ${JSON.stringify(verdicts)}
  Rules:
  - Explain score based on ratio of contradicted statements to total statements
  - Focus on factual inconsistencies with context
  - Keep explanation concise and focused
  - Use given score, don't recalculate
  - Explain both contradicted and non-contradicted aspects
  - For mixed cases, explain the balance
  - Base explanation only on the verified statements, not prior knowledge
  Format:
  {
      "reason": "The score is {score} because {explanation of hallucination}"
  }
  Example Responses:
  {
      "reason": "The score is 0.0 because none of the statements from the context were contradicted by the output"
  }
  {
      "reason": "The score is 0.5 because half of the statements from the context were directly contradicted by claims in the output"
  }`;
}
