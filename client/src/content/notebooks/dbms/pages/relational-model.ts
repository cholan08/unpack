import { box, circles, definePage, mini, pairs, row, sec, table, ul } from '../../dsl';

const students = [
  ['1', 'Asha', '20', 'CSE'],
  ['2', 'Ravi', '21', 'ECE'],
  ['3', 'Meera', '19', 'IT'],
  ['4', 'Karan', '22', 'CSE'],
];

export default definePage({
  rows: [
    row(
      sec(
        'What is the Relational Model ?',
        ul(
          'Data is stored in __tables__, called __relations__.',
          'Based on __set theory__ and __predicate logic__.',
          'Each relation = __rows (tuples)__ + __columns (attributes)__.',
          'Proposed by **E. F. Codd** (1970) at IBM.',
          'The base of SQL databases: MySQL, PostgreSQL, Oracle, SQL Server.',
        ),
      ),
      sec(
        'Relation (Table)',
        ul(
          'A __relation__ is a table with rows and columns.',
          'Each __row__ is a __tuple__: one record.',
          'Each __column__ is an __attribute__: one field.',
          'All values in a column come from the same __domain__.',
          'Every value is __atomic__: one value, not a list.',
        ),
        mini('Student relation', ['RollNo', 'Name', 'Age', 'Branch'], students),
        box('columns ↓ = __attributes__ · rows → = __tuples__'),
      ),
    ),
    row(
      sec(
        'Schema and Instance',
        ul('**Schema**: the __structure__ of a relation: its name, attributes and types. Rarely changes.'),
        box('Student(RollNo INT, Name VARCHAR(50),', 'Age INT, Branch VARCHAR(10))'),
        ul('**Instance**: the __actual data__ in the relation at one moment. Changes all the time.'),
        mini('Instance (right now)', ['RollNo', 'Name', 'Age', 'Branch'], students.slice(0, 3)),
      ),
      [
        sec(
          'Domain',
          ul('A __domain__ is the set of all allowed values for an attribute.', 'Every attribute has exactly one domain.'),
          table(
            ['Attribute', 'Domain', 'Example values'],
            [
              ['RollNo', 'positive integers', '1, 2, 3 …'],
              ['Name', 'strings (≤ 50 chars)', '"Asha", "Ravi"'],
              ['Age', 'integers 16 – 60', '19, 20, 21'],
              ['Branch', '{CSE, ECE, IT, MECH}', '"CSE", "IT"'],
            ],
          ),
        ),
        sec(
          'Degree and Cardinality',
          ul('**Degree** = number of __attributes__ (columns).', '**Cardinality** = number of __tuples__ (rows).'),
          box('Student: **Degree = 4** (RollNo, Name, Age, Branch)', '**Cardinality = 4** (4 rows)'),
        ),
      ],
    ),
    row(
      [
        sec(
          'Properties of a Relation',
          circles(
            'The relation has a __unique name__.',
            'Each attribute has a __unique name__ inside it.',
            'Values in a column come from the __same domain__.',
            'Every value is __atomic__.',
            'No two tuples are __identical__.',
            'Order of __rows__ does not matter.',
            'Order of __columns__ does not matter.',
          ),
        ),
        sec(
          'Relational vs Other Models',
          table(
            ['Feature', 'Relational', 'Hierarchical / Network'],
            [
              ['Structure', 'Tables', 'Tree / Graph'],
              ['Links', 'Keys (values)', 'Pointers, parent-child'],
              ['Flexibility', 'High', 'Low'],
              ['Querying', 'Simple (SQL)', 'Complex (walk the links)'],
              ['Data independence', 'High', 'Low'],
              ['Used today', 'Everywhere', 'Legacy systems'],
            ],
          ),
        ),
      ],
      [
        sec(
          'Integrity Constraints',
          pairs(
            ['Domain', 'a value must belong to its domain'],
            ['Key', 'key values are unique'],
            ['Entity integrity', 'a primary key is __never NULL__'],
            ['Referential integrity', 'a foreign key must match an existing primary key (or be NULL)'],
          ),
        ),
        sec(
          'Advantages',
          ul(
            'Simple to understand: just tables.',
            'Strong mathematical base.',
            'Supports data independence.',
            'Powerful queries with SQL.',
            'Integrity through keys and constraints.',
          ),
        ),
        sec(
          'Disadvantages',
          ul(
            'Not ideal for complex data (multimedia, graphs).',
            'Joins can be slow on very large data.',
            'Fixed schema: changes need migrations.',
            'Hierarchies are hard to model directly.',
          ),
        ),
      ],
    ),
  ],
  quote: 'Tables, keys and rules: that’s the relational model.',
});
