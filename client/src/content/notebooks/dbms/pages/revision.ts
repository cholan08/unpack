import { circles, definePage, full, p, row, sec, stars2, table } from '../../dsl';

export default definePage({
  rows: [
    row(
      [
        sec(
          'Important SQL Commands',
          table(
            ['Group', 'Commands', 'Purpose'],
            [
              ['DDL', 'CREATE, ALTER, DROP, TRUNCATE', 'define structure'],
              ['DML', 'INSERT, UPDATE, DELETE', 'change data'],
              ['DQL', 'SELECT', 'read data'],
              ['DCL', 'GRANT, REVOKE', 'control access'],
              ['TCL', 'COMMIT, ROLLBACK, SAVEPOINT', 'manage transactions'],
            ],
          ),
        ),
        sec(
          'Types of Joins',
          table(
            ['Join', 'Returns', 'Use it to'],
            [
              ['INNER', 'matching rows only', 'combine related data'],
              ['LEFT', 'all left + matching right', 'find left rows with no match'],
              ['RIGHT', 'all right + matching left', 'find right rows with no match'],
              ['FULL', 'all rows of both', 'merge two lists'],
              ['CROSS', 'every combination', 'generate all pairs'],
              ['SELF', 'a table with itself', 'compare rows of one table'],
            ],
          ),
        ),
        sec(
          'Normal Forms',
          table(
            ['Form', 'Rule'],
            [
              ['1NF', 'atomic values, no repeating groups'],
              ['2NF', '1NF + no partial dependency'],
              ['3NF', '2NF + no transitive dependency'],
              ['BCNF', 'every determinant is a super key'],
              ['4NF', 'BCNF + no multi-valued dependency'],
              ['5NF', '4NF + no join dependency'],
            ],
          ),
        ),
        sec(
          'ACID Properties',
          table(
            ['Property', 'In one line'],
            [
              ['Atomicity', 'all or nothing'],
              ['Consistency', 'valid state → valid state'],
              ['Isolation', 'transactions don’t interfere'],
              ['Durability', 'committed = permanent'],
            ],
          ),
        ),
        sec(
          'Concurrency Problems',
          table(
            ['Problem', 'In one line'],
            [
              ['Lost update', 'one write overwrites another'],
              ['Dirty read', 'reading uncommitted data'],
              ['Non-repeatable read', 'same row, different value on re-read'],
              ['Phantom read', 'new rows appear on re-query'],
            ],
          ),
        ),
      ],
      [
        sec(
          'Keys in DBMS',
          table(
            ['Key', 'Purpose'],
            [
              ['Primary', 'identifies each row; unique, never NULL'],
              ['Candidate', 'minimal unique set; the PK is picked from these'],
              ['Super', 'any set of columns that is unique'],
              ['Alternate', 'a candidate key not chosen as PK'],
              ['Foreign', 'points to a PK in another table'],
              ['Composite', 'a key made of 2+ columns'],
              ['Unique', 'unique, but NULLs allowed'],
              ['Surrogate', 'an artificial ID (auto-increment)'],
            ],
          ),
        ),
        sec(
          'Indexing',
          table(
            ['Index', 'Used for'],
            [
              ['Primary', 'the sorted primary key'],
              ['Secondary', 'non-ordering columns'],
              ['Clustered', 'rows stored in index order'],
              ['Non-clustered', 'separate, points to rows'],
              ['B+ tree', 'equality + range (most common)'],
              ['Hash', 'equality only, very fast'],
            ],
          ),
        ),
        sec(
          'File Organization',
          table(
            ['Type', 'Key point'],
            [
              ['Heap', 'no order: fast insert, slow search'],
              ['Sequential', 'sorted: good for ranges'],
              ['Hashed', 'hash function: fast equality'],
              ['Indexed', 'index + file: fast search'],
            ],
          ),
        ),
        sec(
          'Recovery',
          table(
            ['Technique', 'Purpose'],
            [
              ['Log-based', 'keeps undo / redo information'],
              ['Checkpoint', 'shortens recovery'],
              ['Undo', 'removes uncommitted changes'],
              ['Redo', 're-applies committed changes'],
              ['WAL', 'log is written before the data'],
            ],
          ),
        ),
        sec(
          'DELETE vs TRUNCATE vs DROP',
          table(
            ['', 'DELETE', 'TRUNCATE', 'DROP'],
            [
              ['Type', 'DML', 'DDL', 'DDL'],
              ['Removes', 'chosen rows (WHERE)', 'all rows', 'the whole table'],
              ['Structure', 'kept', 'kept', 'removed'],
              ['Rollback', 'yes', 'usually no*', 'usually no*'],
              ['Speed', 'slow (row by row)', 'fast', 'fast'],
            ],
          ),
          p('* depends on the DBMS: PostgreSQL can roll both back inside a transaction.'),
        ),
      ],
    ),
    row(
      sec(
        'Common Interview Questions',
        circles(
          'What is a DBMS? How is it different from a file system?',
          'Explain the ACID properties.',
          'DELETE vs TRUNCATE vs DROP?',
          'What is a primary key? Can it be NULL?',
          'Explain normalization with an example.',
          'What is a foreign key?',
          'Clustered vs non-clustered index?',
          'What is a view? When would you use one?',
          'What are the types of joins?',
          'What is a deadlock? How do you prevent it?',
        ),
      ),
      sec(
        'Important Differences (Exam)',
        circles(
          'Primary key vs Unique key',
          'WHERE vs HAVING',
          'INNER JOIN vs OUTER JOIN',
          'View vs Table',
          'IN vs EXISTS',
          '2NF vs 3NF vs BCNF',
          'B+ tree vs Hash index',
          'Serial vs Concurrent execution',
          'Dense vs Sparse index',
          'Checkpoint vs Log-based recovery',
        ),
      ),
    ),
    full(
      {
        ...sec(
          'Key Takeaways (Final Revision)',
          stars2(
            'A DBMS stores data safely, consistently and efficiently.',
            'Keys identify rows and link tables.',
            'Normalization removes redundancy and anomalies.',
            'Views give a simpler, safer window on the data.',
            'Indexes speed up reads but cost space and write time.',
            'SQL defines, changes, queries and controls data.',
            'Transactions are ACID: all or nothing.',
            'Concurrency control keeps parallel work safe.',
            'Recovery uses logs, undo / redo and checkpoints.',
            'Choose file organization and indexes from the queries you run.',
          ),
        ),
        star: true,
      },
    ),
  ],
  quote: 'Revise the tables, practise the queries, and you’re exam-ready.',
});
