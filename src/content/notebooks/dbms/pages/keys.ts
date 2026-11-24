import { box, circles, code, cols, definePage, exam, full, mini, ops, op, p, pairs, row, sec, spec, table, tbl, ul } from '../../dsl';

export default definePage({
  rows: [
    row(
      [
        sec(
          'What are Keys ?',
          ul(
            'A __key__ is an attribute (or a set of attributes) that __uniquely identifies__ a tuple (row).',
            'Keys keep data __correct__ (no duplicate rows) and __link__ tables together.',
            'One relation can have __several__ keys.',
          ),
        ),
        sec('Types of Keys', circles('Super Key', 'Candidate Key', 'Primary Key', 'Alternate Key', 'Foreign Key', 'Composite Key', 'Unique & Surrogate Key')),
      ],
      [
        sec(
          'Super Key',
          ul('Any set of attributes that __uniquely identifies__ a tuple.', 'It may carry __extra__ attributes that are not needed.'),
          mini(
            'Student',
            ['RollNo', 'Name', 'Email', 'Age'],
            [
              ['1', 'Asha', 'asha@x.com', '20'],
              ['2', 'Ravi', 'ravi@x.com', '21'],
              ['3', 'Meera', 'meera@x.com', '19'],
            ],
          ),
          p('Super keys: {RollNo}, {Email}, {RollNo, Name}, {Email, Age}, {RollNo, Name, Email, Age} …'),
        ),
        sec(
          'Candidate Key',
          ul('A __minimal__ super key: remove any attribute and it is no longer unique.', 'A table can have __many__ candidate keys.'),
          box('Candidate keys: **{RollNo}**, **{Email}**'),
        ),
      ],
    ),
    row(
      [
        sec(
          'Primary Key',
          ul(
            'The candidate key __chosen__ to identify rows.',
            'Must be __unique__ and __NOT NULL__.',
            'Only __one__ primary key per table (it may span several columns).',
          ),
          box('Primary Key: **RollNo**'),
        ),
        sec(
          'Alternate Key',
          ul('Candidate keys that were __not chosen__ as the primary key.', 'Still unique; usually enforced with a `UNIQUE` constraint.'),
          box('Alternate Key: **Email**'),
        ),
      ],
      sec(
        'Foreign Key',
        ul(
          'An attribute in one table that __refers to the primary key__ of another table.',
          'Links the two tables and keeps __referential integrity__: you can’t enrol a student who doesn’t exist.',
          'Values can repeat, and can be NULL unless the column is NOT NULL.',
        ),
        ops(
          tbl(spec('Enroll', ['EnrollID', 'RollNo', 'CourseID'], [['101', '1', 'CS201'], ['102', '2', 'EC110'], ['103', '1', 'CS305']])),
          op('RollNo refers to'),
          tbl(spec('Student', ['RollNo', 'Name'], [['1', 'Asha'], ['2', 'Ravi'], ['3', 'Meera']])),
        ),
        code(
          `CREATE TABLE Enroll (
             EnrollID INT PRIMARY KEY,
             RollNo   INT,
             CourseID VARCHAR(10),
             FOREIGN KEY (RollNo) REFERENCES Student(RollNo)
           );`,
        ),
      ),
    ),
    row(
      [
        sec(
          'Composite Key',
          ul('A key made of __two or more__ attributes __together__.', 'Used when no single column is unique on its own.'),
          cols(
            [mini('Marks', ['RollNo', 'SubjectID', 'Marks'], [['1', 'DB01', '85'], ['1', 'OS02', '78'], ['2', 'DB01', '90']])],
            [box('Composite key:', '**(RollNo, SubjectID)**')],
          ),
        ),
        sec(
          'Unique & Surrogate Keys',
          pairs(
            ['Unique key', 'values must be unique, but NULL is allowed (how many NULLs depends on the DBMS)'],
            ['Surrogate key', 'an artificial ID with no real meaning: `AUTO_INCREMENT` id, MongoDB `_id`'],
          ),
        ),
      ],
      sec(
        'Comparison Table',
        table(
          ['Key', 'Unique?', 'NULL?', 'How many', 'Example'],
          [
            ['Super', 'Yes', '—', 'Many', '{RollNo, Name}'],
            ['Candidate', 'Yes (minimal)', 'No', 'Many', 'RollNo, Email'],
            ['Primary', 'Yes', '**Never**', 'Exactly one', 'RollNo'],
            ['Alternate', 'Yes', 'Usually no', 'Many', 'Email'],
            ['Foreign', 'No', 'Allowed', 'Many', 'Enroll.RollNo'],
            ['Composite', 'Yes (together)', 'No (if PK)', '—', '(RollNo, SubjectID)'],
          ],
        ),
      ),
      [1, 1.1],
    ),
    full(
      exam(
        'Every primary key is a candidate key, and every candidate key is a super key.',
        'A table can have many candidate keys but __only one__ primary key.',
        'Primary key = unique + NOT NULL (__entity integrity__).',
        'A foreign key keeps __referential integrity__ between tables.',
        'Use a composite key when one column is not enough to be unique.',
      ),
    ),
  ],
  quote: 'Super ⊇ Candidate ⊇ Primary: each one narrows the last.',
});
