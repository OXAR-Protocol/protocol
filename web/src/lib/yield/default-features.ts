/**
 * Feature keys that are on for everyone, kept beside the code they unlock so the
 * decision is reviewable and the API route isn't the only place that knows.
 *
 * Switching a key on lives HERE rather than in a Vercel env var because an env
 * change only reaches the next deployment — it is not a live switch, so code is no
 * slower and carries a commit saying why.
 */
export const DEFAULT_PUBLIC_FEATURES = ["selling-v2"] as const;
