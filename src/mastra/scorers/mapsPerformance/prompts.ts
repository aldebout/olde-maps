export const PERFORMANCE_AGENT_INSTRUCTIONS = `You are a precise and thorough directions performance evaluator. Your job is to determine if a directions LLM's output is performant compared to a reference route.

Key Principles:
1. Extract total distance and time from the output
2. Compare the extracted distance and time to the reference route
3. Determine if the LLM's output is performant
4. If the LLM's output is not performant, explain why
5. All units are metric
`;


export function createPerformanceExtractPrompt({ output }: { output: string }) {
  return `Extract total distance (in km) and time (in minutes) from the given output. Also extract origin and destination.

===== Example =====
Text: "Here is a route from the centre of Chatou to Paris (Porte Maillot) following the Route nationale 13 entirely. All road and distance information comes from Wikipedia.

Estimated total distance: 14 km (9 mi)
Estimated driving time (off-peak): 20–25 minutes"

{
    "distance": 14,
    "time": 20,
    "origin": "Chatou",
    "destination": "Paris (Porte Maillot)"
}


===== END OF EXAMPLE ======
Please return only JSON format with "distance", "time", "origin" and "destination" keys.

Output:
===== OUTPUT =====

${output}

===== END OF OUTPUT =====

# Important Instructions
- If the output above is empty (contains no text), you MUST return exactly this JSON: {"distance": 0, "time": 0, "origin": "", "destination": ""}
- Only extract distance, time, origin and destination if there is actual text in the output section

JSON:
`;
}

export function createPerformanceReasonPrompt({
  distanceRatio,
  timeRatio,
  distance,
  time,
  gmapsDistance,
  gmapsTime,
  score,
}: {
  distanceRatio: number;
  timeRatio: number;
  distance: number;
  time: number;
  gmapsDistance: number;
  gmapsTime: number;
  score: number;
}) {
  return `
  Explain the maps performance score for the LLM's response using this context:
  Distance ratio: ${gmapsDistance} / ${distance} = ${distanceRatio} (reference distance / LLM distance)
  Time ratio: ${gmapsTime} / ${time} = ${timeRatio} (reference time / LLM time)
  Score: ${score} (average of distance and time ratios)

  Scoring is based on the ratio of the LLM's distance and time to the reference route.
  The score is the average of the distance and time ratios.

  The score is 1 if the LLM's distance and time are the same as the reference route.
  A score > 1 indicates the LLM route is more performant (shorter distance and/or time).
  A score < 1 indicates the LLM route is less performant (longer distance and/or time).

  Format:
  {
    "reason": "xxx"
  }
  `;
}