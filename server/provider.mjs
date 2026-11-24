/**
 * Model providers for the tutor / mentor proxy.
 *
 * A provider is `async ({ apiKey, system, user, messages }) => string`.
 *  - `messages` (optional) is a chat history: [{ role: 'user' | 'assistant', content }].
 *  - `user` is the single-turn fallback used by the hint ladder and explain-back grading.
 *
 * The learner's key is passed per request and is NEVER logged or stored.
 *
 * Two real providers, picked per request from the key itself (`providerNameForKey`):
 *   xai-...   → xAI Grok  (OpenAI-style Chat Completions)
 *   otherwise → Anthropic Claude
 * Force one with TUTOR_PROVIDER=xai|anthropic.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

const XAI_URL = 'https://api.x.ai/v1/chat/completions';

export const DEFAULT_MODEL = 'claude-sonnet-5-5';
export const DEFAULT_XAI_MODEL = 'grok-4.7';

/** An error whose message is safe to show to the learner. */
export class ProviderError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'ProviderError';
    this.status = status;
  }
}

export function anthropicProvider({ model = process.env.TUTOR_MODEL_ANTHROPIC || DEFAULT_MODEL, maxTokens = 900, timeoutMs = 30000 } = {}) {
  return async function anthropic({ apiKey, system, user, messages }) {
    const history = messages?.length ? messages : [{ role: 'user', content: user }];
    let res;
    try {
      res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: history }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      if (err?.name === 'TimeoutError') throw new ProviderError('The model took too long to answer. Try again.', 504);
      throw new ProviderError('Could not reach the model provider.', 502);
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new ProviderError('The API key was rejected. Check it in Dashboard settings.', 401);
      }
      if (res.status === 429) throw new ProviderError('The model provider is rate limiting this key. Wait a moment.', 429);
      throw new ProviderError(`The model provider returned an error (${res.status}).`, 502);
    }

    const data = await res.json();
    const text = (data.content ?? [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    if (!text) throw new ProviderError('The model returned an empty answer. Try again.', 502);
    return text;
  };
}

/** xAI Grok through its OpenAI-style Chat Completions endpoint. */
export function xaiProvider({ model = process.env.TUTOR_MODEL_XAI || DEFAULT_XAI_MODEL, maxTokens = 4000, timeoutMs = 60000 } = {}) {
  return async function xai({ apiKey, system, user, messages }) {
    const history = messages?.length ? messages : [{ role: 'user', content: user }];
    let res;
    try {
      res = await fetch(XAI_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        // Grok 4.x reasons before it answers, and those tokens count toward the cap: leave room for both.
        body: JSON.stringify({ model, max_completion_tokens: maxTokens, messages: [{ role: 'system', content: system }, ...history] }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      if (err?.name === 'TimeoutError') throw new ProviderError('Grok took too long to answer. Try again.', 504);
      throw new ProviderError('Could not reach xAI.', 502);
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new ProviderError('xAI rejected the API key. Check it in Dashboard settings.', 401);
      if (res.status === 404) throw new ProviderError(`xAI does not know the model "${model}" for this key. Set TUTOR_MODEL_XAI.`, 502);
      if (res.status === 429) throw new ProviderError('xAI is rate limiting this key. Wait a moment.', 429);
      throw new ProviderError(`xAI returned an error (${res.status}).`, 502);
    }

    const data = await res.json();
    const text = String(data.choices?.[0]?.message?.content ?? '').trim();
    if (!text) throw new ProviderError('Grok returned an empty answer. Try again.', 502);
    return text;
  };
}

/** xAI keys start with "xai-"; anything else is treated as an Anthropic key. */
export function providerNameForKey(apiKey, forced = process.env.TUTOR_PROVIDER) {
  if (forced === 'xai' || forced === 'anthropic') return forced;
  return /^xai-/i.test(apiKey) ? 'xai' : 'anthropic';
}

/** The real provider: chooses xAI or Anthropic per request, from the key the learner sent. */
export function autoProvider() {
  const providers = { xai: xaiProvider(), anthropic: anthropicProvider() };
  return (args) => providers[providerNameForKey(args.apiKey)](args);
}

/** Offline stand-in for local development: `TUTOR_MOCK=1 npm run dev:server`. Needs no key. */
export async function mockProvider({ system, user, messages }) {
  if (system.includes('MENTOR')) {
    const last = messages?.[messages.length - 1]?.content ?? '';
    return `(demo mentor) You asked: "${last.slice(0, 120)}".\n\nSet \`TUTOR_MOCK\` off and add an API key to get real answers.`;
  }
  if (/Grade this explanation/.test(user)) {
    const m = user.match(/Student's explanation: "([\s\S]*?)"\n/);
    const ok = (m?.[1] ?? '').length > 20;
    return JSON.stringify({ result: ok ? 'pass' : 'needs-work', feedback: ok ? 'Clear connection to the concept.' : 'Say a bit more about why.' });
  }
  const level = Number(user.match(/Requested hint level: (\d)/)?.[1] ?? 1);
  if (level === 1) return 'Look at how the data flows in the diagram. What value do you expect before the operation completes?\n\nIn your own words, why does this happen?';
  if (level === 2) return 'Revisit the diagram step for this concept. Where does the pending work wait?\n\nIn your own words, why does this matter?';
  if (level === 3) return 'Try this outline:\n```js\n// wrap the operation\nconst result = ...\n```\nWhat does each line return?';
  return 'Check the logic in your implementation against the diagram step.';
}
