/**
 * Scaffold a handwritten notebook as a template: a cover with generated doodles and an outline of
 * pages. No page content is written. Until pages/<id>.ts exists, each page shows its outline.
 *
 *   npm run new:notebook -- <book-id> "<Short title>" "<Full subject name>" <topic>
 *   npm run new:notebook -- graphql "GraphQL" "GraphQL APIs" backend
 *
 * <topic> is a pillar id from src/engine/types.ts (frontend, backend, database, devops, …).
 * The registry picks the notebook up automatically; it appears on /notebooks.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// Read the allowed topics from the PillarId type, so new topics work without editing this script.
const pillarLine = readFileSync('src/engine/types.ts', 'utf8').match(/export type PillarId =([^;]+);/);
const PILLARS = pillarLine ? [...pillarLine[1].matchAll(/'([a-z]+)'/g)].map((m) => m[1]) : [];

const [id, title, name, pillar] = process.argv.slice(2);
if (!id || !/^[a-z0-9-]+$/.test(id) || !title || !name || !PILLARS.includes(pillar)) {
  console.error('Usage: npm run new:notebook -- <book-id> "<Short title>" "<Full subject name>" <topic>');
  console.error('   e.g. npm run new:notebook -- graphql "GraphQL" "GraphQL APIs" backend');
  console.error(`   <topic> is one of: ${PILLARS.join(', ')}`);
  process.exit(1);
}
const dir = `src/content/notebooks/${id}`;
if (existsSync(dir)) throw new Error(`${dir} already exists.`);
mkdirSync(`${dir}/pages`, { recursive: true });
const q = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, '’');
const big = q(title.toUpperCase());

writeFileSync(
  `${dir}/notebook.ts`,
  `import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

// Replace every placeholder below; the shelf, cover and outline pages update as you go.
export default defineNotebook({
  id: '${id}',
  title: '${q(title)}',
  name: '${q(name)}',
  tagline: 'One sentence for the shelf: what this notebook covers.',
  color: 'blue',
  pillar: '${pillar}',
  order: 50,
  cover: {
    big: '${big}',
    full: '${q(name)}',
    cloud: ['Four short', 'lines that', 'sum up the', 'subject'],
    art: {
      topLeft: iconArt('laptop', '${q(title).slice(0, 8)}'),
      topRight: flowArt(['Step one', 'Step two', 'Step three', 'Step four']),
      left: codeArt(['a tiny snippet', 'of real code'], 'Code'),
      centre: hubArt('${q(title)}', ['Idea 1', 'Idea 2', 'Idea 3', 'Idea 4'], 'box'),
    },
    side: { title: 'Key', items: ['Item one', 'Item two', 'Item three'] },
    why: { title: 'Why ${q(title)} ?', items: ['Reason one', 'Reason two', 'Reason three'] },
    footer: 'A short motto!',
  },
  // Page 1 is the cover. Each pg() is one page: its id (and file name in pages/), its title, and the
  // sections it will cover. Write pages/<id>.ts to replace a page's outline with real notes.
  pages: [
    pg('introduction', 'Introduction to ${q(name)}', 'What it is', 'Why it matters', 'Key terms', 'How it fits the stack'),
    revision('X vs Y'),
  ],
});
`,
);

console.log(`Created ${dir}/notebook.ts → open /notebooks/${id}`);
console.log('Fill in the cover and the page outline, then write pages/<page-id>.ts one page at a time.');
