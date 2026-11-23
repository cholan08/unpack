/**
 * Scaffold a lesson:  npm run new:lesson -- <course-id> <lesson-id>
 * The lesson must already be listed (id + title) in src/content/courses/<course>/course.ts.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const [course, id] = process.argv.slice(2);
if (!course || !id) {
  console.error('Usage: npm run new:lesson -- <course-id> <lesson-id>');
  process.exit(1);
}
const courseFile = `src/content/courses/${course}/course.ts`;
const file = `src/content/courses/${course}/lessons/${id}.ts`;
if (!existsSync(courseFile)) throw new Error(`No course at ${courseFile} — run npm run new:course first.`);
if (existsSync(file)) throw new Error(`${file} already exists.`);
if (!readFileSync(courseFile, 'utf8').includes(`id: '${id}'`)) console.warn(`⚠ Add { id: '${id}', title: '…' } to a part in ${courseFile}.`);

writeFileSync(
  file,
  `import { box, defineLesson, flow, link } from '@/content/dsl';

/* ---------- layout ---------- */
const a = box(250, 300, 'Client', { icon: 'browser', tone: 'client', w: 200 });
const b = box(750, 300, 'Server', { icon: 'server', tone: 'server', w: 200 });
const links = [link('a', 'b')];

export default defineLesson({
  goals: [{ text: 'What this lesson teaches', step: 2 }],
  steps: [
    {
      short: 'Setup',
      beat: 'setup',
      title: 'Set the scene',
      body: ['Describe the situation the learner is in.'],
      scene: { nodes: { a, b }, links },
    },
    {
      short: 'Problem',
      beat: 'problem',
      title: 'Show what goes wrong',
      body: ['Make the pain visible in the diagram.'],
      scene: { nodes: { a, b: { ...b, state: 'error' } }, links, flows: [flow(['a', 'b'], { fail: true })] },
    },
    {
      short: 'Fix',
      beat: 'solution',
      title: 'Show the fix',
      body: ['Explain the idea, then show the code.'],
      code: { file: 'example.js', lang: 'js', code: "console.log('hello');", hl: [1] },
      scene: { nodes: { a, b }, links, flows: [flow(['a', 'b'], { back: 'res' })] },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Recap',
      body: ['Three short sentences the learner should remember.'],
      scene: { nodes: { a, b }, links, flows: [flow(['a', 'b'], { back: 'res' })] },
    },
  ],
});
`,
);
console.log(`✓ Created ${file}`);
console.log(`  Next: give its course.ts entry minutes, level and summary, then npm run dev and npm run qa -- ${course} ${id}`);
