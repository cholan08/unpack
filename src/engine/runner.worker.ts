/**
 * Web Worker that safely runs learner code.
 * Receives: { _id: string; code: string; tests: { label: string; run: string }[] }
 * Sends: { _id; logs: string[]; error?: string; results: { label: string; pass: boolean; message?: string }[] }
 * Every reply echoes the request's `_id` — runner.ts ignores replies it can't match.
 */

const TIMEOUT_MS = 4000;

self.onmessage = async (e: MessageEvent) => {
  const { _id, code, tests } = e.data as { _id: string; code: string; tests: { label: string; run: string }[] };

  const logs: string[] = [];
  const results: { label: string; pass: boolean; message?: string }[] = [];
  const reply = (msg: { logs: string[]; error?: string; results: typeof results }) => self.postMessage({ _id, ...msg });

  // Capture console
  const origLog = console.log;
  const origError = console.error;
  console.log = (...args: unknown[]) => logs.push(args.map(String).join(' '));
  console.error = (...args: unknown[]) => logs.push('[error] ' + args.map(String).join(' '));

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    reply({ logs, error: '⏱ Time limit exceeded (4 seconds). Do you have an infinite loop?', results });
  }, TIMEOUT_MS);

  try {
    // Build a sandboxed scope: no DOM, no fetch, no localStorage
    const fn = new Function(
      'console',
      `"use strict";\n${code}\n`,
    );
    fn({ log: (...a: unknown[]) => logs.push(a.map(String).join(' ')), error: (...a: unknown[]) => logs.push('[error] ' + a.map(String).join(' ')) });

    if (timedOut) return;

    // Run each test
    for (const test of tests) {
      try {
        const testFn = new Function(
          'console',
          `"use strict";\n${code}\n;return (${test.run});`,
        );
        // Async tests return a promise. Wait for it: a pending promise is truthy, which would pass anything.
        // If it never settles, the 4 s timer above still fires, because awaiting leaves the event loop free.
        const passed = await testFn({ log: () => {}, error: () => {} });
        if (timedOut) return;
        results.push({ label: test.label, pass: Boolean(passed) });
      } catch (err: unknown) {
        if (timedOut) return;
        results.push({ label: test.label, pass: false, message: String(err) });
      }
      if (timedOut) return;
    }

    clearTimeout(timer);
    reply({ logs, results });
  } catch (err: unknown) {
    clearTimeout(timer);
    if (!timedOut) {
      reply({ logs, error: String(err), results });
    }
  } finally {
    console.log = origLog;
    console.error = origError;
  }
};
