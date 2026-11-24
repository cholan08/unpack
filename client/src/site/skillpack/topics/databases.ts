import type { ToolTopics } from './types';

export const DATABASES: ToolTopics = {
  mysql: [
    { title: 'Getting Started', topics: ['What is a relational database', 'Installing MySQL', 'MySQL Workbench', 'mysql CLI', 'Databases & tables'] },
    { title: 'SQL Basics', topics: ['CREATE TABLE', 'Data types', 'INSERT', 'SELECT', 'WHERE', 'ORDER BY', 'LIMIT', 'UPDATE', 'DELETE', 'DISTINCT', 'LIKE & wildcards', 'IN & BETWEEN', 'NULL handling'] },
    { title: 'Querying Data', topics: ['Aggregate functions', 'GROUP BY', 'HAVING', 'INNER JOIN', 'LEFT & RIGHT JOIN', 'Self join', 'UNION', 'Subqueries', 'CTEs', 'Window functions', 'CASE expressions'] },
    { title: 'Schema Design', topics: ['Primary keys', 'Foreign keys', 'Constraints', 'AUTO_INCREMENT', 'Normalisation 1NF–3NF', 'Relationships', 'ER diagrams', 'ALTER TABLE'] },
    { title: 'Indexes & Performance', topics: ['How indexes work', 'Creating indexes', 'Composite indexes', 'EXPLAIN', 'Slow query log', 'Query optimisation'] },
    { title: 'Transactions', topics: ['ACID', 'BEGIN, COMMIT, ROLLBACK', 'Isolation levels', 'Locking', 'Deadlocks', 'InnoDB'] },
    { title: 'Programmability', topics: ['Views', 'Stored procedures', 'Functions', 'Triggers', 'Events'] },
    { title: 'Administration', topics: ['Users & privileges', 'Backups with mysqldump', 'Restore', 'Replication', 'Configuration tuning'] },
    { title: 'In Practice', topics: ['Connecting from Node / Python', 'Connection pooling', 'SQL injection prevention', 'ORMs', 'Managed MySQL (RDS)'] },
  ],

  postgresql: [
    { title: 'Getting Started', topics: ['What is PostgreSQL', 'Installing Postgres', 'psql', 'pgAdmin', 'Databases & schemas'] },
    { title: 'SQL Basics', topics: ['CREATE TABLE', 'Data types', 'INSERT', 'SELECT', 'WHERE', 'ORDER BY & LIMIT', 'UPDATE', 'DELETE', 'RETURNING', 'NULL handling'] },
    { title: 'Querying Data', topics: ['Aggregates', 'GROUP BY & HAVING', 'Joins', 'Subqueries', 'CTEs', 'Recursive CTEs', 'Window functions', 'UNION & INTERSECT', 'LATERAL joins'] },
    { title: 'Schema Design', topics: ['Primary keys', 'Foreign keys', 'Constraints', 'Identity columns', 'Normalisation', 'Enums', 'Domains'] },
    { title: 'Postgres Features', topics: ['JSONB', 'Arrays', 'Full-text search', 'UUIDs', 'Generated columns', 'Upserts: ON CONFLICT'] },
    { title: 'Indexes & Performance', topics: ['B-tree indexes', 'GIN & GiST', 'Partial indexes', 'EXPLAIN ANALYZE', 'VACUUM', 'Statistics', 'Query tuning'] },
    { title: 'Transactions', topics: ['ACID', 'MVCC', 'Isolation levels', 'Locks', 'Advisory locks'] },
    { title: 'Programmability', topics: ['Views', 'Materialized views', 'Functions', 'PL/pgSQL', 'Triggers'] },
    { title: 'Security', topics: ['Roles & privileges', 'Row-level security', 'SSL connections'] },
    { title: 'Administration', topics: ['Backups with pg_dump', 'Point-in-time recovery', 'Replication', 'Partitioning', 'Connection pooling (PgBouncer)'] },
    { title: 'Extensions', topics: ['PostGIS', 'pgvector', 'pg_stat_statements', 'TimescaleDB'] },
  ],

  mongodb: [
    { title: 'Getting Started', topics: ['What is MongoDB', 'Documents & BSON', 'Collections', 'Installing MongoDB', 'mongosh', 'Compass', 'Atlas free cluster'] },
    { title: 'CRUD', topics: ['insertOne & insertMany', 'find & findOne', 'Query operators', 'Projection', 'Sorting & limiting', 'updateOne & updateMany', 'Update operators', 'deleteOne & deleteMany', 'Upserts'] },
    { title: 'Data Modelling', topics: ['Embedding vs referencing', 'One-to-many patterns', 'Many-to-many patterns', 'Schema design patterns', 'Schema validation'] },
    { title: 'Indexes', topics: ['Single-field indexes', 'Compound indexes', 'Unique indexes', 'TTL indexes', 'Text indexes', 'Geospatial indexes', 'explain()'] },
    { title: 'Aggregation', topics: ['Pipeline stages', '$match', '$group', '$project', '$sort & $limit', '$lookup', '$unwind', '$facet'] },
    { title: 'Mongoose', topics: ['Schemas & models', 'Validation', 'Middleware hooks', 'Population', 'Virtuals', 'Lean queries'] },
    { title: 'Advanced', topics: ['Transactions', 'Change streams', 'Atlas Search', 'Vector search', 'GridFS'] },
    { title: 'Scaling & Ops', topics: ['Replica sets', 'Sharding', 'Read & write concerns', 'Backups', 'Monitoring', 'Security & auth'] },
  ],

  couchdb: [
    { title: 'Getting Started', topics: ['What is CouchDB', 'Installing CouchDB', 'Fauxton UI', 'The HTTP API'] },
    { title: 'Documents', topics: ['Creating documents', 'Revisions (_rev)', 'Updating & deleting', 'Attachments', 'Bulk operations'] },
    { title: 'Querying', topics: ['Mango queries', 'Indexes', 'Map/reduce views', 'Design documents'] },
    { title: 'Replication & Sync', topics: ['Replication', 'Conflict resolution', 'Changes feed', 'PouchDB sync'] },
    { title: 'Operations', topics: ['Clustering', 'Users & security', 'Backups', 'Monitoring'] },
  ],

  cassandra: [
    { title: 'Getting Started', topics: ['What is Cassandra', 'Distributed basics', 'Installing Cassandra', 'cqlsh'] },
    { title: 'CQL', topics: ['Keyspaces', 'Tables', 'Data types', 'INSERT & SELECT', 'UPDATE & DELETE', 'Collections', 'TTL'] },
    { title: 'Data Modelling', topics: ['Query-first design', 'Partition keys', 'Clustering columns', 'Denormalisation', 'Wide partitions'] },
    { title: 'Architecture', topics: ['Ring & tokens', 'Replication factor', 'Consistency levels', 'Gossip', 'Write path', 'Read path'] },
    { title: 'Advanced', topics: ['Compaction', 'Tombstones', 'Secondary indexes', 'Materialised views', 'Lightweight transactions', 'Batches'] },
    { title: 'Operations', topics: ['nodetool', 'Repair', 'Monitoring', 'Backups', 'Astra / Keyspaces'] },
  ],

  elasticsearch: [
    { title: 'Getting Started', topics: ['What is Elasticsearch', 'Installing Elasticsearch', 'Kibana Dev Tools', 'The REST API'] },
    { title: 'Data', topics: ['Indices', 'Documents', 'Indexing data', 'Bulk API', 'Updating & deleting'] },
    { title: 'Mappings', topics: ['Field types', 'Dynamic mapping', 'Explicit mapping', 'Analysers', 'Tokenisers'] },
    { title: 'Search', topics: ['Query DSL', 'match query', 'term query', 'bool query', 'Filters vs queries', 'Relevance scoring', 'Highlighting', 'Fuzzy search', 'Pagination'] },
    { title: 'Aggregations', topics: ['Metric aggregations', 'Bucket aggregations', 'Nested aggregations'] },
    { title: 'Advanced', topics: ['Vector search', 'Autocomplete', 'Synonyms', 'Index templates', 'Aliases', 'Reindexing'] },
    { title: 'Operations', topics: ['Shards & replicas', 'Cluster health', 'Index lifecycle management', 'Snapshots', 'Security'] },
  ],

  neo4j: [
    { title: 'Getting Started', topics: ['What is a graph database', 'Nodes, relationships, properties', 'Installing Neo4j', 'Neo4j Browser'] },
    { title: 'Cypher', topics: ['CREATE', 'MATCH', 'WHERE', 'RETURN', 'MERGE', 'SET & REMOVE', 'DELETE', 'Patterns', 'Variable-length paths', 'Aggregation', 'WITH'] },
    { title: 'Modelling', topics: ['Graph data modelling', 'Labels', 'Relationship types', 'Refactoring models'] },
    { title: 'Performance', topics: ['Indexes', 'Constraints', 'PROFILE & EXPLAIN'] },
    { title: 'Advanced', topics: ['Shortest path', 'APOC library', 'Graph Data Science', 'Importing CSV'] },
    { title: 'In Practice', topics: ['Drivers', 'Recommendations', 'AuraDB', 'Clustering'] },
  ],

  arangodb: [
    { title: 'Getting Started', topics: ['What is multi-model', 'Installing ArangoDB', 'Web interface', 'Collections'] },
    { title: 'AQL', topics: ['FOR & RETURN', 'FILTER & SORT', 'INSERT, UPDATE, REMOVE', 'Joins', 'COLLECT (grouping)'] },
    { title: 'Graphs', topics: ['Edge collections', 'Named graphs', 'Traversals', 'Shortest path'] },
    { title: 'Advanced', topics: ['Indexes', 'ArangoSearch', 'Transactions', 'Foxx microservices'] },
    { title: 'Operations', topics: ['Clustering', 'Drivers', 'Backups'] },
  ],

  redis: [
    { title: 'Getting Started', topics: ['What is Redis', 'Installing Redis', 'redis-cli', 'Keys & naming'] },
    { title: 'Data Types', topics: ['Strings', 'Lists', 'Sets', 'Hashes', 'Sorted sets', 'Bitmaps', 'HyperLogLog', 'Geospatial', 'JSON'] },
    { title: 'Key Management', topics: ['EXPIRE & TTL', 'SCAN', 'Key eviction', 'Memory usage'] },
    { title: 'Patterns', topics: ['Caching', 'Cache-aside', 'Session store', 'Rate limiting', 'Leaderboards', 'Distributed locks', 'Counters'] },
    { title: 'Messaging', topics: ['Pub/Sub', 'Streams', 'Consumer groups', 'Queues with lists'] },
    { title: 'Advanced', topics: ['Transactions (MULTI)', 'Pipelining', 'Lua scripts', 'Redis Search', 'Vector search'] },
    { title: 'Persistence & Scaling', topics: ['RDB snapshots', 'AOF', 'Replication', 'Sentinel', 'Redis Cluster'] },
    { title: 'In Practice', topics: ['Redis with Node', 'Redis with Python', 'Monitoring', 'Security', 'Managed Redis'] },
  ],

  kafka: [
    { title: 'Getting Started', topics: ['What is Kafka', 'Event streaming', 'Installing Kafka', 'KRaft mode', 'CLI tools'] },
    { title: 'Core Concepts', topics: ['Topics', 'Partitions', 'Brokers', 'Producers', 'Consumers', 'Consumer groups', 'Offsets', 'Retention'] },
    { title: 'Producers', topics: ['Keys & partitioning', 'Acks', 'Retries', 'Idempotent producers', 'Batching & compression'] },
    { title: 'Consumers', topics: ['Polling', 'Committing offsets', 'Rebalancing', 'Delivery semantics'] },
    { title: 'Ecosystem', topics: ['Kafka Connect', 'Kafka Streams', 'ksqlDB', 'Schema Registry', 'Avro & Protobuf'] },
    { title: 'Advanced', topics: ['Exactly-once semantics', 'Transactions', 'Log compaction', 'Replication & ISR'] },
    { title: 'Operations', topics: ['Monitoring consumer lag', 'Security', 'Tuning', 'Managed Kafka'] },
  ],

  rabbitmq: [
    { title: 'Getting Started', topics: ['What is RabbitMQ', 'AMQP', 'Installing RabbitMQ', 'Management UI'] },
    { title: 'Core Concepts', topics: ['Producers', 'Queues', 'Consumers', 'Exchanges', 'Bindings', 'Routing keys'] },
    { title: 'Exchanges', topics: ['Direct exchange', 'Fanout exchange', 'Topic exchange', 'Headers exchange'] },
    { title: 'Reliability', topics: ['Acknowledgements', 'Durable queues', 'Persistent messages', 'Publisher confirms', 'Prefetch'] },
    { title: 'Patterns', topics: ['Work queues', 'Pub/Sub', 'RPC', 'Dead-letter queues', 'Delayed retries'] },
    { title: 'Operations', topics: ['Quorum queues', 'Streams', 'Clustering', 'Monitoring', 'Security'] },
  ],

  'amazon-sqs': [
    { title: 'Getting Started', topics: ['What is SQS', 'Standard queues', 'FIFO queues', 'Creating a queue'] },
    { title: 'Messaging', topics: ['Sending messages', 'Receiving messages', 'Deleting messages', 'Message attributes', 'Batching'] },
    { title: 'Behaviour', topics: ['Visibility timeout', 'Long polling', 'Delay queues', 'Message retention', 'Deduplication'] },
    { title: 'Reliability', topics: ['Dead-letter queues', 'Redrive', 'Idempotent consumers'] },
    { title: 'Integration', topics: ['AWS SDK', 'Lambda triggers', 'SNS fan-out', 'EventBridge'] },
    { title: 'Operations', topics: ['IAM policies', 'Encryption', 'CloudWatch metrics', 'Cost'] },
  ],

  zeromq: [
    { title: 'Getting Started', topics: ['What is ZeroMQ', 'Brokerless messaging', 'Installing bindings', 'Contexts & sockets'] },
    { title: 'Patterns', topics: ['REQ / REP', 'PUB / SUB', 'PUSH / PULL', 'PAIR', 'ROUTER / DEALER'] },
    { title: 'Messages', topics: ['Multipart messages', 'Framing', 'Envelopes'] },
    { title: 'Transports', topics: ['tcp', 'ipc', 'inproc'] },
    { title: 'Advanced', topics: ['Reliability patterns', 'Load balancing', 'Proxies', 'CurveZMQ security', 'Performance tuning'] },
  ],
};
