import { code, cols, definePage, mini, note, p, row, sec, sub, table, ul } from '../../dsl';

export default definePage({
  rows: [
    row(
      sec(
        'What is SQL ?',
        ul(
          '**SQL** (Structured Query Language) is the standard language for __relational databases__.',
          'Used to __create__, __query__, __change__ and __control__ data.',
          'It is __declarative__: you say __what__ you want, and the DBMS decides __how__.',
          'Keywords are case-insensitive: `SELECT` = `select`. End statements with `;`.',
        ),
      ),
      sec(
        'Types of SQL Commands',
        table(
          ['Type', 'Purpose', 'Commands'],
          [
            ['**DDL**', 'define structure', 'CREATE, ALTER, DROP, TRUNCATE'],
            ['**DML**', 'change data', 'INSERT, UPDATE, DELETE'],
            ['**DQL**', 'read data', 'SELECT'],
            ['**DCL**', 'permissions', 'GRANT, REVOKE'],
            ['**TCL**', 'transactions', 'COMMIT, ROLLBACK, SAVEPOINT'],
          ],
        ),
      ),
    ),
    row(
      sec(
        'CREATE, ALTER, DROP & TRUNCATE',
        sub(
          '(1) CREATE TABLE',
          p('Creates a new table.'),
          cols(
            [
              code(
                `CREATE TABLE Student (
                   RollNo INT PRIMARY KEY,
                   Name   VARCHAR(50),
                   Age    INT,
                   Branch VARCHAR(10)
                 );`,
              ),
            ],
            [
              mini(
                'Student',
                ['RollNo', 'Name', 'Age', 'Branch'],
                [
                  ['1', 'Asha', '20', 'CSE'],
                  ['2', 'Ravi', '21', 'ECE'],
                  ['3', 'Meera', '19', 'IT'],
                ],
              ),
            ],
          ),
        ),
        sub(
          '(2) ALTER TABLE',
          p('Changes the structure of an existing table.'),
          code(
            `ALTER TABLE Student ADD Email VARCHAR(80);
             ALTER TABLE Student MODIFY Age SMALLINT;  -- MySQL
             ALTER TABLE Student DROP COLUMN Email;`,
          ),
        ),
        sub(
          '(3) DROP vs TRUNCATE',
          cols(
            [p('**DROP** removes the whole table: data __and__ structure.'), code('DROP TABLE Student;')],
            [p('**TRUNCATE** removes __all rows__ but keeps the structure.'), code('TRUNCATE TABLE Student;')],
          ),
        ),
      ),
      sec(
        'SELECT Statement',
        ul('Reads data from one or more tables.'),
        code(
          `SELECT column1, column2
           FROM table_name;`,
          'Syntax:',
          'yellow',
        ),
        cols(
          [code(`SELECT *\nFROM Student;`, '(1) All columns')],
          [code(`SELECT Name, Age\nFROM Student;`, '(2) Some columns')],
        ),
        cols(
          [code(`SELECT *\nFROM Student\nWHERE Age > 20;`, '(3) With a condition')],
          [code(`SELECT DISTINCT Branch\nFROM Student;`, '(4) Unique values')],
        ),
      ),
    ),
    row(
      sec(
        'INSERT, UPDATE & DELETE',
        cols(
          [code(`INSERT INTO Student\nVALUES (4, 'Karan', 22, 'CSE');`, '(1) INSERT: add rows')],
          [code(`UPDATE Student\nSET Age = 21\nWHERE RollNo = 1;`, '(2) UPDATE: change rows')],
        ),
        code(`DELETE FROM Student\nWHERE RollNo = 3;`, '(3) DELETE: remove rows'),
        note('Careful!', p('`UPDATE` or `DELETE` __without WHERE__ changes __every row__ in the table.')),
      ),
      sec(
        'WHERE Clause',
        ul('Filters rows using a condition.'),
        table(
          ['Operator', 'Meaning', 'Example'],
          [
            ['=', 'equal', 'Age = 20'],
            ['<> or !=', 'not equal', 'Age <> 20'],
            ['>  <', 'greater / less than', 'Age > 20'],
            ['>=  <=', 'at least / at most', 'Age >= 20'],
            ['BETWEEN', 'in a range (inclusive)', 'Age BETWEEN 18 AND 22'],
            ['IN', 'in a list', "Branch IN ('CSE', 'IT')"],
            ['LIKE', '% = any chars, _ = one char', "Name LIKE 'A%'"],
            ['IS NULL', 'value is missing', 'Email IS NULL'],
            ['AND / OR / NOT', 'combine conditions', "Age > 18 AND Branch = 'CSE'"],
          ],
        ),
        p('`= NULL` never matches anything: always write `IS NULL`.'),
      ),
    ),
    row(
      sec(
        'ORDER BY, DISTINCT & LIMIT',
        sub('(1) ORDER BY', ul('Sorts the result: `ASC` (default) or `DESC`.'), code(`SELECT * FROM Student\nORDER BY Age DESC, Name ASC;`)),
        sub('(2) DISTINCT', ul('Removes duplicate rows from the result.'), code(`SELECT DISTINCT Branch FROM Student;`)),
        sub(
          '(3) LIMIT',
          ul('Returns only the first n rows (MySQL, PostgreSQL). SQL Server uses `TOP`.'),
          code(`SELECT * FROM Student\nORDER BY Age DESC\nLIMIT 3;`),
        ),
      ),
      sec(
        'Constraints in SQL',
        p('Rules on columns that keep bad data out.'),
        table(
          ['Constraint', 'Ensures', 'Example'],
          [
            ['NOT NULL', 'no empty value', 'Name VARCHAR(50) NOT NULL'],
            ['UNIQUE', 'no duplicates', 'Email VARCHAR(80) UNIQUE'],
            ['PRIMARY KEY', 'unique + not null', 'RollNo INT PRIMARY KEY'],
            ['FOREIGN KEY', 'value exists in the parent table', 'FOREIGN KEY (CourseID) REFERENCES Course(CourseID)'],
            ['CHECK', 'a condition is true', 'Age INT CHECK (Age >= 16)'],
            ['DEFAULT', 'value used when none is given', "Branch VARCHAR(10) DEFAULT 'CSE'"],
          ],
        ),
      ),
    ),
  ],
  quote: 'Say what you want; the database works out how.',
});
