import { box, definePage, exam, op, ops, row, sec, spec, table, tbl, ul } from '../../dsl';

const STUDENT = spec(
  'Student',
  ['RollNo', 'Name', 'Age', 'Branch'],
  [
    ['1', 'Asha', '20', 'CSE'],
    ['2', 'Ravi', '21', 'ECE'],
    ['3', 'Meera', '19', 'IT'],
    ['4', 'Karan', '22', 'CSE'],
  ],
);
const result = (head: string[], rows: string[][], title = 'Result') => tbl(spec(title, head, rows, 'pink'));

export default definePage({
  rows: [
    row(
      sec(
        'What is Relational Algebra ?',
        ul(
          '**Relational algebra** is a __procedural__ query language: you say __how__ to get the result, step by step.',
          'It takes relations as __input__ and gives a relation as __output__, so operations can be chained.',
          'It is the __theory under SQL__: the DBMS turns your SQL into algebra to plan the query.',
          'Symbols: σ  π  ∪  −  ×  ρ  ⋈  ∩  ÷',
        ),
      ),
      sec(
        'Basic Operations',
        table(
          ['Operation', 'Symbol', 'What it does'],
          [
            ['Selection', 'σ', 'picks __rows__ that match a condition'],
            ['Projection', 'π', 'picks __columns__ (drops duplicates)'],
            ['Union', '∪', 'tuples in R __or__ S'],
            ['Set Difference', '−', 'tuples in R __but not__ in S'],
            ['Cartesian Product', '×', 'every tuple of R with every tuple of S'],
            ['Rename', 'ρ', 'renames a relation or attribute'],
            ['Intersection', '∩', 'tuples in __both__ R and S'],
            ['Join', '⋈', 'combines related tuples of R and S'],
            ['Division', '÷', '“for all” queries'],
          ],
        ),
      ),
    ),
    row(
      sec(
        'Selection (σ)',
        ul('Picks the __rows (tuples)__ that satisfy a condition.', 'Syntax: σ_{condition}(R)    Example: σ_{Age > 20}(Student)'),
        ops(tbl(STUDENT), op('σ_{Age > 20}'), result(['RollNo', 'Name', 'Age', 'Branch'], [['2', 'Ravi', '21', 'ECE'], ['4', 'Karan', '22', 'CSE']])),
      ),
      sec(
        'Projection (π)',
        ul('Picks __columns (attributes)__.', 'Duplicate rows are __removed__: the result is a set.', 'Syntax: π_{attribute list}(R)    Example: π_{Branch}(Student)'),
        ops(tbl(STUDENT), op('π_{Branch}'), result(['Branch'], [['CSE'], ['ECE'], ['IT']])),
        box('4 rows in, 3 out: the second ==CSE== was a duplicate.'),
      ),
    ),
    row(
      sec(
        'Union (∪)',
        ul(
          'All tuples in R __or__ S, duplicates removed.',
          'R and S must be __union-compatible__: same number of attributes, same domains.',
          'Syntax: R ∪ S',
        ),
        ops(
          tbl(spec('R', ['RollNo', 'Name'], [['1', 'Asha'], ['2', 'Ravi'], ['3', 'Meera']])),
          tbl(spec('S', ['RollNo', 'Name'], [['3', 'Meera'], ['4', 'Karan']])),
          op('R ∪ S'),
          result(['RollNo', 'Name'], [['1', 'Asha'], ['2', 'Ravi'], ['3', 'Meera'], ['4', 'Karan']]),
        ),
      ),
      sec(
        'Set Difference (−)',
        ul('Tuples in R that are __not__ in S.', 'R and S must be union-compatible.', 'Syntax: R − S   (and R − S ≠ S − R)'),
        ops(
          tbl(spec('R', ['RollNo', 'Name'], [['1', 'Asha'], ['2', 'Ravi'], ['3', 'Meera']])),
          tbl(spec('S', ['RollNo', 'Name'], [['2', 'Ravi']])),
          op('R − S'),
          result(['RollNo', 'Name'], [['1', 'Asha'], ['3', 'Meera']]),
        ),
      ),
    ),
    row(
      sec(
        'Cartesian Product (×)',
        ul(
          'Pairs __every__ tuple of R with __every__ tuple of S.',
          'If R has m tuples and S has n, the result has __m × n__ tuples; the degrees add up.',
          'Syntax: R × S',
        ),
        ops(
          tbl(spec('R (Student)', ['RollNo', 'Name'], [['1', 'Asha'], ['2', 'Ravi']])),
          tbl(spec('S (Branch)', ['Branch'], [['CSE'], ['ECE']])),
          op('R × S'),
          result(['RollNo', 'Name', 'Branch'], [['1', 'Asha', 'CSE'], ['1', 'Asha', 'ECE'], ['2', 'Ravi', 'CSE'], ['2', 'Ravi', 'ECE']]),
        ),
      ),
      [
        sec(
          'Rename (ρ)',
          ul('Gives a relation, or its attributes, a __new name__.', 'Handy when a relation is used twice in one query.'),
          box('ρ_{Pupil}(Student)', 'ρ_{S(ID, FullName, Age, Dept)}(Student)'),
        ),
        sec('Intersection (∩)', ul('Tuples in __both__ R and S (union-compatible).', 'A derived operation: R ∩ S = R − (R − S).')),
      ],
    ),
    row(
      sec(
        'Join (⋈)',
        ul(
          'Combines related tuples from two relations: a × followed by a σ.',
          '**Theta join** R ⋈_{θ} S: any condition (<, >, =, …).',
          '**Equi join**: the condition uses only =.',
          '**Natural join** R ⋈ S: equal on the __common attributes__, which appear once.',
        ),
        ops(
          tbl(spec('Student', ['RollNo', 'Name', 'CourseID'], [['1', 'Asha', 'C1'], ['2', 'Ravi', 'C2']])),
          tbl(spec('Course', ['CourseID', 'Title'], [['C1', 'DBMS'], ['C2', 'Java']])),
          op('Student ⋈ Course'),
          result(['RollNo', 'Name', 'CourseID', 'Title'], [['1', 'Asha', 'C1', 'DBMS'], ['2', 'Ravi', 'C2', 'Java']]),
        ),
      ),
      exam(
        'Relational algebra works on __sets__: no duplicate tuples.',
        'Fundamental: σ π ∪ − × ρ.  Derived: ∩ ⋈ ÷.',
        'σ filters __rows__; π picks __columns__.',
        '∪ and − need union-compatible relations.',
        'R × S has m × n tuples; a join = × then σ.',
        'In SQL: `WHERE` ≈ σ, the column list ≈ π, `JOIN` ≈ ⋈.',
      ),
      [1.25, 1],
    ),
  ],
  quote: 'σ picks rows, π picks columns, ⋈ ties tables together.',
});
