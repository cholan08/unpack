import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'redis',
  title: 'Redis',
  name: 'Redis & Caching',
  tagline: 'Data in memory: Redis data types, caching patterns, eviction, persistence, pub/sub, queues and using it from Node.',
  color: 'pink',
  pillar: 'database',
  order: 30,
  cover: {
    big: 'REDIS',
    full: 'Redis & Caching',
    cloud: ['Data in', 'memory:', 'answers in', 'microseconds'],
    art: {
      topLeft: iconArt('db', 'Redis', 'pink'),
      topRight: flowArt(['App', 'Cache hit?', 'Redis', 'Database'], 'pink'),
      left: codeArt(['SET user:1 "Asha"', 'GET user:1', 'EXPIRE user:1 60'], 'Commands'),
      centre: hubArt('Redis', ['Cache', 'Sessions', 'Queues', 'Leaderboards'], 'db', 'pink'),
    },
    side: { title: 'Types', items: ['String', 'Hash', 'List', 'Sorted set'] },
    why: { title: 'Why Redis ?', items: ['Makes apps much faster', 'Takes load off the DB', 'Simple, powerful structures', 'Used almost everywhere'] },
    footer: 'The fastest query is the one you skip!',
  },
  pages: [
    pg('introduction', 'Introduction to Redis', 'An in-memory key-value store', 'The single-threaded model', 'Use cases', 'redis-cli basics'),
    pg('data-types', 'Data Types', 'Strings and counters', 'Hashes', 'Lists and sets', 'Sorted sets'),
    pg('caching', 'Caching Patterns', 'Cache-aside', 'Write-through and write-behind', 'TTL and expiry', 'Invalidation strategies'),
    pg('eviction', 'Memory & Eviction', 'maxmemory', 'LRU, LFU and TTL policies', 'Naming keys', 'Big keys'),
    pg('persistence', 'Persistence', 'RDB snapshots', 'AOF log', 'Durability trade-offs', 'Backups'),
    pg('pubsub-streams', 'Pub/Sub, Streams & Queues', 'Publish / subscribe', 'Streams and consumer groups', 'Job queues (BullMQ)', 'Rate limiting with Redis'),
    pg('node', 'Redis with Node.js', 'Connecting a client', 'Caching an Express route', 'Sessions in Redis', 'Distributed locks'),
    pg('scaling', 'Replication & Cluster', 'Replicas', 'Sentinel failover', 'Redis Cluster and hash slots', 'Managed Redis'),
    revision('Redis vs database', 'RDB vs AOF', 'Cache-aside vs write-through'),
  ],
});
