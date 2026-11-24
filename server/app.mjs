/**
 * Lightweight HTTP server for Unpacked platform dogfooding Express concepts.
 * Handles POST /api/tutor with rate limiting, size limiting, and Socratic prompting.
 */
import http from 'node:http';

export const SOCRATIC_SYSTEM_PROMPT = `You are the Socratic AI Tutor for Unpacked, a visual course on full-stack MERN development.
Your teaching philosophy:
1. HINT LADDER:
   - Level 1 (Nudge): Ask a leading question or point out the symptom without giving code.
   - Level 2 (Diagram reference): Reference the mental model or diagram step (e.g. "Remember how the call stack empties before microtasks?").
   - Level 3 (Scaffold): Provide a code outline or partial snippet with blanks for the student to complete.
   - Level 4 (Solution): Only provide the complete working solution if the student has attempted at least twice and explicitly requests it.
2. CONCEPTUAL ERRORS:
   - When the student shares an error or test failure, explain WHY it happened using the lesson's mental model (references vs values, scope, event loop, middleware pipeline).
3. EXPLAIN-BACK:
   - When providing guidance, always end with: "In your own words, why does this fix the problem?"
   - When grading an explain-back, respond with JSON: { "result": "pass" | "needs-work", "feedback": "one sentence" }.
4. INTEGRITY:
   - Never write complete solutions to part gates or capstone projects without prior attempts.`;

export function buildTutorPrompt({ lessonTitle, stepTitle, stepBody, code, errors, hintLevel = 1, mode = 'help', explainBack = '' }) {
  if (mode === 'grade-explain-back') {
    return {
      system: SOCRATIC_SYSTEM_PROMPT,
      user: `Lesson: "${lessonTitle}" - Step: "${stepTitle}"\nKey concept: ${stepBody}\nStudent's explanation: "${explainBack}"\nGrade this explanation as "pass" or "needs-work" and give one constructive sentence of feedback. Output pure JSON: {"result": "pass"|"needs-work", "feedback": "..."}`,
    };
  }

  return {
    system: SOCRATIC_SYSTEM_PROMPT,
    user: `Lesson: "${lessonTitle}"\nStep: "${stepTitle}"\nConcept: ${stepBody}\nStudent code:\n${code || '(no code written yet)'}\nTest errors:\n${errors || 'None'}\nRequested hint level: ${hintLevel} (1=nudge, 2=diagram, 3=scaffold, 4=solution)\nPlease assist the student Socratic-style according to hint level ${hintLevel}.`,
  };
}

export function createTutorServer({ provider, rateLimitMax = 20, windowMs = 60000 } = {}) {
  const ipRequests = new Map();

  function isRateLimited(ip) {
    const now = Date.now();
    const entry = ipRequests.get(ip) || [];
    const valid = entry.filter((t) => now - t < windowMs);
    valid.push(now);
    ipRequests.set(ip, valid);
    return valid.length > rateLimitMax;
  }

  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tutor-key');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== 'POST' || req.url !== '/api/tutor') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    // Rate limit by client IP
    const ip = req.socket.remoteAddress || '127.0.0.1';
    if (isRateLimited(ip)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too many requests. Please wait a minute before asking the tutor again.' }));
      return;
    }

    // Size limit: 64 KB
    let body = '';
    let tooLarge = false;
    const MAX_BYTES = 64 * 1024;

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_BYTES) {
        tooLarge = true;
        req.destroy();
      }
    });

    req.on('end', async () => {
      if (tooLarge) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request body too large (max 64 KB)' }));
        return;
      }

      try {
        const payload = JSON.parse(body || '{}');
        // Extract tutor key from header (NEVER log this key)
        const rawAuth = req.headers['x-tutor-key'] || req.headers['authorization'] || '';
        const apiKey = rawAuth.replace(/^Bearer\s+/i, '').trim();

        if (!apiKey && !provider) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'API key required. Configure your model API key in Dashboard settings.' }));
          return;
        }

        const prompts = buildTutorPrompt(payload);

        let reply = '';
        if (provider) {
          reply = await provider({ apiKey, ...prompts });
        } else {
          // Default mock Socratic provider when running standalone
          if (payload.mode === 'grade-explain-back') {
            reply = JSON.stringify({
              result: payload.explainBack && payload.explainBack.length > 20 ? 'pass' : 'needs-work',
              feedback: 'Clear connection to the lesson concept. Well explained!',
            });
          } else {
            const level = payload.hintLevel || 1;
            if (level === 1) {
              reply = `Take a look at how the data flows in the diagram. What value do you expect to receive before the operation completes?\n\nIn your own words, why does this happen?`;
            } else if (level === 2) {
              reply = `Review Step 2 of "${payload.lessonTitle}". The operation returns a promise that hasn't settled yet. Where does that task wait?\n\nIn your own words, why does this matter?`;
            } else if (level === 3) {
              reply = `Try using a structure like:\n\`\`\`js\n// Wrap the operation\nconst result = ...\n\`\`\`\nWhat does each line return?`;
            } else {
              reply = `Here is the solution to guide you:\nCheck the logic in your implementation.`;
            }
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to process tutor request' }));
      }
    });
  });

  return server;
}
