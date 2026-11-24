import { box, cols, definePage, exam, full, note, nums, row, sec, sketch, table, ul } from '../../dsl';
import type { SketchEdge, SketchNode } from '../../types';

const key = (id: string, x: number, y: number, text: string, tone?: SketchNode['tone'], w = 64): SketchNode => ({
  id,
  x,
  y,
  w,
  h: 30,
  text,
  tone,
  bold: true,
  size: 13.5,
});
const leaves: [string, number, string][] = [
  ['l1', 40, '5 | 8'],
  ['l2', 122, '10 | 15'],
  ['l3', 210, '20 | 25'],
  ['l4', 292, '30 | 35'],
  ['l5', 380, '40 | 45'],
  ['l6', 462, '50 | 60'],
];
const bplus = sketch(
  {
    w: 504,
    h: 196,
    alt: 'B+ tree: root 20 | 40; internal nodes 10, 30, 50; six linked leaves from 5 | 8 to 50 | 60',
    nodes: [
      key('r', 252, 22, '20 | 40', 'blue', 84),
      { id: 'rl', shape: 'text', x: 302, y: 22, text: 'Root', anchor: 'start', size: 13 },
      key('i1', 81, 92, '10', 'yellow', 52),
      key('i2', 251, 92, '30', 'yellow', 52),
      key('i3', 421, 92, '50', 'yellow', 52),
      ...leaves.map(([id, x, t]) => key(id, x, 160, t, 'green', 66)),
      { id: 'll', shape: 'text', x: 252, y: 189, text: 'leaf nodes: keys + data pointers, linked left → right', size: 12 },
    ],
    edges: [
      { from: 'r', to: 'i1' },
      { from: 'r', to: 'i2' },
      { from: 'r', to: 'i3' },
      { from: 'i1', to: 'l1' },
      { from: 'i1', to: 'l2' },
      { from: 'i2', to: 'l3' },
      { from: 'i2', to: 'l4' },
      { from: 'i3', to: 'l5' },
      { from: 'i3', to: 'l6' },
      ...leaves.slice(0, -1).map(([id], i): SketchEdge => ({ from: id, to: leaves[i + 1][0] })),
    ],
  },
  'Search 35: root (20 ≤ 35 < 40) → 30 → leaf 30 | 35. A range scan just walks the leaf links.',
);

