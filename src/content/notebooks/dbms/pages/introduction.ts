import { definePage, full, note, p, pairs, row, sec, sketch, table, ul, ul2 } from '../../dsl';

export default definePage({
  rows: [
    row(
      sec(
        'What is DBMS ?',
        ul(
          'A **DBMS** (Database Management System) is software that lets you __create__, __store__, __retrieve__ and __update__ data in an organised way.',
          'It sits as an __interface__ between the __users / apps__ and the __stored data__, so nobody touches the files directly.',
          'It handles __large amounts__ of data __safely__ and __efficiently__, even with many users at once.',
          'Examples: `MySQL`, `PostgreSQL`, `Oracle`, `SQL Server`, `MongoDB`.',
        ),
      ),
      sec(
        'Key Components of DBMS',
        pairs(
          ['Hardware', 'servers, disks, memory'],
          ['Software', 'the DBMS itself + the OS'],
          ['Data', 'stored facts + metadata'],
          ['Procedures', 'rules for use, backup, recovery'],
          ['Users', 'end users, developers, DBA'],
          ['Query Processor', 'parses & runs queries'],
          ['Storage Manager', 'reads / writes the disk'],
        ),
      ),
      [1.15, 1],
    ),
    row(
      sec(
        'File System vs DBMS',
        table(
          ['Feature', 'File System', 'DBMS'],
          [
            ['Data storage', 'Separate files', 'One centralised database'],
            ['Redundancy', 'High (copies everywhere)', 'Low (controlled)'],
            ['Consistency', 'Hard to keep', 'Easy to keep'],
            ['Data sharing', 'Limited, unsafe', 'Controlled & secure'],
            ['Security', 'Basic (file permissions)', 'Users, roles, access rules'],
            ['Data independence', 'No', 'Yes'],
            ['Concurrent access', 'Clashes / overwrites', 'Many users safely'],
            ['Backup & recovery', 'Manual', 'Built in, automatic'],
            ['Integrity', 'Not enforced', 'Enforced by constraints'],
            ['Querying', 'Write a program', 'One SQL query'],
          ],
        ),
      ),
      sec(
        'How a DBMS Works',
        sketch({
          w: 320,
          h: 250,
          nodes: [
            { id: 'u', shape: 'box', x: 130, y: 30, w: 210, h: 46, text: 'Users\n(End users / Developers / DBA)', size: 13 },
            { id: 'd', shape: 'box', x: 130, y: 118, w: 120, h: 50, text: 'DBMS\n(Software)', bold: true, size: 16, tone: 'blue' },
            { id: 'q', shape: 'box', x: 272, y: 118, w: 82, h: 46, text: 'SQL\nQueries', size: 14 },
            { id: 'db', shape: 'db', x: 130, y: 206, w: 108, h: 72, text: 'Database\n(Stored Data)', size: 13 },
          ],
          edges: [
            { from: 'u', to: 'd', arrow: 'both' },
            { from: 'd', to: 'q', arrow: 'both' },
            { from: 'd', to: 'db', arrow: 'both' },
          ],
        }),
        note(
          'Important Point:',
          p('A DBMS lets __many users__ read and change the __same data__ at the same time, while keeping it __correct__ (integrity) and __safe__ (security).'),
        ),
      ),
      [1.2, 1],
    ),
    row(
      sec(
        'Advantages of DBMS',
        ul(
          'Less data redundancy (no needless copies).',
          'Better data consistency.',
          'Security and access control.',
          'Many users can work at the same time.',
          'Integrity kept by constraints.',
          'Backup and recovery built in.',
          'Data independence (logical + physical).',
          'Easy data sharing and fast querying.',
        ),
      ),
      sec(
        'Disadvantages of DBMS',
        ul(
          'Costly software, hardware and licences.',
          'Complex to design and maintain.',
          'Needs trained people (DBA).',
          'Uses more memory and CPU.',
          'Overkill for very small apps.',
          'One failure can affect the whole database.',
          'Needs regular backup and tuning.',
        ),
      ),
    ),
    full(
      sec(
        'Real-world Applications',
        ul2(
          'Banking: accounts, transactions',
          'E-commerce: products, orders, users',
          'Universities: students, courses, results',
          'Hospitals: patient records',
          'Airlines & railways: reservations',
          'Social media: profiles, posts, likes',
          'Telecom: call records, billing',
          'Online payments (UPI, cards)',
          'Retail & inventory management',
          'Government records',
        ),
      ),
    ),
  ],
  quote: 'A DBMS turns raw data into something safe, shared and easy to query.',
});
