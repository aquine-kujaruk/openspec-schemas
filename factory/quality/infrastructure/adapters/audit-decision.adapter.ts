import { QualityException } from "../../domain/exceptions/quality.exceptions.ts";

import {
  DecisionModelUnavailable,
  decisionModelClient,
  type DecisionClient,
  type DecisionModelOptions,
} from "../../../shared/infrastructure/adapters/decision-model.adapter.ts";

export { DECISIONS_ENDPOINT, inspect, type DecisionClient, type Inspection } from "../../../shared/infrastructure/adapters/decision-model.adapter.ts";
export type OpenAiClientOptions = DecisionModelOptions;

export const openAiClient = (o: OpenAiClientOptions): DecisionClient & { requests: number } => {
  const client = decisionModelClient(o);

  return {
    get requests() {
      return client.requests;
    },
    async ask(state, questions) {
      try {
        return await client.ask(state, questions);
      } catch (e) {
        if (e instanceof DecisionModelUnavailable) throw new QualityException(e.message, { cause: e.cause });

        throw e;
      }
    },
  };
};
