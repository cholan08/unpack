/**
 * Scaffold a handwritten notebook:
 *   npm run new:notebook -- <book-id> "<Short title>" "<Full subject name>"
 *   npm run new:notebook -- os "OS" "Operating Systems"
 * The registry picks it up automatically; it appears on /notebooks.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const [id, title, name] = process.argv.slice(2);
if (!id || !/^[a-z0-9-]+$/.test(id) || !title || !name) {
  console.error('Usage: npm run new:notebook -- <book-id> "<Short title>" "<Full subject name>"');
  console.error('   e.g. npm run new:notebook -- os "OS" "Operating Systems"');
  process.exit(1);
}
const dir = `src/content/notebooks/${id}`;
if (existsSync(dir)) throw new Error(`${dir} already exists.`);
mkdirSync(`${dir}/pages`, { recursive: true });
const q = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, '’');

writeFileSync(
  `${dir}/notebook.ts`,
  `import { defineNotebook } from '../dsl';

export default defineNotebook({
  id: '${id}',
  title: '${q(title)}',
  name: '${q(name)}',
  tagline: 'One line for the shelf: what this notebook covers.',
  color: 'green',
  cover: {
    big: '${q(title)}',
    full: '${q(name)}',
    cloud: ['Four short', 'lines that', 'sum up the', 'subject'],
    why: { title: 'Why ${q(title)} ?', items: ['Reason one', 'Reason two', 'Reason three'] },
    footer: 'A short motto!',
  },
  // Page 1 is the cover. Each entry here needs pages/<id>.ts (missing files show "still being written").
  pages: [{ id: 'introduction', title: 'Introduction to ${q(name)}' }],
});
`,
);

writeFileSync(
  `${dir}/pages/introduction.ts`,
  `import { definePage, exam, full, row, sec, ul } from '../../dsl';

export default definePage({
  rows: [
    row(
      sec('What is ${q(title)} ?', ul('A __key idea__ in one line.', 'Another point, with **bold ink** where it matters.')),
      sec('Key Terms', ul('Term one', 'Term two')),
    ),
    full(exam('The one thing to remember for the exam.', 'And the second one.')),
  ],
  quote: 'One line to remember this page by.',
});
`,
);

console.log(`Created ${dir}/notebook.ts and ${dir}/pages/introduction.ts → open /notebooks/${id}`);
