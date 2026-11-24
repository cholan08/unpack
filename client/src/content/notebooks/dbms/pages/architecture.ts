import { definePage, exam, note, p, row, sec, sketch, sub, ul } from '../../dsl';

export default definePage({
  rows: [
    row(
      sec(
        'What is DBMS Architecture ?',
        ul(
          'DBMS architecture is the overall __design__ of a database system: its __parts__, how they __talk__ to each other, and how __data flows__ between users, apps and storage.',
          'It decides __where__ the user interface, the business logic and the database run: one machine or many.',
          'Two ways to look at it: the __three-schema__ levels and the __tiers__ (1-tier, 2-tier, 3-tier).',
        ),
      ),
      sec(
        'Levels of Abstraction (Three-Schema)',
        p('The DBMS separates what users __see__ from how data is __stored__, using three levels:'),
        sketch({
          w: 390,
          h: 236,
          nodes: [
            { id: 'e', x: 92, y: 34, w: 160, h: 48, text: 'External Level\n(View Level)', tone: 'blue', bold: true, size: 14 },
            { id: 'c', x: 92, y: 118, w: 160, h: 48, text: 'Conceptual Level\n(Logical Level)', tone: 'blue', bold: true, size: 14 },
            { id: 'i', x: 92, y: 202, w: 160, h: 48, text: 'Internal Level\n(Physical Level)', tone: 'blue', bold: true, size: 14 },
            { id: 'ne', shape: 'note', x: 296, y: 34, w: 178, h: 50, text: 'Different views per user\ne.g. Student / Faculty view', size: 12.5 },
            { id: 'nc', shape: 'note', x: 296, y: 118, w: 178, h: 50, text: 'Whole logical structure:\ntables, relations, rules', size: 12.5 },
            { id: 'ni', shape: 'note', x: 296, y: 202, w: 178, h: 50, text: 'How data sits on disk:\nfiles, pages, indexes', size: 12.5 },
          ],
          edges: [
            { from: 'e', to: 'c', arrow: 'both' },
            { from: 'c', to: 'i', arrow: 'both' },
            { from: 'ne', to: 'e', dash: true },
            { from: 'nc', to: 'c', dash: true },
            { from: 'ni', to: 'i', dash: true },
          ],
        }),
      ),
      [1, 1.15],
    ),
    row(
      sec(
        '1-Tier Architecture',
        ul(
          'User, application and database all live on the __same machine__.',
          'The user works with the database __directly__.',
          'Used for __learning__, personal or very small apps.',
          'Examples: SQLite inside a desktop app, MS Access.',
        ),
        sketch({
          w: 250,
          h: 90,
          nodes: [{ id: 'm', x: 125, y: 45, w: 220, h: 72, icon: 'pc', text: 'User + Application\n+ Database', size: 15, bold: true }],
        }),
      ),
      sec(
        '2-Tier Architecture (Client–Server)',
        ul(
          'The __client__ (UI + app) runs on one machine, the __database server__ on another.',
          'The client sends __SQL__ straight to the server; results come back.',
          'Simple and fast for __small–medium__ apps, e.g. an office app on a LAN.',
          'Weak spots: every client holds DB credentials, and it is hard to scale to thousands of users.',
        ),
        sketch({
          w: 380,
          h: 124,
          nodes: [
            { id: 'cl', x: 70, y: 62, w: 126, h: 62, icon: 'pc', text: 'Client\n(User\nInterface)', size: 13 },
            { id: 'sv', x: 308, y: 62, w: 136, h: 70, icon: 'server', text: 'Database\nServer', size: 14, bold: true, tone: 'blue' },
          ],
          edges: [
            { from: 'cl', to: 'sv', curve: -22, label: 'SQL Queries', ly: -9 },
            { from: 'sv', to: 'cl', curve: -22, label: 'Results', ly: 10 },
          ],
        }),
      ),
    ),
    row(
      sec(
        '3-Tier Architecture',
        ul(
          'Three layers: __Presentation__ (UI), __Application__ (business logic) and __Database__.',
          'The client __never__ talks to the database directly; the app server does it.',
          'Better __security__, __scalability__ and __maintainability__.',
          'Used by almost every __web app__.',
        ),
        sketch({
          w: 400,
          h: 250,
          nodes: [
            { id: 'c', x: 112, y: 36, w: 196, h: 54, icon: 'pc', text: 'Client\n(Presentation Layer)', size: 13.5, bold: true },
            { id: 'a', x: 112, y: 125, w: 196, h: 54, icon: 'server', text: 'Application Server\n(Business Logic)', size: 13.5, bold: true },
            { id: 'd', x: 112, y: 214, w: 196, h: 54, icon: 'db', text: 'Database Server\n(Data Layer)', size: 13.5, bold: true },
            { id: 'nc', shape: 'note', x: 310, y: 36, w: 164, h: 46, text: 'Browser / mobile app\n(React)', size: 12.5 },
            { id: 'na', shape: 'note', x: 310, y: 125, w: 164, h: 46, text: 'Handles requests, rules\n(Node + Express)', size: 12.5 },
            { id: 'nd', shape: 'note', x: 310, y: 214, w: 164, h: 46, text: 'Stores the data\n(MongoDB, MySQL…)', size: 12.5 },
          ],
          edges: [
            { from: 'c', to: 'a', arrow: 'both' },
            { from: 'a', to: 'd', arrow: 'both' },
            { from: 'nc', to: 'c', dash: true },
            { from: 'na', to: 'a', dash: true },
            { from: 'nd', to: 'd', dash: true },
          ],
        }),
        note('MERN link:', p('A MERN app __is__ 3-tier: __React__ (presentation) → __Express + Node__ (logic) → __MongoDB__ (data).')),
      ),
      sec(
        'Data Independence',
        ul(
          'Change the schema at one level __without__ breaking the level above it.',
          'Makes the system easy to __maintain__ and __change__.',
        ),
        sub(
          '(1) Physical Data Independence',
          ul(
            'Change the __internal__ schema without touching the conceptual or external schemas.',
            'e.g. add an index, move files to an SSD, change file organisation.',
          ),
        ),
        sub(
          '(2) Logical Data Independence',
          ul(
            'Change the __conceptual__ schema without breaking user views or apps.',
            'e.g. add a new column to a table; old views and queries still work.',
            '__Harder__ to achieve than physical independence.',
          ),
        ),
      ),
    ),
    row(
      sec(
        'Advantages of Three-Schema Architecture',
        ul(
          'Data abstraction: each user sees only what they need.',
          'Supports both kinds of data independence.',
          'Better security: views can hide columns.',
          'Many user views over one database.',
          'Easier maintenance and change.',
        ),
      ),
      exam(
        'Three levels: **External**, **Conceptual**, **Internal**.',
        'External = user __view__, conceptual = __logical__ structure, internal = __physical__ storage.',
        'Mappings between levels give __physical__ and __logical__ data independence.',
        'Logical independence is harder than physical.',
        '__3-tier__ is the standard for web apps.',
      ),
    ),
  ],
  quote: 'Separate what users see from how the data is stored.',
});
