/**
 * A problem brief's working notes and its discovery interview, kept in this browser per brief.
 * (Stages ticked and "design defended" live with the learner's progress, because levels read them.)
 *
 * The interview: the learner talks to the client, played by the AI mentor through the same proxy
 * (`mode: "client"` on POST /api/tutor) with the brief's persona and facts.
 */
import { useSyncExternalStore } from 'react';
import type { Brief } from '@/content/briefs';
import { MENTOR_NAME } from '@/lib/mentor';

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
  error?: boolean;
}

export interface BriefWork {
  notes: Record<string, string>;
  chat: ChatTurn[];
}

const KEY = (id: string) => `unpacked:brief:${id}`;
const EMPTY: BriefWork = { notes: {}, chat: [] };
const cache = new Map<string, BriefWork>();
const busy = new Set<string>();
const subs = new Set<() => void>();
const emit = () => subs.forEach((fn) => fn());

function read(id: string): BriefWork {
  const hit = cache.get(id);
  if (hit) return hit;
  let work = EMPTY;
  try {
    const raw = localStorage.getItem(KEY(id));
    const v = raw ? (JSON.parse(raw) as Partial<BriefWork>) : undefined;
    if (v && typeof v === 'object') work = { notes: v.notes && typeof v.notes === 'object' ? v.notes : {}, chat: Array.isArray(v.chat) ? v.chat : [] };
  } catch {
    /* start empty */
  }
  cache.set(id, work);
  return work;
}

function write(id: string, work: BriefWork) {
  cache.set(id, work);
  try {
    localStorage.setItem(KEY(id), JSON.stringify(work));
  } catch {
    /* kept for this visit only */
  }
  emit();
}

const subscribe = (fn: () => void) => {
  subs.add(fn);
  return () => subs.delete(fn);
};

export const useBriefWork = (id: string) => useSyncExternalStore(subscribe, () => read(id));
export const useInterviewBusy = (id: string) => useSyncExternalStore(subscribe, () => busy.has(id));

export function setNote(id: string, key: string, text: string) {
  const w = read(id);
  write(id, { ...w, notes: { ...w.notes, [key]: text.slice(0, 4000) } });
}

export function clearInterview(id: string) {
  write(id, { ...read(id), chat: [] });
}

/** Ask the client one question; their reply (or a readable error) joins the transcript. */
export async function askClient(brief: Brief, text: string, apiKey: string) {
  const q = text.trim();
  if (!q || busy.has(brief.id)) return;
  const before = read(brief.id);
  const history: ChatTurn[] = [...before.chat.filter((t) => !t.error), { role: 'user', text: q }];
  write(brief.id, { ...before, chat: history });
  busy.add(brief.id);
  emit();
  let reply: ChatTurn;
  try {
    const res = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tutor-key': apiKey },
      body: JSON.stringify({
        mode: 'client',
        messages: history.slice(-16).map((t) => ({ role: t.role, content: t.text })),
        client: { ...brief.client, ask: brief.ask, knows: brief.knows, onlyIfAsked: brief.onlyIfAsked, constraints: brief.constraints },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `The server answered ${res.status}.`);
    reply = { role: 'assistant', text: String(data.reply ?? '') };
  } catch (err) {
    const offline = err instanceof TypeError;
    reply = {
      role: 'assistant',
      error: true,
      text: offline ? `I couldn’t reach ${MENTOR_NAME}’s server. Start it with \`npm run dev:server\`, then ask again.` : (err as Error).message,
    };
  }
  busy.delete(brief.id);
  const now = read(brief.id);
  write(brief.id, { ...now, chat: [...now.chat, reply] });
}
