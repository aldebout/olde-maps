import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { PinoLogger } from "@mastra/loggers";
import { directionsAgent } from "./agents/directions-agent";
import { oldFellaAgent } from "./agents/old-fella-agent";

export const mastra = new Mastra({
  agents: { directionsAgent, oldFellaAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: "file:./mastra.db", // path is relative to the .mastra/output directory
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
