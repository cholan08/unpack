import { code, definePage, exam, note, p, row, sec, sub, table, ul } from '../../dsl';

export default definePage({
  rows: [
    row(
      [
        sec(
          'What are Nested Queries ?',
          ul(
            'A __subquery__ is a query __inside__ another query, written in ( ).',
            'The inner query usually runs __first__; its result feeds the outer query.',
            'Can appear in __SELECT__, __FROM__, __WHERE__ (and HAVING).',
            'Breaks a hard question into __smaller steps__.',
          ),
        ),
        sec(
          'Types of Subqueries',
          table(
            ['Type', 'Returns', 'Use with'],
            [
              ['Single-row', 'one value', '=  >  <  >=  <=  <>'],
              ['Multi-row', 'a list of values', 'IN, NOT IN, ANY, ALL'],
              ['Multi-column', 'several columns', '(a, b) IN (…)'],
              ['Correlated', 'depends on the outer row', 'EXISTS, comparisons'],
            ],
          ),
        ),
        sec(
          'Subquery in WHERE',
          sub(
            '(1) Single-row subquery',
            p('Students older than the __average__ age:'),
            code(
              `SELECT Name, Age
               FROM Student
               WHERE Age > (SELECT AVG(Age)
                            FROM Student);`,
            ),
          ),
          sub(
            '(2) Multi-row subquery with IN',
            p('Students enrolled in course C101 or C102:'),
            code(
              `SELECT Name
               FROM Student
               WHERE RollNo IN (SELECT RollNo
                                FROM Enrolled
                                WHERE CourseID IN ('C101', 'C102'));`,
            ),
          ),
          sub(
            '(3) Using NOT IN',
            p('Students __not__ enrolled in any course:'),
            code(
              `SELECT Name
               FROM Student
               WHERE RollNo NOT IN (SELECT RollNo
                                    FROM Enrolled);`,
            ),
            note('Trap:', p('If the subquery returns even one __NULL__, `NOT IN` returns __no rows__. `NOT EXISTS` is safer.')),
          ),
        ),
      ],
      [
        sec(
          'Subquery in SELECT',
          p('Adds a __calculated value__ to each row. Each student with their number of courses:'),
          code(
            `SELECT Name,
                    (SELECT COUNT(*)
                     FROM Enrolled E
                     WHERE E.RollNo = S.RollNo) AS Courses
             FROM Student S;`,
          ),
        ),
        sec(
          'Subquery in FROM',
          p('The subquery acts as a __temporary table__ (a derived table) and needs an __alias__. Average age per branch:'),
          code(
            `SELECT Branch, AVG(Age) AS AvgAge
             FROM (SELECT Branch, Age
                   FROM Student) AS T
             GROUP BY Branch;`,
          ),
        ),
        sec(
          'Correlated Subquery',
          ul('The inner query uses a column of the __outer__ query.', 'It runs __once per outer row__, so it can be slow on big tables.'),
          p('Students with at least one enrolment:'),
          code(
            `SELECT Name
             FROM Student S
             WHERE EXISTS (SELECT 1
                           FROM Enrolled E
                           WHERE E.RollNo = S.RollNo);`,
          ),
        ),
        sec(
          'ANY and ALL Operators',
          ul('`ANY`: true if the condition holds for __at least one__ value.', '`ALL`: true if it holds for __every__ value.'),
          table(
            ['Operator', 'Means', 'Same as'],
            [
              ['> ANY (…)', 'greater than at least one', '> MIN(…)'],
              ['> ALL (…)', 'greater than every value', '> MAX(…)'],
              ['< ANY (…)', 'less than at least one', '< MAX(…)'],
              ['< ALL (…)', 'less than every value', '< MIN(…)'],
              ['= ANY (…)', 'equal to one of them', 'IN (…)'],
            ],
          ),
        ),
      ],
    ),
    row(
      sec(
        'EXISTS vs IN',
        table(
          ['Feature', 'IN', 'EXISTS'],
          [
            ['Checks', 'value is in a list', 'at least one row exists'],
            ['Stops', 'after building the list', 'at the __first match__'],
            ['NULLs', '`NOT IN` breaks on NULL', '`NOT EXISTS` is safe'],
            ['Good when', 'the subquery result is small', 'the subquery is large / correlated'],
            ['Example', 'WHERE id IN (subquery)', 'WHERE EXISTS (subquery)'],
          ],
        ),
        p('Modern optimisers often run both the same way, so pick the one that reads clearly.'),
      ),
      exam(
        'A subquery always goes in __parentheses__.',
        'Single-row → `=` `>` `<`;  multi-row → `IN`, `ANY`, `ALL`.',
        'A subquery in FROM needs an __alias__.',
        'Correlated subqueries run once per outer row.',
        'Prefer `NOT EXISTS` to `NOT IN` when NULLs are possible.',
        'Many subqueries can be rewritten as __JOINs__.',
      ),
      [1.1, 1],
    ),
  ],
  quote: 'Big question? Ask a smaller one inside it.',
});
