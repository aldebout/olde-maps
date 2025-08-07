Ever stopped to ask an old fella for directions? This is the same experience, powered by Mastra.

# Olde Maps - AI Directions Assistant with Mastra

A whimsical AI directions assistant that combines modern AI capabilities with folksy charm. Built on Mastra's agent architecture, this fella provides step-by-step navigation that is charming but often wildly inaccurate.

This is because it relies entirely on Wikipedia pages for navigation: no Google Maps, no old-time paper maps with vision. Get ready for the trip of a lifetime when you just wanted to find the next rest stop.

But do not worry: a bleeding-edge scorer measures how much the assistant has messed up.

## Features

### Agent-as-tool System
- **Old Fella Agent**: Folksy character who transforms technical directions into warm, story-filled guidance with local color and personal anecdotes
- **Directions Agent**: Wikipedia-driven assistant that provides step-by-step directions using Wikipedia data

### Wikipedia Integration
- Custom high-performance Wikipedia search tool
- Page content extraction and section analysis

### Google Maps integration
- Routing API
  
### Advanced Evaluation & Scoring
- **Maps Performance Scorer**: Compares generated directions against Google Maps reference data for performance validation
- **Tool Hallucination Scorer**: Ensures agents only use verified information from their available tools
- Real-time scoring using the agent scorer integration

## How to Use

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

### Interaction Examples

**Research-Driven Directions:**
Ask the Directions Agent for precise, Wikipedia-backed route information with specific highway numbers, landmarks, and geographical details.

**Folksy Guidance:**
Engage with the Old Fella Agent for the same directions delivered with warmth, local stories, and colorful personality - perfect for those who prefer human-touch guidance.

## Required Environment Variables

The project uses OpenAI models for AI functionality and Google Maps for route scoring.

Duplicate `.env.example` to `.env` and fill it out:

```
OPENAI_API_KEY="your-openai-api-key"
GOOGLE_MAPS_API_KEY="google-maps-key"
```

You need to [enable the Routes API](https://developers.google.com/maps/documentation/routes/get-api-key?setupProd=enable) first.

> You can leave the Google API key empty and performance scoring will be deactivated.

## Dependencies

### Core Framework
- `@mastra/core`: Latest Mastra framework with agent capabilities
- `@mastra/evals`: Evaluation and scoring system
- `@mastra/memory`: Agent memory management
- `@mastra/libsql`: Database storage for telemetry and evals
- `@mastra/loggers`: Structured logging with Pino

## Project Structure

```
src/mastra/
├── agents/
│   ├── directions-agent.ts    # Wikipedia-powered directions
│   └── old-fella-agent.ts     # Personality-driven guidance
├── tools/
│   ├── directions-tool.ts     # Agent-as-tool
│   └── wikipedia/             # Wikipedia integration tools
├── scorers/
│   ├── mapsPerformance/       # Google Maps performance validation
│   └── toolHallucination/     # Knowledge verification
└── index.ts                   # Mastra configuration
```