export default definePage({
  rows: [
    row(
      sec(
        'File Organization in DBMS',
        ul('__File organization__ = how records are arranged in files on disk.', 'It decides search speed, insert speed and space used.'),
        table(
          ['Type', 'How', 'Good', 'Bad'],
          [
            ['Heap', 'records in no order', 'fast insert, simple', 'search = full scan'],
            ['Sequential', 'sorted by a key', 'fast ordered / range reads', 'inserts need re-sorting'],
            ['Hashed', 'hash(key) picks the bucket', 'very fast equality search', 'no range search; collisions'],
            ['Indexed (ISAM)', 'sorted file + index', 'fast search and ranges', 'extra space for the index'],
            ['Clustered', 'related records stored together', 'fast joins on that key', 'slow for other access'],
          ],
        ),
      ),
      sec(
        'Indexing in DBMS',
        ul('An __index__ maps a __search key__ to where the record lives.', 'Fewer __disk I/Os__ → faster queries.'),
        table(
          ['Type', 'Meaning'],
          [
            ['Primary', 'on the ordering key of a sorted file'],
            ['Secondary', 'on a non-ordering (often non-key) column'],
            ['Clustered', 'table rows stored in index order'],
            ['Non-clustered', 'stored apart from the rows, points to them'],
          ],
        ),
        cols([box('**Dense** index:', 'an entry for __every__ record')], [box('**Sparse** index:', 'an entry for __some__ records', '(one per block)')]),
      ),
      [1.15, 1],
    ),
    row(
      sec(
        'B+ Tree Index',
        ul(
          'The most common index structure in DBMS.',
          'Always __balanced__: every leaf is at the same depth, so search is __O(log n)__.',
          'Internal nodes hold only __keys__, as signposts.',
          'All data pointers sit in the __leaves__, and the leaves are __linked__ for fast range scans.',
        ),
        bplus,
      ),
      [
        sec(
          'Hash Indexing',
          ul(
            'A hash function h(key) gives the __bucket address__ directly.',
            'Equality search in about __O(1)__.',
            '__Collisions__ (two keys, one bucket) are handled by chaining or open addressing.',
            'Useless for ranges like `Age BETWEEN 18 AND 22`.',
          ),
          sketch({
            w: 330,
            h: 120,
            nodes: [
              { id: 'k', shape: 'text', x: 48, y: 60, text: 'RollNo = 42', size: 14, bold: true },
              { id: 'h', x: 162, y: 60, w: 74, h: 36, text: 'h(key)', tone: 'yellow', bold: true },
              { id: 'b0', x: 278, y: 20, w: 92, h: 28, text: 'bucket 0', size: 13 },
              { id: 'b1', x: 278, y: 60, w: 92, h: 28, text: 'bucket 1 ✓', size: 13, tone: 'green', bold: true },
              { id: 'b2', x: 278, y: 100, w: 92, h: 28, text: 'bucket 2', size: 13 },
            ],
            edges: [{ from: 'k', to: 'h' }, { from: 'h', to: 'b1' }],
          }),
        ),
        sec(
          'B+ Tree vs Hash Index',
          table(
            ['Feature', 'B+ Tree', 'Hash Index'],
            [
              ['Search type', 'equality + range', 'equality only'],
              ['Structure', 'balanced tree', 'hash table'],
              ['Speed', 'O(log n)', '~O(1)'],
              ['ORDER BY / ranges', 'yes', 'no'],
              ['Usage', 'the default almost everywhere', 'exact-match lookups'],
            ],
          ),
        ),
      ],
      [1.15, 1],
    ),
    row(
      [
        sec(
          'Database Recovery',
          ul(
            '__Recovery__ brings the database back to a __consistent__ state after a failure.',
            'Committed work must survive (__durability__); unfinished work must vanish (__atomicity__).',
          ),
        ),
        sec(
          'Types of Failures',
          table(
            ['Failure', 'Cause', 'What is lost'],
            [
              ['Transaction failure', 'logical error, bad input, deadlock victim', 'that one transaction'],
              ['System crash', 'power cut, OS / DBMS crash', 'main memory (disk is fine)'],
              ['Media failure', 'disk crash, corruption', 'data on disk: restore from backup'],
            ],
          ),
        ),
        sec(
          'Write-Ahead Logging (WAL)',
          ul('The log record reaches stable storage __before__ the data page itself does.'),
          nums(
            'The __old value__ (before-image) is logged, so the change can be __undone__.',
            'The __new value__ (after-image) is logged, so it can be __redone__.',
            'The commit record is flushed before `COMMIT` returns.',
          ),
        ),
      ],
      [
        sec(
          'Recovery Techniques',
          table(
            ['Technique', 'Idea'],
            [
              ['Log-based recovery', 'record every change in a log (old + new value)'],
              ['Undo', 'roll back __uncommitted__ transactions using old values'],
              ['Redo', 're-apply __committed__ transactions using new values'],
              ['Checkpointing', 'save a consistent point so recovery starts later'],
              ['Shadow paging', 'write to page copies, switch them in on commit'],
              ['Backups', 'full / incremental copies for media failure'],
            ],
          ),
          note('Rule after a crash:', ul('Log has <T start> and <T commit> → **REDO** T.', 'Log has <T start> but no commit → **UNDO** T.')),
        ),
        sec(
          'Checkpointing',
          ul(
            'A __checkpoint__ writes all changed pages to disk and notes it in the log.',
            'Recovery only reads the log __after__ the last checkpoint, which is much faster.',
            'Types: **consistent** (pause, then save) and **fuzzy** (save while work continues).',
          ),
        ),
      ],
    ),
    full(
      exam(
        'Indexes speed up reads but cost space and slow down writes.',
        'B+ tree: balanced, linked leaves, great for range queries.',
        'Hash index: fastest for equality, no ranges.',
        'Undo uncommitted work, redo committed work.',
        'WAL: write the log first, the data later.',
        'Checkpoints shorten recovery time.',
      ),
    ),
  ],
  quote: 'Find it fast, and never lose a committed change.',
});
