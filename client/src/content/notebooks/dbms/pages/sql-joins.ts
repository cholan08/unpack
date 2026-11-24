import { code, cols, definePage, exam, full, mini, note, p, row, sec, sketch, sub, table, ul, venn } from '../../dsl';
import type { SketchNode } from '../../types';

/* The order a DBMS evaluates the clauses of a SELECT, as a snake of pills. */
const step = (id: string, x: number, y: number, text: string, tone: SketchNode['tone']): SketchNode => ({
  id,
  shape: 'pill',
  x,
  y,
  w: 104,
  h: 34,
  text,
  tone,
  bold: true,
  size: 14,
});
const order = sketch(
  {
    w: 470,
    h: 128,
    nodes: [
      step('a', 60, 28, '1  FROM / JOIN', 'blue'),
      step('b', 176, 28, '2  WHERE', 'blue'),
      step('c', 292, 28, '3  GROUP BY', 'blue'),
      step('d', 408, 28, '4  HAVING', 'blue'),
      step('e', 408, 100, '5  SELECT', 'yellow'),
      step('f', 292, 100, '6  ORDER BY', 'green'),
      step('g', 176, 100, '7  LIMIT', 'green'),
    ],
    edges: [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
      { from: 'c', to: 'd' },
      { from: 'd', to: 'e' },
      { from: 'e', to: 'f' },
      { from: 'f', to: 'g' },
    ],
  },
  'That’s why WHERE can’t use a SELECT alias or an aggregate, but HAVING can use aggregates.',
);

const join = (title: string, what: string, shade: 'inner' | 'left' | 'right' | 'full' | 'none', sql: string, opts: { a?: string; b?: string; apart?: boolean; tone?: 'blue' | 'pink' | 'purple' } = {}) =>
  sub(title, p(what), venn(shade, opts), code(sql));

