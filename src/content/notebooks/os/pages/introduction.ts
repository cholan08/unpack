import { definePage, exam, full, row, sec, ul } from '../../dsl';

export default definePage({
  rows: [
    row(
      sec('What is OS ?', ul('A __key idea__ in one line.', 'Another point, with **bold ink** where it matters.')),
      sec('Key Terms', ul('Term one', 'Term two')),
    ),
    full(exam('The one thing to remember for the exam.', 'And the second one.')),
  ],
  quote: 'One line to remember this page by.',
});
