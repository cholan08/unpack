import { definePage, exam, full, pairs, row, sec, sketch, sub, table, ul } from '../../dsl';
import type { SketchEdge, SketchNode } from '../../types';

/* ER notation legend: a symbol on the left, its meaning on the right. */
const legend: [SketchNode, string][] = [
  [{ id: 'l1', shape: 'box', x: 50, y: 0, w: 70, h: 26 }, 'Entity'],
  [{ id: 'l2', shape: 'box2', x: 50, y: 0, w: 70, h: 28 }, 'Weak Entity'],
  [{ id: 'l3', shape: 'diamond', x: 50, y: 0, w: 66, h: 32 }, 'Relationship'],
  [{ id: 'l4', shape: 'diamond2', x: 50, y: 0, w: 70, h: 34 }, 'Identifying Relationship'],
  [{ id: 'l5', shape: 'oval', x: 50, y: 0, w: 70, h: 26 }, 'Attribute'],
  [{ id: 'l6', shape: 'oval', x: 50, y: 0, w: 70, h: 26, text: 'Key', key: true, size: 12 }, 'Key Attribute (underlined)'],
  [{ id: 'l7', shape: 'oval2', x: 50, y: 0, w: 74, h: 30 }, 'Multi-valued Attribute'],
  [{ id: 'l8', shape: 'ovalDash', x: 50, y: 0, w: 70, h: 26 }, 'Derived Attribute'],
  [{ id: 'l9', shape: 'point', x: 50, y: 0 }, 'Partial Participation'],
  [{ id: 'l10', shape: 'point', x: 50, y: 0 }, 'Total Participation'],
];
const legendNodes: SketchNode[] = legend.flatMap(([n, label], i) => [
  { ...n, y: 20 + i * 36 },
  { id: `t${i}`, shape: 'text', x: 108, y: 20 + i * 36, text: label, anchor: 'start', size: 14 },
]);
legendNodes.push(
  { id: 'a9', shape: 'point', x: 16, y: 20 + 8 * 36 },
  { id: 'b9', shape: 'point', x: 84, y: 20 + 8 * 36 },
  { id: 'a10', shape: 'point', x: 16, y: 20 + 9 * 36 },
  { id: 'b10', shape: 'point', x: 84, y: 20 + 9 * 36 },
);
const legendEdges: SketchEdge[] = [
  { from: 'a9', to: 'b9', arrow: 'none' },
  { from: 'a10', to: 'b10', arrow: 'none', double: true },
];

const attr = (id: string, x: number, y: number, text: string, extra: Partial<SketchNode> = {}): SketchNode => ({
  id,
  shape: 'oval',
  x,
  y,
  w: Math.max(66, text.length * 8 + 22),
  h: 30,
  text,
  size: 13,
  ...extra,
});
const link = (from: string, to: string, extra: Partial<SketchEdge> = {}): SketchEdge => ({ from, to, arrow: 'none', ...extra });

