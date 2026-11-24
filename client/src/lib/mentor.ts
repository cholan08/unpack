import { useEffect, useSyncExternalStore } from 'react';

/**
 * The AI mentor's state: one conversation that follows the learner across every page.
 * The chat lives in this browser only (localStorage). The learner's API key is sent per request
 * through the server proxy and is never stored on the server.
 */

/** The mentor's name. Change it here: the UI and the model's prompt both use it. */
export const MENTOR_NAME = 'XOLA';

export interface MentorMsg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
  /** A failed request shown in the chat. Never sent back to the model. */
  error?: boolean;
}

/** What the learner is looking at. Pages publish this with `useMentorPage`. */
export interface MentorPage {
  kind: string;
  title: string;
  stepTitle?: string;
  stepBody?: string;
  code?: string;
}

interface MentorState {
  open: boolean;
  busy: boolean;
  messages: MentorMsg[];
  page: MentorPage | null;
  /** Text to put in the composer the next time the panel shows (e.g. a question from the palette). */
  prefill: string | null;
}

const KEY = 'unpacked:mentor:v1';
const MAX_SAVED = 60;
/** Turns sent to the model with each request (the server caps this too). */
const MAX_SENT = 16;

const listeners = new Set<() => void>();

function loadMessages(): MentorMsg[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const s = JSON.parse(raw);
    if (s?.v === 1 && Array.isArray(s.messages)) {
      return s.messages.filter(
        (m: MentorMsg) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && typeof m.id === 'string',
      );
    }
  } catch {
    /* corrupt or blocked: start with an empty chat */
  }
  return [];
}

let state: MentorState = { open: false, busy: false, messages: loadMessages(), page: null, prefill: null };
let inflight: AbortController | null = null;

function set(patch: Partial<MentorState>, persist = false) {
  state = { ...state, ...patch };
  if (persist) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: 1, messages: state.messages.slice(-MAX_SAVED) }));
    } catch {
      /* storage full or blocked: the chat lasts for this session only */
    }
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => state;

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) set({ messages: loadMessages() });
  });
}

export const useMentor = () => useSyncExternalStore(subscribe, getSnapshot);

export const openMentor = () => set({ open: true });
export const closeMentor = () => set({ open: false });
export const toggleMentor = () => set({ open: !state.open });
/** Open the panel with `text` waiting in the composer, for the learner to edit and send. */
export const openMentorWith = (text: string) => set({ open: true, prefill: text });
/** The composer took the prefilled text. */
export const clearMentorPrefill = () => set({ prefill: null });

/** Pages call this to tell the mentor what is on screen. Cleared when the page unmounts. */
export function useMentorPage(page: MentorPage | null) {
  const { kind, title, stepTitle, stepBody, code } = page ?? {};
  useEffect(() => {
    if (!kind || !title) return;
    set({ page: { kind, title, stepTitle, stepBody, code } });
    return () => set({ page: null });
  }, [kind, title, stepTitle, stepBody, code]);
}

export function clearMentorChat() {
  inflight?.abort();
  inflight = null;
  set({ messages: [], busy: false }, true);
}

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export interface MentorContext {
  apiKey: string;
  /** Compact summary of the learner's progress (see site/mentorProfile.ts). */
  profile: unknown;
  /** What is on screen, including the route. */
  page: MentorPage & { path: string };
}

/** Send the learner's message (and the conversation so far) to the mentor. */
export async function askMentor(text: string, ctx: MentorContext) {
  const content = text.trim();
  if (!content || state.busy) return;

  const userMsg: MentorMsg = { id: uid(), role: 'user', text: content, ts: Date.now() };
  const history = [...state.messages, userMsg];
  set({ messages: history, busy: true }, true);

  const controller = new AbortController();
  inflight = controller;
  const sent = history
    .filter((m) => !m.error)
    .slice(-MAX_SENT)
    .map((m) => ({ role: m.role, content: m.text }));

  let reply: MentorMsg;
  try {
    const res = await fetch('/api/tutor', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'x-tutor-key': ctx.apiKey },
      body: JSON.stringify({ mode: 'mentor', mentorName: MENTOR_NAME, messages: sent, profile: ctx.profile, page: ctx.page }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `The mentor server answered ${res.status}.`);
    reply = { id: uid(), role: 'assistant', text: String(data.reply ?? ''), ts: Date.now() };
  } catch (err) {
    if (controller.signal.aborted) return; // the chat was cleared while waiting
    const offline = err instanceof TypeError;
    reply = {
      id: uid(),
      role: 'assistant',
      error: true,
      ts: Date.now(),
      text: offline ? 'I could not reach the mentor server. Start it with `npm run dev:server`, then try again.' : (err as Error).message,
    };
  }
  if (inflight === controller) inflight = null;
  set({ messages: [...state.messages, reply], busy: false }, true);
}

/** Re-ask the last question after a failed turn. */
export function retryMentor(ctx: MentorContext) {
  const msgs = state.messages;
  const last = msgs[msgs.length - 1];
  if (!last?.error) return;
  const question = [...msgs].reverse().find((m) => m.role === 'user');
  if (!question) return;
  // Remove the error and the question, then ask again so the history has no duplicate.
  const trimmed = msgs.slice(0, msgs.lastIndexOf(question));
  set({ messages: trimmed }, true);
  return askMentor(question.text, ctx);
}
