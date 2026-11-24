import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'system-design',
  title: 'System Design',
  name: 'System Design',
  tagline: 'Designing for millions: scaling, caching, databases at scale, CAP, queues, reliability, case studies and LLD.',
  color: 'purple',
  pillar: 'backend',
  order: 70,
  cover: {
    big: 'SYSTEM DESIGN',
    full: 'System Design',
    cloud: ['Scale it,', 'keep it up,', 'keep it', 'simple'],
    art: {
      topLeft: iconArt('cloud', 'Scale', 'purple'),
      topRight: flowArt(['Users', 'Load balancer', 'App servers', 'DB + cache'], 'purple'),
      left: codeArt(['QPS ≈ 10,000', 'reads : writes = 9 : 1', 'p99 latency < 200 ms'], 'Estimate'),
      centre: hubArt('System', ['Scalability', 'Availability', 'Consistency', 'Latency'], 'box', 'purple'),
    },
    side: { title: 'Blocks', items: ['Load balancer', 'Cache', 'Queue', 'CDN'] },
    why: { title: 'Why System Design ?', items: ['A must for senior interviews', 'Build for millions of users', 'Understand trade-offs', 'Think like an architect'] },
    footer: 'Every choice is a trade-off!',
  },
  pages: [
    pg('introduction', 'Introduction to System Design', 'HLD vs LLD', 'Functional vs non-functional requirements', 'How to approach the interview', 'Back-of-the-envelope estimates'),
    pg('scaling', 'Scalability', 'Vertical vs horizontal scaling', 'Stateless services', 'Load balancers and algorithms', 'Auto-scaling'),
    pg('caching', 'Caching', 'Where to cache: client, CDN, app, DB', 'Eviction: LRU, LFU', 'Write-through vs write-back', 'Cache stampede'),
    pg('databases', 'Databases at Scale', 'Replication', 'Sharding and partition keys', 'Choosing SQL or NoSQL', 'Indexes'),
    pg('cap', 'CAP & Consistency', 'The CAP theorem', 'PACELC', 'Strong vs eventual consistency', 'Quorums'),
    pg('messaging', 'Queues & Event-Driven Design', 'Message queues vs pub/sub', 'Kafka basics', 'Async processing', 'The exactly-once myth'),
    pg('reliability', 'Availability & Reliability', 'Redundancy and failover', 'Rate limiting', 'Circuit breakers', 'SLA, SLO, SLI'),
    pg('networking', 'Networking for System Design', 'DNS and CDN', 'API gateway', 'Reverse proxy', 'WebSockets at scale'),
    pg('patterns', 'Microservices & Patterns', 'Service boundaries', 'Saga pattern', 'CQRS', 'Service discovery'),
    pg('case-studies', 'Case Studies', 'URL shortener', 'Chat app', 'News feed', 'Rate limiter'),
    pg('lld', 'Low-Level Design', 'SOLID principles', 'Design patterns', 'Class diagrams', 'Example: parking lot'),
    revision('HLD vs LLD', 'SQL vs NoSQL', 'Strong vs eventual consistency'),
  ],
});
