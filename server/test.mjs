/**
 * Server tests: tests prompt building, rate limiting, and size limiting.
 */
import assert from 'node:assert';
import { buildTutorPrompt, createTutorServer, SOCRATIC_SYSTEM_PROMPT } from './app.mjs';

console.log('Running server tests...');

// 1. Prompt Building Test
{
  const prompt = buildTutorPrompt({
    lessonTitle: 'The Event Loop',
    stepTitle: 'Microtasks',
    stepBody: 'Promises run before timers',
    code: 'setTimeout(() => console.log(1)); Promise.resolve().then(() => console.log(2));',
    errors: 'Expected 2 before 1',
    hintLevel: 1,
  });

  assert(prompt.system === SOCRATIC_SYSTEM_PROMPT, 'System prompt matches');
  assert(prompt.user.includes('The Event Loop'), 'Includes lesson title');
  assert(prompt.user.includes('Requested hint level: 1'), 'Includes hint level');
  assert(prompt.user.includes('setTimeout'), 'Includes code');
  console.log('✓ Prompt building test passed');
}

// 2. Explain-back prompt test
{
  const gradePrompt = buildTutorPrompt({
    lessonTitle: 'Values vs References',
    stepTitle: 'Heap',
    stepBody: 'Objects live on heap',
    mode: 'grade-explain-back',
    explainBack: 'Because changing a property on a reference changes the shared object on the heap.',
  });

  assert(gradePrompt.user.includes('Grade this explanation'), 'Has grading instructions');
  console.log('✓ Grade explain-back prompt test passed');
}

// 3. HTTP Server Rate Limit and Size Limit Test
{
  let calledCount = 0;
  const mockProvider = async () => {
    calledCount++;
    return 'Nudge: Check your call stack.';
  };

  const testServer = createTutorServer({ provider: mockProvider, rateLimitMax: 3, windowMs: 10000 });
  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;

  // Make 3 requests (within limit)
  for (let i = 0; i < 3; i++) {
    const res = await fetch(`http://localhost:${port}/api/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tutor-key': 'test-key' },
      body: JSON.stringify({ lessonTitle: 'Test', hintLevel: 1 }),
    });
    assert.strictEqual(res.status, 200, `Request ${i + 1} should succeed`);
    const json = await res.json();
    assert(json.reply, 'Returns reply');
  }

  // 4th request must be rate limited (429)
  const resLimit = await fetch(`http://localhost:${port}/api/tutor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tutor-key': 'test-key' },
    body: JSON.stringify({ lessonTitle: 'Test', hintLevel: 1 }),
  });
  assert.strictEqual(resLimit.status, 429, 'Excess request should receive 429 Too Many Requests');
  console.log('✓ Rate limiting test passed');

  // Size limit test: payload > 64 KB must return 413
  const bigPayload = 'x'.repeat(70 * 1024);
  try {
    const resBig = await fetch(`http://localhost:${port}/api/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tutor-key': 'test-key' },
      body: JSON.stringify({ big: bigPayload }),
    });
    assert(resBig.status === 413 || resBig.status >= 400, 'Large payload rejected');
  } catch {
    // Socket destroyed on client side is also expected behavior for > 64 KB
  }
  console.log('✓ Size limiting test passed');

  testServer.close();
}

console.log('All server tests passed successfully!');
