import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'mongodb',
  title: 'MongoDB',
  name: 'MongoDB',
  tagline: 'The document database behind MERN: CRUD, queries, data modelling, indexes, aggregation and Mongoose.',
  color: 'green',
  pillar: 'database',
  order: 20,
  cover: {
    big: 'MONGODB',
    full: 'MongoDB',
    cloud: ['Documents,', 'not rows:', 'data as', 'JSON'],
    art: {
      topLeft: iconArt('db', 'Mongo', 'green'),
      topRight: flowArt(['Database', 'Collection', 'Document', 'Field'], 'green'),
      left: codeArt(['db.users.find(', '  { age: { $gt: 20 } }', ')'], 'Query'),
      centre: hubArt('MongoDB', ['CRUD', 'Indexes', 'Aggregation', 'Replicas'], 'db', 'green'),
    },
    side: { title: 'CRUD', items: ['insertOne', 'find', 'updateOne', 'deleteOne'] },
    why: { title: 'Why MongoDB ?', items: ['Flexible schema', 'JSON end to end (MERN)', 'Scales horizontally', 'Quick to start'] },
    footer: 'Model data the way you read it!',
  },
  pages: [
    pg('introduction', 'Introduction to MongoDB', 'NoSQL and document databases', 'Documents, collections, databases', 'BSON and _id', 'MongoDB vs SQL'),
    pg('crud', 'CRUD Operations', 'insertOne / insertMany', 'find and projections', 'updateOne with $set, $inc, $push', 'deleteOne / deleteMany'),
    pg('queries', 'Query Operators', 'Comparison: $gt, $in …', 'Logical: $and, $or', 'Arrays and embedded documents', 'sort, limit, skip'),
    pg('modelling', 'Data Modelling', 'Embed vs reference', 'One-to-many patterns', 'Schema design patterns', 'Document size limits'),
    pg('indexes', 'Indexes', 'Single-field and compound indexes', 'Reading explain()', 'Text and geo indexes', 'Index trade-offs'),
    pg('aggregation', 'Aggregation Pipeline', '$match, $group, $project', '$lookup (joins)', '$unwind and $sort', 'Pipeline examples'),
    pg('mongoose', 'Mongoose', 'Schemas and models', 'Validation', 'Middleware (hooks)', 'populate()'),
    pg('transactions', 'Transactions & Consistency', 'Atomic single-document writes', 'Multi-document transactions', 'Read and write concerns', 'Schema validation'),
    pg('scaling', 'Replication & Sharding', 'Replica sets', 'Elections and failover', 'Sharding and shard keys', 'MongoDB Atlas'),
    revision('SQL vs MongoDB', 'Embed vs reference', 'find vs aggregate'),
  ],
});