export default definePage({
  rows: [
    row(
      sec(
        'What are Joins ?',
        ul(
          'A __join__ combines rows from two or more tables using a __related column__, usually a foreign key.',
          'One query can then read data that is spread across tables.',
          'Types: __INNER__, __LEFT__, __RIGHT__, __FULL__, __CROSS__, __SELF__.',
        ),
      ),
      sec(
        'Example Tables',
        cols(
          [
            mini(
              'Student',
              ['RollNo', 'Name', 'Branch'],
              [
                ['1', 'Asha', 'CSE'],
                ['2', 'Ravi', 'ECE'],
                ['3', 'Meera', 'IT'],
                ['4', 'Karan', 'CSE'],
              ],
            ),
          ],
          [
            mini(
              'Enrolled',
              ['RollNo', 'CourseID', 'Grade'],
              [
                ['1', 'C101', 'A'],
                ['1', 'C102', 'B'],
                ['2', 'C101', 'A'],
                ['3', 'C103', 'B'],
              ],
            ),
          ],
        ),
      ),
    ),
    full(
      sec(
        'Types of Joins',
        cols(
          [join('(1) INNER JOIN', 'Only rows that __match__ in both tables.', 'inner', `SELECT cols\nFROM A INNER JOIN B\n  ON A.col = B.col;`)],
          [join('(2) LEFT JOIN', '__All__ rows of the left table + matches from the right (NULL if none).', 'left', `SELECT cols\nFROM A LEFT JOIN B\n  ON A.col = B.col;`)],
          [join('(3) RIGHT JOIN', '__All__ rows of the right table + matches from the left.', 'right', `SELECT cols\nFROM A RIGHT JOIN B\n  ON A.col = B.col;`)],
        ),
        cols(
          [join('(4) FULL JOIN', 'All rows from __both__ tables, matched where possible.', 'full', `SELECT cols\nFROM A FULL JOIN B\n  ON A.col = B.col;`, { tone: 'pink' })],
          [join('(5) CROSS JOIN', 'Every row of A with every row of B (Cartesian product).', 'none', `SELECT cols\nFROM A CROSS JOIN B;`, { apart: true })],
          [
            join('(6) SELF JOIN', 'A table joined __with itself__, using two aliases.', 'inner', `SELECT e.Name, m.Name AS Boss\nFROM Emp e JOIN Emp m\n  ON e.MgrID = m.EmpID;`, {
              a: 'e',
              b: 'm',
              tone: 'purple',
            }),
          ],
        ),
      ),
    ),
    row(
      sec(
        'Join Examples',
        code(
          `SELECT S.Name, E.CourseID, E.Grade
           FROM Student S
           INNER JOIN Enrolled E
             ON S.RollNo = E.RollNo;`,
          '(1) INNER: students with enrolments',
        ),
        code(
          `SELECT S.Name, E.CourseID
           FROM Student S
           LEFT JOIN Enrolled E
             ON S.RollNo = E.RollNo;`,
          '(2) LEFT: every student',
        ),
        mini(
          'Result of (2)',
          ['Name', 'CourseID'],
          [
            ['Asha', 'C101'],
            ['Asha', 'C102'],
            ['Ravi', 'C101'],
            ['Meera', 'C103'],
            ['Karan', '==NULL=='],
          ],
          'pink',
        ),
        note('MySQL tip:', p('MySQL has no `FULL JOIN`: combine a `LEFT JOIN` and a `RIGHT JOIN` with `UNION`.')),
      ),
      [
        sec(
          'Aggregate Functions',
          p('Work on a __set of rows__ and return __one value__.'),
          table(
            ['Function', 'Returns', 'Example'],
            [
              ['COUNT()', 'number of rows', 'SELECT COUNT(*) FROM Student;'],
              ['SUM()', 'total', 'SELECT SUM(Fees) FROM Student;'],
              ['AVG()', 'average', 'SELECT AVG(Age) FROM Student;'],
              ['MAX()', 'largest value', 'SELECT MAX(Age) FROM Student;'],
              ['MIN()', 'smallest value', 'SELECT MIN(Age) FROM Student;'],
            ],
          ),
          p('`COUNT(*)` counts every row; `COUNT(col)` skips NULLs.'),
        ),
        sec(
          'Other Useful Functions',
          table(
            ['Function', 'Does', 'Example'],
            [
              ['UPPER() / LOWER()', 'change case', 'UPPER(Name)'],
              ['LENGTH()', 'length of a string', 'LENGTH(Name)'],
              ['SUBSTRING()', 'part of a string', 'SUBSTRING(Name, 1, 3)'],
              ['CONCAT()', 'join strings', "CONCAT(Name, ' - ', Branch)"],
              ['ROUND()', 'round a number', 'ROUND(AVG(Age), 1)'],
              ['NOW()', 'current date & time', 'SELECT NOW();'],
              ['COALESCE()', 'first non-NULL value', "COALESCE(Email, 'n/a')"],
            ],
          ),
        ),
      ],
    ),
    row(
      sec(
        'GROUP BY and HAVING',
        ul('`GROUP BY` puts rows with the same value into __groups__.', '`HAVING` filters __groups__; `WHERE` filters __rows__ before grouping.'),
        cols(
          [code(`SELECT column, AGG(column)\nFROM table\nWHERE condition\nGROUP BY column\nHAVING condition;`, 'Syntax:', 'yellow')],
          [code(`SELECT Branch, COUNT(*)\nFROM Student\nGROUP BY Branch\nHAVING COUNT(*) > 1;`, 'Example:')],
        ),
        sub('Order the DBMS runs a query', order),
      ),
      exam(
        'INNER JOIN returns only matching rows.',
        'LEFT keeps all left rows, RIGHT keeps all right rows; the missing side is NULL.',
        'FULL JOIN keeps all rows of both tables.',
        'CROSS JOIN gives m × n rows.',
        'Aggregates return __one value__ per group.',
        '`WHERE` filters rows, `HAVING` filters groups.',
        'Every non-aggregated column in SELECT must appear in GROUP BY.',
      ),
      [1.2, 1],
    ),
  ],
  quote: 'Join to combine, group to summarise, HAVING to filter the groups.',
});
