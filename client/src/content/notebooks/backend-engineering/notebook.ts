import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'backend-engineering',
  title: 'Backend',
  name: 'Backend Engineering',
  tagline: 'Beyond CRUD: architectures, data modelling, caching, queues, observability, scaling and running services in production.',
  color: 'green',
  pillar: 'backend',
  order: 60,
  cover: {
    big: 'BACKEND',
    full: 'Backend Engineering',
    cloud: ['Logic,', 'data, and', 'reliability', 'at scale'],
    art: {
      topLeft: iconArt('server', 'Backend', 'green'),
      topRight: flowArt(['Request', 'Validate', 'Business logic', 'Database'], 'green'),
      left: codeArt(['GET /orders/7', '→ auth → service', '→ repo → db', '← 200 OK'], 'Request'),
      centre: hubArt('Service', ['APIs', 'Data', 'Queues', 'Monitoring'], 'server', 'green'),
    },
    side: { title: 'Skills', items: ['APIs', 'Databases', 'Caching', 'Testing'] },
    why: { title: 'Why Backend ?', items: ['Powers every app', 'Solves real data problems', 'High-impact careers', 'Scale to millions'] },
    footer: 'Make it work, make it right, make it fast!',
  },
  pages: [
    pg('introduction', 'Introduction to Backend Engineering', 'What a backend does', 'The request lifecycle', 'Stateless vs stateful services', 'Backend roles and skills'),
    pg('architecture', 'Architectures', 'Monolith', 'Layers: controller, service, repository', 'Microservices', 'Serverless'),
    pg('data-modelling', 'Data Modelling & Databases', 'SQL vs NoSQL', 'Schema design', 'Transactions', 'Migrations'),
    pg('validation-errors', 'Validation & Error Handling', 'Validate at the edge', 'Error types and codes', 'Retries and idempotency', 'Consistent responses'),
    pg('caching', 'Caching', 'Cache-aside', 'TTL and invalidation', 'CDN and HTTP caching', 'Redis'),
    pg('queues', 'Background Jobs & Queues', 'Why async work', 'Message queues: RabbitMQ, Kafka', 'Workers and schedulers', 'At-least-once delivery'),
    pg('observability', 'Logging, Monitoring & Tracing', 'Structured logs', 'Metrics and dashboards', 'Distributed tracing', 'Alerts and SLOs'),
    pg('performance', 'Performance & Scaling', 'Finding bottlenecks', 'Connection pooling', 'Horizontal vs vertical scaling', 'Load balancing'),
    pg('testing', 'Testing the Backend', 'Unit, integration, end-to-end', 'Test doubles', 'Testing APIs', 'Test databases'),
    pg('operations', 'Config, Deployment & Operations', 'The twelve-factor app', 'Environment config', 'Zero-downtime deploys', 'Health checks'),
    revision('Monolith vs microservices', 'Sync vs async', 'Vertical vs horizontal scaling'),
  ],
});
