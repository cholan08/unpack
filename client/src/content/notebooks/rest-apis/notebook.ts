import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'rest-apis',
  title: 'APIs',
  name: 'REST & GraphQL APIs',
  tagline: 'How apps talk: REST design, methods and status codes, securing and documenting APIs, GraphQL and real-time.',
  color: 'purple',
  pillar: 'backend',
  order: 30,
  cover: {
    big: 'API',
    full: 'REST & GraphQL APIs',
    cloud: ['Clients', 'ask,', 'servers', 'answer'],
    art: {
      topLeft: iconArt('server', 'API', 'purple'),
      topRight: flowArt(['Client', 'GET /users/42', 'Server', '200 + JSON'], 'purple'),
      left: codeArt(['GET    /users', 'POST   /users', 'PATCH  /users/42', 'DELETE /users/42'], 'REST'),
      centre: hubArt('API', ['Resources', 'Methods', 'Status\ncodes', 'JSON'], 'box', 'purple'),
    },
    side: { title: 'Methods', items: ['GET', 'POST', 'PUT / PATCH', 'DELETE'] },
    why: { title: 'Why APIs ?', items: ['How apps talk to each other', 'Frontend ↔ backend contract', 'Third-party integrations', 'Every backend job needs it'] },
    footer: 'A good API is a good contract!',
  },
  pages: [
    pg('introduction', 'Introduction to APIs', 'What an API is', 'Web APIs vs library APIs', 'The request / response cycle', 'The JSON format'),
    pg('rest', 'REST Principles', 'Resources and URIs', 'Statelessness', 'Uniform interface', 'Richardson maturity model'),
    pg('methods-status', 'HTTP Methods & Status Codes', 'Safe and idempotent methods', 'PUT vs PATCH', '2xx, 3xx, 4xx, 5xx', 'Choosing the right code'),
    pg('design', 'API Design Best Practices', 'Naming and nesting', 'Pagination, filtering, sorting', 'Versioning', 'An error format'),
    pg('securing', 'Securing APIs', 'API keys vs tokens', 'JWT bearer auth', 'CORS', 'Rate limiting'),
    pg('docs-testing', 'Documentation & Testing', 'OpenAPI / Swagger', 'Postman and curl', 'Contract tests', 'Mock servers'),
    pg('graphql', 'GraphQL', 'Schema, queries, mutations', 'Resolvers', 'Over- and under-fetching', 'REST vs GraphQL'),
    pg('realtime', 'Real-time APIs', 'Polling vs long polling', 'WebSockets', 'Server-Sent Events', 'Webhooks'),
    pg('rpc', 'gRPC, tRPC & Other Styles', 'gRPC and protobuf', 'RPC vs REST', 'tRPC', 'When to use which'),
    revision('REST vs GraphQL', 'PUT vs PATCH', '401 vs 403'),
  ],
});
