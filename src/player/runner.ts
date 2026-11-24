/**
 * Runner module — wraps the Web Worker for safe code execution.
 * This module is lazy-loaded only when a Try step is mounted.
 */
import type { RunResult } from './PracticePanel';

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    // Create worker from blob URL to stay within Vite's module graph
    worker = new Worker(new URL('../engine/runner.worker.ts', import.meta.url), { type: 'module' });
  }
  return worker;
}

export function runCode(
  code: string,
  tests: { label: string; run: string }[],
): Promise<RunResult> {
  return new Promise((resolve) => {
    const w = getWorker();
    const id = Math.random().toString(36).slice(2);

    const handler = (e: MessageEvent) => {
      if (e.data?._id !== id) return;
      w.removeEventListener('message', handler);
      resolve(e.data as RunResult);
    };

    // Fallback timeout in case the worker is unresponsive
    const fallbackTimer = setTimeout(() => {
      w.removeEventListener('message', handler);
      // Kill and recreate the worker
      w.terminate();
      worker = null;
      resolve({
        logs: [],
        error: '⏱ Code runner timed out. The page has been recovered.',
        results: tests.map((t) => ({ label: t.label, pass: false })),
      });
    }, 5500);

    w.addEventListener('message', (e: MessageEvent) => {
      if (e.data?._id !== id) return;
      clearTimeout(fallbackTimer);
      handler(e);
    });

    w.postMessage({ _id: id, code, tests });
  });
}
