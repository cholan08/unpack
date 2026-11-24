import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'express',
  title: 'Express',
  name: 'Express.js',
  tagline: 'Routes, middleware, errors and project structure for Node APIs: the E in MERN.',
  color: 'orange',
  pillar: 'backend',
  order: 20,
  cover: {
    big: 'EXPRESS',
    full: 'Express.js',
    cloud: ['Routes,', 'middleware,', 'and a', 'tidy API'],
    art: {
      topLeft: iconArt('server', 'Express', 'orange'),
      topRight: flowArt(['Request', 'Middleware', 'Route handler', 'Response'], 'orange'),
      left: codeArt(["app.get('/api/users',", '  (req, res) =>', '    res.json(users));'], 'Route'),
      centre: hubArt('app', ['Routes', 'Middleware', 'Errors', 'Static\nfiles'], 'box', 'orange'),
    },
    side: { title: 'req / res', items: ['req.params', 'req.query', 'req.body', 'res.json()'] },
    why: { title: 'Why Express ?', items: ['Minimal and flexible', 'Huge middleware ecosystem', 'The E in MERN', 'Easy to learn'] },
    footer: 'Everything is middleware!',
  },
  pages: [
    pg('introduction', 'Introduction to Express', 'What Express adds to Node', 'A hello-world server', 'Project structure', 'nodemon for development'),
    pg('routing', 'Routing', 'app.get / post / put / delete', 'Route params and query strings', 'express.Router', 'Route order matters'),
    pg('middleware', 'Middleware', 'The (req, res, next) chain', 'Built-in: json, urlencoded, static', 'Third-party: cors, helmet, morgan', 'Writing custom middleware'),
    pg('request-response', 'Request & Response', 'req.params, query, body, headers', 'res.status, json, send, redirect', 'Cookies', 'File uploads with multer'),
    pg('errors', 'Error Handling', 'Error-handling middleware', 'Catching async errors', 'A 404 handler', 'Consistent error responses'),
    pg('mongodb', 'Express + MongoDB', 'Connecting with Mongoose', 'Models and schemas', 'CRUD routes', 'populate()'),
    pg('structure', 'Project Structure (MVC)', 'Routes, controllers, services, models', 'Config and environment', 'A validation layer', 'Folder layout'),
    pg('security-deploy', 'Security & Deployment', 'helmet, rate limiting, CORS', 'Input validation (zod / joi)', 'Logging', 'Deploying an Express app'),
    revision('app.use vs app.get', 'req.params vs req.query', 'PUT vs PATCH'),
  ],
});
