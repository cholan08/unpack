import { defineNotebook } from '../dsl';

export default defineNotebook({
  id: 'os',
  title: 'OS',
  name: 'Operating Systems',
  tagline: 'One line for the shelf: what this notebook covers.',
  color: 'green',
  cover: {
    big: 'OS',
    full: 'Operating Systems',
    cloud: ['Four short', 'lines that', 'sum up the', 'subject'],
    why: { title: 'Why OS ?', items: ['Reason one', 'Reason two', 'Reason three'] },
    footer: 'A short motto!',
  },
  // Page 1 is the cover. Each entry here needs pages/<id>.ts (missing files show "still being written").
  pages: [{ id: 'introduction', title: 'Introduction to Operating Systems' }],
});
