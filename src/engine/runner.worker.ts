/**
 * Web Worker that safely runs learner code.
 * Receives: { code: string; tests: { label: string; run: string }[] }
 * Sends: { logs: string[]; error?: string; results: { label: string; pass: boolean; message?: string }[] }
 */

const TIMEOUT_MS = 4000;

self.onmessage = (e: MessageEvent) => {
  const { code, tests } = e.data as { code: string; tests: { label: string; run: string }[] };

  const logs: string[] = [];
  const results: { label: string; pass: boolean; message?: string }[] = [];

  // Capture console
  const origLog = console.log;
  const origError = console.error;
  console.log = (...args: unknown[]) => logs.push(args.map(String).join(' '));
  console.error = (...args: unknown[]) => logs.push('[error] ' + args.map(String).join(' '));

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    self.postMessage({ logs, error: '⏱ Time limit exceeded (4 seconds). Do you have an infinite loop?', results });
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
        const passed = testFn({ log: () => {}, error: () => {} });
        results.push({ label: test.label, pass: Boolean(passed) });
      } catch (err: unknown) {
        results.push({ label: test.label, pass: false, message: String(err) });
      }
      if (timedOut) return;
    }

    clearTimeout(timer);
    self.postMessage({ logs, results });
  } catch (err: unknown) {
    clearTimeout(timer);
    if (!timedOut) {
      self.postMessage({ logs, error: String(err), results });
    }
  } finally {
    console.log = origLog;
    console.error = origError;
  }
};
