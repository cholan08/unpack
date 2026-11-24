import { code, cols, definePage, exam, full, mini, p, row, sec, sketch, sub, table, ul } from '../../dsl';

const node = (id: string, x: number, y: number, text: string, w = 58) => ({ id, x, y, w, h: 26, text, size: 12.5 });

export default definePage({
  rows: [
    row(
      [
        sec(
          'What is a Data Model ?',
          ul(
            'A __data model__ is a set of concepts that describes the __structure__ of a database.',
            'It defines the __types of data__, the __relationships__ between them and the __constraints__ on them.',
            'Think of it as the __blueprint__ for designing a database.',
          ),
        ),
        sec(
          'Types of Data Models',
          sub(
            '(1) Hierarchical Model',
            cols(
              [ul('Data as a __tree__ (parent → child).', 'One-to-many only.', 'e.g. file system, XML, IBM IMS.')],
              [
                sketch({
                  w: 210,
                  h: 130,
                  nodes: [node('r', 105, 16, 'Root'), node('a', 60, 64, 'Child 1'), node('b', 160, 64, 'Child 2'), node('c', 30, 112, 'Child 3'), node('d', 92, 112, 'Child 4')],
                  edges: [
                    { from: 'r', to: 'a', arrow: 'none' },
                    { from: 'r', to: 'b', arrow: 'none' },
                    { from: 'a', to: 'c', arrow: 'none' },
                    { from: 'a', to: 'd', arrow: 'none' },
                  ],
                }),
              ],
            ),
          ),
          sub(
            '(2) Network Model',
            cols(
              [ul('Data as a __graph__: a child can have __many parents__.', 'Supports many-to-many.', 'More flexible than hierarchical, but complex.')],
              [
                sketch({
                  w: 190,
                  h: 130,
                  nodes: [node('a', 95, 16, 'A', 40), node('b', 35, 65, 'B', 40), node('c', 155, 65, 'C', 40), node('d', 95, 114, 'D', 40)],
                  edges: [
                    { from: 'a', to: 'b', arrow: 'none' },
                    { from: 'a', to: 'c', arrow: 'none' },
                    { from: 'b', to: 'd', arrow: 'none' },
                    { from: 'c', to: 'd', arrow: 'none' },
                    { from: 'b', to: 'c', arrow: 'none' },
                  ],
                }),
              ],
            ),
          ),
          sub(
            '(3) Relational Model',
            cols(
              [ul('Data in __tables__ (relations) of rows and columns.', 'Tables are linked by __keys__ and queried with SQL.', '__Most widely used__: MySQL, PostgreSQL, Oracle.')],
              [mini('Student', ['ID', 'Name', 'Age'], [['1', 'Asha', '20'], ['2', 'Ravi', '21'], ['3', 'Meera', '19']])],
            ),
          ),
          sub(
            '(4) Object-Oriented Model',
            cols(
              [ul('Data as __objects__ with attributes + methods, like OOP.', 'Handles complex types: images, CAD, multimedia.')],
              [
                sketch({
                  w: 170,
                  h: 120,
                  nodes: [
                    { id: 'h', x: 85, y: 18, w: 150, h: 30, text: 'Student (Object)', bold: true, tone: 'blue', size: 13.5 },
                    { id: 'b', x: 85, y: 74, w: 150, h: 82, text: 'id : int\nname : string\nage : int\ndisplay()', size: 13 },
                  ],
                }),
              ],
            ),
          ),
          sub(
            '(5) Document Model (NoSQL)',
            cols(
              [ul('Data as __JSON-like documents__, each with its own fields.', 'Flexible schema; related data can be nested.', 'e.g. __MongoDB__, the M in MERN.')],
              [code(`{ _id: 1,\n  name: "Asha",\n  skills: ["SQL", "React"] }`)],
            ),
          ),
        ),
      ],
      [
        sec(
          'Comparison of Data Models',
          table(
            ['Model', 'Structure', 'Relationships', 'Used for'],
            [
              ['Hierarchical', 'Tree', '1 : N', 'File systems, XML'],
              ['Network', 'Graph', 'M : N', 'Old mainframes, telecom'],
              ['Relational', 'Tables', '1:1, 1:N, M:N (via keys)', '==Most business apps=='],
              ['Object-oriented', 'Objects', 'M : N (references)', 'CAD, multimedia'],
              ['Document', 'JSON documents', 'Embedded or referenced', 'Web apps, catalogs'],
            ],
          ),
        ),
        sec(
          'Database Languages',
          p('A DBMS gives a different group of commands for each job:'),
          table(
            ['Lang.', 'Full form', 'Purpose', 'Commands'],
            [
              ['**DDL**', 'Data Definition Language', 'Define / change structure', 'CREATE, ALTER, DROP, TRUNCATE, RENAME'],
              ['**DML**', 'Data Manipulation Language', 'Change the data', 'INSERT, UPDATE, DELETE'],
              ['**DQL**', 'Data Query Language', 'Read the data', 'SELECT'],
              ['**DCL**', 'Data Control Language', 'Permissions', 'GRANT, REVOKE'],
              ['**TCL**', 'Transaction Control Language', 'Manage transactions', 'COMMIT, ROLLBACK, SAVEPOINT'],
            ],
          ),
        ),
        exam(
          'Relational is the most used model in modern DBMS.',
          'SQL covers all five: DDL, DML, DQL, DCL and TCL.',
          'DDL commands __auto-commit__ in most DBMS (MySQL, Oracle).',
          'DML changes the __data__; DDL changes the __structure__.',
          'DQL (SELECT) is often counted as part of DML.',
          'DCL is for __security__; TCL keeps data __consistent__.',
          'Pick the data model that fits the app’s data and queries.',
        ),
      ],
      [1.05, 1],
    ),
    full(
      sec(
        'SQL Command Examples',
        cols(
          [
            code(
              `CREATE TABLE Student (
                 id   INT PRIMARY KEY,
                 name VARCHAR(50),
                 age  INT
               );`,
              'DDL (structure)',
            ),
            code(
              `ALTER TABLE Student
                 ADD email VARCHAR(80);
               DROP TABLE Student;
               TRUNCATE TABLE Student;`,
            ),
          ],
          [
            code(
              `INSERT INTO Student
                 VALUES (1, 'Asha', 20);
               UPDATE Student SET age = 21
                 WHERE id = 1;
               DELETE FROM Student
                 WHERE id = 1;`,
              'DML (data)',
            ),
            code(
              `SELECT name, age
               FROM Student
               WHERE age > 20;`,
              'DQL (query)',
            ),
          ],
          [
            code(
              `GRANT SELECT ON Student
                 TO user1;
               REVOKE SELECT ON Student
                 FROM user1;`,
              'DCL (permission)',
            ),
            code(
              `COMMIT;
               ROLLBACK;
               SAVEPOINT sp1;`,
              'TCL (transaction)',
            ),
          ],
        ),
      ),
    ),
  ],
  quote: 'Choose the model first; the language follows.',
});
