// The ask engine answers a natural-language question about the user's network.
// Like the intro engine, it is source-agnostic and carries no API keys: it
// reasons over a normalized `Contact[]` roster (reused from the intro engine)
// and calls an injected `complete` function to reach the LLM.

/** One person the answer refers to, with the reason they fit the question. */
export type AskMatch = {
  /** An id present in the roster the engine was given. */
  id: string;
  /** One sentence: why this person answers the question. */
  reason: string;
};

/** The engine's result: a written answer plus the people it refers to. */
export type AskAnswer = {
  /** A short, direct answer grounded in the network. */
  answer: string;
  /** The people the answer refers to, best-first. Empty when nobody fits. */
  matches: AskMatch[];
};

export type AskNetworkOptions = {
  /** Maximum contacts to include in the roster sent to the LLM. Defaults to 200. */
  maxRosterSize?: number;
};
