/**
 * Scaffold a course:  npm run new:course -- <course-id> "Course title"
 * The registry picks it up automatically; the home page lists it.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const [id, title = 'New Course'] = process.argv.slice(2);
if (!id) {
  console.error('Usage: npm run new:course -- <course-id> "Course title"');
  process.exit(1);
}
const dir = `src/content/courses/${id}`;
if (existsSync(dir)) throw new Error(`${dir} already exists.`);
mkdirSync(`${dir}/lessons`, { recursive: true });
writeFileSync(
  `${dir}/course.ts`,
  `import { defineCourse } from '@/content/dsl';

export default defineCourse({
  id: '${id}',
  title: '${title.replace(/'/g, '’')}',
  short: '${title.replace(/'/g, '’')}',
  tagline: 'One line that says what this course is about.',
  description: 'Two sentences for the course card and course page.',
  tone: 'net',
  parts: [
    {
      id: 'basics',
      num: '01',
      title: 'Basics',
      blurb: 'What this part covers.',
      tone: 'net',
      pillar: 'frontend', // main topic: frontend | backend | database | devops (or start | projects)
      lessons: [{ id: 'first-lesson', title: 'First Lesson' }],
    },
  ],
  glossary: {},
});
`,
);
console.log(`✓ Created ${dir}/course.ts`);
console.log(`  Next: npm run new:lesson -- ${id} first-lesson, and remove "${title}" from the "Coming later" list in src/site/HomePage.tsx`);
