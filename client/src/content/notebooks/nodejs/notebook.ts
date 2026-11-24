import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'nodejs',
  title: 'Node.js',
  name: 'Node.js',
  tagline: 'JavaScript on the server: the event loop, modules and npm, core modules, streams and scaling: the N in MERN.',
  color: 'green',
  pillar: 'backend',
  order: 10,
  cover: {
    big: 'NODE.JS',
    full: 'Node.js',
    cloud: ['JavaScript', 'outside the', 'browser,', 'non-blocking'],
    art: {
      topLeft: iconArt('server', 'Node', 'green'),
      topRight: flowArt(['Request', 'Event loop', 'Thread pool', 'Callback'], 'green'),
      left: codeArt(["import http from 'node:http';", 'http.createServer(', '  (req, res) => …', ').listen(3000);'], 'Server'),
      centre: hubArt('Node.js', ['File\nsystem', 'Network', 'Streams', 'Processes'], 'server', 'green'),
    },
    side: { title: 'Core', items: ['fs', 'path', 'http', 'events'] },
    why: { title: 'Why Node.js ?', items: ['One language, full stack', 'Great for I/O-heavy apps', 'The npm ecosystem', 'Fast to build APIs'] },
    footer: 'Don’t block the event loop!',
  },
  pages: [
    pg('introduction', 'Introduction to Node.js', 'What Node is (V8 + libuv)', 'Browser JS vs Node', 'Running scripts and the REPL', 'When to use Node'),
    pg('architecture', 'Architecture & the Event Loop', 'Single thread, non-blocking I/O', 'Event loop phases', 'The libuv thread pool', 'process.nextTick vs setImmediate'),
    pg('modules-npm', 'Modules & npm', 'CommonJS vs ES modules', 'package.json and scripts', 'Dependencies and semver', 'npx'),
    pg('core-modules', 'Core Modules', 'fs: sync vs async', 'path and os', 'events and EventEmitter', 'util'),
    pg('http-server', 'Building an HTTP Server', 'http.createServer', 'Request and response objects', 'Routing by hand', 'Serving JSON and files'),
    pg('streams-buffers', 'Streams & Buffers', 'Buffers and binary data', 'Readable, writable, duplex, transform', 'Piping', 'Backpressure'),
    pg('async-errors', 'Async Patterns & Errors', 'Callbacks → promises → async/await', 'Error-first callbacks', 'Unhandled rejections', 'Graceful shutdown'),
    pg('process-env', 'Process, Env & CLI Tools', 'The process object', 'Environment variables and .env', 'Child processes', 'Building a CLI tool'),
    pg('scaling', 'Scaling Node', 'The cluster module', 'Worker threads', 'PM2', 'Profiling and memory leaks'),
    revision('CommonJS vs ES modules', 'nextTick vs setImmediate', 'Cluster vs worker threads'),
  ],
});
