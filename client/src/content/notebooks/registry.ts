/**
 * Discovers every notebook under ./<book-id>/ automatically.
 *   <book-id>/notebook.ts          cover + ordered page list (loaded up front)
 *   <book-id>/pages/<page-id>.ts   one page's content (loaded on demand, its own chunk)
 * A page listed in notebook.ts without a file is drawn as a template from its outline.
 */
import { useEffect, useState } from 'react';
import { PILLARS } from '@/content/pillars';
import type { Notebook, NotebookDef, NotebookPage, PageContent } from './types';

const bookMods = import.meta.glob<{ default: NotebookDef }>('./*/notebook.ts', { eager: true });
const pageLoaders = import.meta.glob<{ default: PageContent }>('./*/pages/*.ts');

/** "./dbms/pages/keys.ts" → "dbms/keys" */
const pageKey = (path: string) => {
  const parts = path.split('/');
  return `${parts[1]}/${parts[3].replace(/\.ts$/, '')}`;
};
const loaders = new Map(Object.entries(pageLoaders).map(([path, load]) => [pageKey(path), load]));

export const COVER_ID = 'cover';

function build(): Notebook[] {
  return Object.entries(bookMods)
    .map(([path, mod]) => {
      const def = mod.default;
      const dir = path.split('/')[1];
      if (import.meta.env.DEV && def.id !== dir) console.warn(`[notebooks] ${dir}/notebook.ts has id "${def.id}" — use the folder name`);
      const listed = new Set(def.pages.map((p) => p.id));
      if (import.meta.env.DEV)
        for (const key of loaders.keys()) {
          const [book, page] = key.split('/');
          if (book === dir && !listed.has(page)) console.warn(`[notebooks] ${dir}/pages/${page}.ts is not listed in notebook.ts`);
        }
      const pages: NotebookPage[] = [
        { id: COVER_ID, title: 'Cover', num: 1, written: true },
        ...def.pages.map((p, i) => ({ ...p, num: i + 2, written: loaders.has(`${dir}/${p.id}`) })),
      ];
      return { ...def, pages };
    })
    .sort((a, b) => topicRank(a) - topicRank(b) || (a.order ?? 50) - (b.order ?? 50) || a.title.localeCompare(b.title));
}

const topicRank = (b: NotebookDef) => PILLARS.findIndex((p) => p.id === b.pillar);

export const NOTEBOOKS: Notebook[] = build();

export const getNotebook = (id: string | undefined) => NOTEBOOKS.find((b) => b.id === id);

/** How far the writing has got: content pages written out of content pages listed (the cover doesn't count). */
export function writtenPages(book: Notebook) {
  const content = book.pages.filter((p) => p.id !== COVER_ID);
  const written = content.filter((p) => p.written).length;
  const status = written === 0 ? 'outline' : written === content.length ? 'complete' : 'progress';
  return { written, total: content.length, status } as const;
}

/* ---------------- loading page content ---------------- */

const loaded = new Map<string, PageContent>();
const pending = new Map<string, Promise<PageContent>>();

export const peekPage = (bookId: string, pageId: string) => loaded.get(`${bookId}/${pageId}`);

export function loadPage(bookId: string, pageId: string): Promise<PageContent> {
  const key = `${bookId}/${pageId}`;
  const done = loaded.get(key);
  if (done) return Promise.resolve(done);
  let p = pending.get(key);
  if (!p) {
    const load = loaders.get(key);
    if (!load) return Promise.reject(new Error(`No page file for ${key}`));
    p = load().then((m) => {
      loaded.set(key, m.default);
      pending.delete(key);
      return m.default;
    });
    p.catch(() => pending.delete(key));
    pending.set(key, p);
  }
  return p;
}

/** Fetch every written page of a notebook in the background so flipping is instant. */
export function warmNotebook(book: Notebook) {
  for (const pg of book.pages) if (pg.written && pg.id !== COVER_ID) loadPage(book.id, pg.id).catch(() => {});
}

export type PageState = { status: 'ready'; page: PageContent } | { status: 'loading' } | { status: 'error' };

export function usePageContent(bookId: string, pageId: string, enabled: boolean): PageState {
  const peek = enabled ? peekPage(bookId, pageId) : undefined;
  const [state, setState] = useState<PageState>(peek ? { status: 'ready', page: peek } : { status: 'loading' });
  useEffect(() => {
    if (!enabled) return;
    const now = peekPage(bookId, pageId);
    if (now) return setState({ status: 'ready', page: now });
    let live = true;
    setState({ status: 'loading' });
    loadPage(bookId, pageId).then(
      (page) => live && setState({ status: 'ready', page }),
      () => live && setState({ status: 'error' }),
    );
    return () => {
      live = false;
    };
  }, [bookId, pageId, enabled]);
  return peek ? { status: 'ready', page: peek } : state;
}
