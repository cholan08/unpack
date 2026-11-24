import { defineNotebook } from '../dsl';
import type { SketchNode } from '../types';

/* A tiny table doodle for the cover: 3 columns × 4 rows, header shaded. */
const cells: SketchNode[] = [];
for (let r = 0; r < 4; r++)
  for (let c = 0; c < 3; c++)
    cells.push({ id: `c${r}${c}`, shape: 'box', x: 52 + c * 38, y: 40 + r * 17, w: 38, h: 17, tone: r === 0 ? 'blue' : undefined });

export default defineNotebook({
  id: 'dbms',
  title: 'DBMS',
  name: 'Database Management System',
  tagline: 'The whole DBMS syllabus on 15 handwritten pages, from ER diagrams and keys to SQL joins, normalization, transactions and recovery.',
  color: 'blue',
  cover: {
    big: 'DBMS',
    full: 'Database Management System',
    cloud: ['Store it,', 'Shape it,', 'Query it,', 'Keep it safe'],
    art: {
      topLeft: {
        w: 130,
        h: 136,
        alt: 'A database cylinder labelled DBMS',
        nodes: [
          { id: 'db', shape: 'db', x: 65, y: 54, w: 78, h: 92, bands: 2, tone: 'blue' },
          { id: 't', shape: 'text', x: 65, y: 122, text: 'DBMS', size: 20, bold: true },
        ],
      },
      topRight: {
        w: 280,
        h: 150,
        alt: 'ER sketch: a Student entity with Name, Roll No, Age, Branch and Email attributes',
        nodes: [
          { id: 's', shape: 'box', x: 140, y: 76, w: 104, h: 34, text: 'Student', size: 17, bold: true },
          { id: 'n', shape: 'oval', x: 62, y: 22, w: 82, h: 32, text: 'Name' },
          { id: 'r', shape: 'oval', x: 218, y: 22, w: 92, h: 32, text: 'Roll No.', key: true },
          { id: 'a', shape: 'oval', x: 250, y: 82, w: 62, h: 30, text: 'Age' },
          { id: 'b', shape: 'oval', x: 52, y: 128, w: 84, h: 32, text: 'Branch' },
          { id: 'e', shape: 'oval', x: 210, y: 130, w: 82, h: 32, text: 'Email' },
        ],
        edges: ['n', 'r', 'a', 'b', 'e'].map((id) => ({ from: 's', to: id, arrow: 'none' as const })),
      },
      left: {
        w: 180,
        h: 150,
        alt: 'A table: rows are records, columns are attributes',
        nodes: [
          { id: 'h', shape: 'text', x: 90, y: 16, text: 'Table', size: 16, bold: true },
          ...cells,
          { id: 'p1', shape: 'point', x: 40, y: 108 },
          { id: 'p2', shape: 'point', x: 140, y: 108 },
          { id: 'rows', shape: 'text', x: 40, y: 128, text: 'Rows\n(Records)', size: 13 },
          { id: 'cols', shape: 'text', x: 140, y: 128, text: 'Columns\n(Attributes)', size: 13 },
        ],
        edges: [
          { from: 'p1', to: 'rows', arrow: 'both' },
          { from: 'p2', to: 'cols', arrow: 'both' },
        ],
      },
      centre: {
        w: 340,
        h: 232,
        alt: 'A database in the middle: data is stored, managed, retrieved and secured',
        nodes: [
          { id: 'db', shape: 'db', x: 170, y: 100, w: 112, h: 132, bands: 2, tone: 'blue' },
          { id: 'lbl', shape: 'text', x: 170, y: 188, text: 'Database', size: 16, bold: true },
          { id: 'st', shape: 'text', x: 40, y: 36, text: 'Store\nData', size: 15 },
          { id: 'mg', shape: 'text', x: 300, y: 36, text: 'Manage\nData', size: 15 },
          { id: 'rt', shape: 'text', x: 44, y: 196, text: 'Retrieve\nData', size: 15 },
          { id: 'sc', shape: 'text', x: 296, y: 196, text: 'Secure\nData', size: 15 },
        ],
        edges: [
          { from: 'st', to: 'db', curve: 18 },
          { from: 'mg', to: 'db', curve: -18 },
          { from: 'db', to: 'rt', curve: -14 },
          { from: 'db', to: 'sc', curve: 14 },
        ],
      },
    },
    side: { title: 'SQL', items: ['CREATE', 'READ', 'UPDATE', 'DELETE'] },
    why: {
      title: 'Why DBMS ?',
      items: ['Organised data', 'Less redundancy', 'Data security', 'Consistent data', 'Many users at once', 'Fast retrieval'],
    },
    footer: 'Organised data is power!',
  },
  pages: [
    { id: 'introduction', title: 'Introduction to DBMS' },
    { id: 'architecture', title: 'DBMS Architecture' },
    { id: 'data-models', title: 'Data Models & Database Languages' },
    { id: 'er-model', title: 'ER Model (Entity–Relationship)' },
    { id: 'relational-model', title: 'Relational Model' },
    { id: 'keys', title: 'Keys in DBMS' },
    { id: 'relational-algebra', title: 'Relational Algebra' },
    { id: 'sql-basics', title: 'SQL Fundamentals' },
    { id: 'sql-joins', title: 'SQL Joins & Functions' },
    { id: 'subqueries', title: 'Nested Queries (Subqueries)' },
    { id: 'views-normalization', title: 'Views, Indexes & Normalization' },
    { id: 'transactions', title: 'Transactions & Concurrency Control' },
    { id: 'storage-recovery', title: 'File Organization, Indexing & Recovery' },
    { id: 'revision', title: 'Quick Revision & Interview Questions' },
  ],
});
