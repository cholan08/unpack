import { cards, code, cols, definePage, exam, full, mini, ops, p, pairs, row, sec, spec, sub, table, tbl, ul } from '../../dsl';

export default definePage({
  rows: [
    row(
      [
        sec(
          'Views in SQL',
          ul(
            'A __view__ is a __virtual table__ built from a saved query.',
            'It stores the __query__, not the data (a __materialized__ view does store a copy).',
            'Used for __security__ (hide columns), __simplicity__ and __abstraction__.',
          ),
          cols(
            [code(`CREATE VIEW view_name AS\nSELECT col1, col2\nFROM table_name\nWHERE condition;`, 'Syntax:', 'yellow')],
            [code(`CREATE VIEW CSE_Students AS\nSELECT Name, Age\nFROM Student\nWHERE Branch = 'CSE';`, 'Example:')],
          ),
          cols([code(`SELECT * FROM CSE_Students;`, 'Use it:')], [code(`DROP VIEW CSE_Students;`, 'Drop it:')]),
        ),
        sec(
          'Indexes in SQL',
          ul(
            'An __index__ is a separate structure (usually a __B+ tree__) that finds rows __fast__, like the index of a book.',
            'Speeds up `SELECT`, `WHERE`, `JOIN`, `ORDER BY`.',
            'Slows down `INSERT`, `UPDATE`, `DELETE` (the index must change too) and takes extra space.',
          ),
          cols(
            [code(`CREATE INDEX index_name\nON table_name (column);`, 'Syntax:', 'yellow')],
            [code(`CREATE INDEX idx_age\nON Student (Age);`, 'Example:')],
          ),
          table(
            ['Type', 'Meaning', 'Example'],
            [
              ['Primary', 'on the primary key (automatic)', 'RollNo'],
              ['Unique', 'no duplicate values allowed', 'Email'],
              ['Composite', 'on several columns together', '(Branch, Age)'],
              ['Clustered', 'rows stored __in index order__; one per table', 'PK in MySQL InnoDB'],
              ['Non-clustered', 'separate structure that points to rows', 'most other indexes'],
            ],
          ),
        ),
        sec(
          'View vs Table',
          table(
            ['Feature', 'Table', 'View'],
            [
              ['Storage', 'stores data physically', 'stores only the query'],
              ['Data', 'its own', 'comes from base tables'],
              ['Changes', 'INSERT / UPDATE / DELETE freely', 'limited (simple views only)'],
              ['Use', 'holds the real data', 'security, simplicity'],
              ['Example', 'Student', 'CSE_Students'],
            ],
          ),
        ),
      ],
      [
        sec(
          'Normalization',
          ul(
            '**Normalization** organises tables to __reduce redundancy__ and avoid __anomalies__.',
            'It splits a big table into smaller related tables, linked by keys.',
          ),
          sub(
            'Functional Dependency (FD)',
            ul(
              '**X → Y**: the value of X __decides__ the value of Y.',
              'e.g. RollNo → Name,  Branch → HOD.',
              '**Partial dependency**: a non-key column depends on __part__ of a composite key.',
              '**Transitive dependency**: key → non-key → non-key (A → B → C).',
            ),
          ),
        ),
        sec(
          'Normal Forms',
          cards(
            { label: '1NF', sub: 'First Normal Form', tone: 'pink', points: ['Every value is __atomic__: one value per cell.', 'No repeating groups or lists.'] },
            { label: '2NF', sub: 'Second Normal Form', tone: 'yellow', points: ['Is in 1NF.', 'No __partial__ dependency: non-key columns depend on the __whole__ key.'] },
            { label: '3NF', sub: 'Third Normal Form', tone: 'green', points: ['Is in 2NF.', 'No __transitive__ dependency: non-key columns depend only on the key.'] },
            { label: 'BCNF', sub: 'Boyce–Codd NF', tone: 'blue', points: ['A stricter 3NF.', 'For every FD X → Y, X is a __super key__.'] },
            { label: '4NF', sub: 'Fourth Normal Form', tone: 'purple', points: ['Is in BCNF.', 'No __multi-valued__ dependency.'] },
            { label: '5NF', sub: 'Fifth Normal Form', tone: 'orange', points: ['Is in 4NF.', 'No __join__ dependency left to split.'] },
          ),
        ),
        sec(
          'Why Normalize? (Anomalies)',
          pairs(
            ['Insert anomaly', 'can’t record a new branch’s HOD until a student joins it'],
            ['Update anomaly', 'the HOD changes → edit __many rows__; miss one and data disagrees'],
            ['Delete anomaly', 'delete the last ECE student → the ECE HOD is lost too'],
          ),
        ),
      ],
    ),
    full(
      sec(
        'Example of Normalization',
        cols(
          [
            sub(
              '(1) Unnormalized table',
              mini(
                undefined,
                ['RollNo', 'Name', 'Branch', 'HOD', 'Courses'],
                [
                  ['1', 'Asha', 'CSE', 'Dr. Rao', '==DBMS, OS=='],
                  ['2', 'Ravi', 'ECE', 'Dr. Iyer', 'DBMS'],
                ],
              ),
              p('A cell holds a __list__, so values are not atomic.'),
            ),
          ],
          [
            sub(
              '(2) After 1NF (atomic values)',
              mini(
                undefined,
                ['RollNo', 'Name', 'Branch', 'HOD', 'Course'],
                [
                  ['1', 'Asha', 'CSE', 'Dr. Rao', 'DBMS'],
                  ['1', 'Asha', 'CSE', 'Dr. Rao', 'OS'],
                  ['2', 'Ravi', 'ECE', 'Dr. Iyer', 'DBMS'],
                ],
              ),
              p('Key = (RollNo, Course), but Name depends only on RollNo: a __partial__ dependency.'),
            ),
          ],
        ),
        cols(
          [
            sub(
              '(3) After 2NF (no partial dependency)',
              ops(
                tbl(spec('Student', ['RollNo', 'Name', 'Branch', 'HOD'], [['1', 'Asha', 'CSE', 'Dr. Rao'], ['2', 'Ravi', 'ECE', 'Dr. Iyer']])),
                tbl(spec('Enrolment', ['RollNo', 'Course'], [['1', 'DBMS'], ['1', 'OS'], ['2', 'DBMS']])),
              ),
              p('Still RollNo → Branch → HOD: a __transitive__ dependency.'),
            ),
          ],
          [
            sub(
              '(4) After 3NF (no transitive dependency)',
              ops(
                tbl(spec('Student', ['RollNo', 'Name', 'Branch'], [['1', 'Asha', 'CSE'], ['2', 'Ravi', 'ECE']], 'green')),
                tbl(spec('Branch', ['Branch', 'HOD'], [['CSE', 'Dr. Rao'], ['ECE', 'Dr. Iyer']], 'green')),
                tbl(spec('Enrolment', ['RollNo', 'Course'], [['1', 'DBMS'], ['1', 'OS'], ['2', 'DBMS']], 'green')),
              ),
              p('Every fact is now stored __once__.'),
            ),
          ],
        ),
      ),
    ),
    full(
      exam(
        'A view is a virtual table with no data of its own.',
        'Indexes speed up reads but slow down writes.',
        '1NF: atomic → 2NF: no partial → 3NF: no transitive dependency.',
        'BCNF: every determinant is a super key (stricter than 3NF).',
        'Normalization cuts redundancy; __denormalization__ trades some back for read speed.',
      ),
    ),
  ],
  quote: 'Every fact in one place, and only one place.',
});