export default definePage({
  rows: [
    row(
      sec(
        'What is the ER Model ?',
        ul(
          'The **ER Model** (Entity–Relationship model) is a __high-level conceptual__ data model.',
          'It shows real-world __entities__, their __attributes__ and the __relationships__ between them.',
          'Drawn as an __ER diagram__ in the __design phase__, before any table is created.',
          'Proposed by __Peter Chen__ in 1976.',
        ),
      ),
      sec(
        'Basic Components',
        pairs(
          ['Entity', 'a real-world thing: Student, Course'],
          ['Entity Set', 'all entities of one type (all students)'],
          ['Attribute', 'a property of an entity: name, age'],
          ['Relationship', 'an association: Student __enrolls in__ Course'],
          ['Relationship Set', 'all relationships of one type'],
        ),
      ),
    ),
    row(
      sec(
        'Types of Attributes',
        table(
          ['Type', 'Meaning', 'Example'],
          [
            ['Simple', 'cannot be split further', 'Age, Gender'],
            ['Composite', 'made of sub-parts', 'Name → First, Middle, Last'],
            ['Single-valued', 'exactly one value', 'Roll No, DOB'],
            ['Multi-valued', 'can hold many values', 'Phone numbers, Skills'],
            ['Derived', 'calculated from others', 'Age (from DOB)'],
            ['Key', 'uniquely identifies the entity', 'Roll No'],
          ],
        ),
        sketch(
          {
            w: 280,
            h: 96,
            nodes: [attr('n', 140, 22, 'Name'), attr('f', 52, 76, 'First'), attr('m', 140, 76, 'Middle'), attr('l', 228, 76, 'Last')],
            edges: [link('n', 'f'), link('n', 'm'), link('n', 'l')],
          },
          'A composite attribute splits into sub-parts.',
        ),
      ),
      sec(
        'ER Diagram Notations',
        sketch({ w: 320, h: 352, nodes: legendNodes, edges: legendEdges, alt: legend.map(([, l]) => l).join(', ') }),
      ),
      [1.15, 1],
    ),
    row(
      [
        sec(
          'Types of Entities',
          ul(
            '**Strong entity**: has its __own primary key__, e.g. Student, Course. Drawn as a single box.',
            '**Weak entity**: has __no key of its own__ and depends on a strong __owner__ entity, e.g. a Dependent of an Employee. Drawn as a double box, with a __partial key__.',
          ),
          sketch(
            {
              w: 340,
              h: 74,
              nodes: [
                { id: 'e', x: 56, y: 37, w: 100, h: 36, text: 'Employee', bold: true },
                { id: 'h', shape: 'diamond2', x: 172, y: 37, w: 86, h: 50, text: 'Has', size: 13 },
                { id: 'd', shape: 'box2', x: 286, y: 37, w: 104, h: 40, text: 'Dependent', bold: true },
              ],
              edges: [link('e', 'h'), link('h', 'd', { double: true })],
            },
            'A weak entity always takes part fully (double line).',
          ),
        ),
        sec(
          'Cardinality & Participation',
          ul(
            '**Cardinality** = how many entities can take part in a relationship: 1:1, 1:N, N:1, M:N.',
            '**Total participation** (double line): __every__ entity must take part, e.g. every Loan belongs to a Customer.',
            '**Partial participation** (single line): some may not, e.g. not every Customer has a Loan.',
          ),
        ),
      ],
      sec(
        'Types of Relationships',
        ul(
          '**One-to-One (1:1)**: one entity ↔ at most one other. Person — Passport.',
          '**One-to-Many (1:N)**: one ↔ many. Department — Employees.',
          '**Many-to-One (N:1)**: many ↔ one. Students — College.',
          '**Many-to-Many (M:N)**: many ↔ many. Students — Courses.',
        ),
        sub(
          'Degree of a relationship',
          ul(
            '**Unary** (recursive): an entity with itself, e.g. Employee __manages__ Employee.',
            '**Binary**: two entities. The most common.',
            '**Ternary**: three entities, e.g. Doctor – Patient – Medicine.',
          ),
        ),
      ),
    ),
    full(
      sec(
        'Example ER Diagram',
        sketch(
          {
            w: 660,
            h: 236,
            nodes: [
              { id: 's', x: 150, y: 118, w: 112, h: 40, text: 'Student', bold: true, size: 16, tone: 'blue' },
              { id: 'r', shape: 'diamond', x: 330, y: 118, w: 116, h: 64, text: 'Enrolls', bold: true, size: 15, tone: 'yellow' },
              { id: 'c', x: 512, y: 118, w: 112, h: 40, text: 'Course', bold: true, size: 16, tone: 'blue' },
              attr('rn', 50, 50, 'RollNo', { key: true }),
              attr('nm', 160, 30, 'Name'),
              attr('ph', 48, 192, 'Phone', { shape: 'oval2', h: 34 }),
              attr('ag', 170, 206, 'Age', { shape: 'ovalDash' }),
              attr('gr', 330, 30, 'Grade'),
              attr('ci', 490, 32, 'CourseID', { key: true }),
              attr('ti', 612, 58, 'Title'),
              attr('cr', 600, 196, 'Credits'),
            ],
            edges: [
              link('s', 'rn'),
              link('s', 'nm'),
              link('s', 'ph'),
              link('s', 'ag'),
              link('r', 'gr'),
              link('c', 'ci'),
              link('c', 'ti'),
              link('c', 'cr'),
              link('s', 'r', { label: 'M', ly: -12 }),
              link('r', 'c', { label: 'N', ly: -12 }),
            ],
          },
          'M:N: a student takes many courses, a course has many students. __Grade__ belongs to the relationship; Phone is multi-valued, Age is derived.',
        ),
      ),
    ),
    row(
      sec(
        'Another Example (One-to-One)',
        sketch({
          w: 450,
          h: 150,
          nodes: [
            { id: 'p', x: 76, y: 104, w: 100, h: 38, text: 'Person', bold: true, tone: 'blue' },
            { id: 'h', shape: 'diamond', x: 214, y: 104, w: 84, h: 52, text: 'Has', bold: true, tone: 'yellow' },
            { id: 'q', x: 352, y: 104, w: 110, h: 38, text: 'Passport', bold: true, tone: 'blue' },
            attr('pid', 48, 30, 'PersonID', { key: true }),
            attr('pn', 150, 26, 'Name'),
            attr('no', 290, 26, 'PassportNo', { key: true }),
            attr('dt', 398, 44, 'IssueDate'),
          ],
          edges: [link('p', 'pid'), link('p', 'pn'), link('q', 'no'), link('q', 'dt'), link('p', 'h', { label: '1', ly: -11 }), link('h', 'q', { label: '1', ly: -11 })],
        }),
      ),
      exam(
        'The ER model is for __conceptual design__.',
        'Attributes: simple, composite, single / multi-valued, derived, key.',
        'A weak entity depends on its owner and has only a __partial key__.',
        'Cardinality: 1:1, 1:N, N:1, M:N. Participation: total or partial.',
        'An M:N relationship becomes its __own table__ when you build the schema.',
      ),
    ),
  ],
  quote: 'Draw it first (ER), then build the tables.',
});
