export interface CapstoneMilestone {
  id: string;
  num: number;
  title: string;
  lessonId: string;
  goal: string;
  whyNotes: string;
  commands: { title: string; cmd: string }[];
  acceptanceChecks: { id: string; label: string; sampleOutput?: string }[];
  questions: { q: string; options: string[]; answer: number; explain: string }[];
  explainBackPrompt: string;
}

export const CAPSTONE_MILESTONES: CapstoneMilestone[] = [
  {
    id: 'm1',
    num: 1,
    title: 'Project Skeleton & Scripts',
    lessonId: 'modules',
    goal: 'Initialize a monorepo workspace for TaskFlow with separate client and server folders, git tracking, and npm workspaces.',
    whyNotes: 'Keeping client and server in separate directories inside one repo avoids tangled dependencies while keeping version control unified.',
    commands: [
      { title: 'Create repository and subdirectories', cmd: 'mkdir -p taskflow/client taskflow/server\ncd taskflow\ngit init' },
      { title: 'Initialize root package.json', cmd: 'npm init -y' },
    ],
    acceptanceChecks: [
      { id: 'c1', label: 'git status shows a clean initialized repo' },
      { id: 'c2', label: 'root package.json defines npm scripts for client and server' },
    ],
    questions: [
      { q: 'Why keep server dependencies separate from client dependencies?', options: ['Express and Node modules should never be bundled into browser JavaScript', 'npm does not allow more than 10 packages in one package.json', 'Browsers cannot read JSON files', 'Vite requires servers to run on port 80'], answer: 0, explain: 'Separation of concerns keeps the browser bundle tiny and avoids leaking server packages to the client.' },
    ],
    explainBackPrompt: 'Explain why we separate client-side dependencies from server-side dependencies.',
  },
  {
    id: 'm2',
    num: 2,
    title: 'Express Server & Health Route',
    lessonId: 'middleware',
    goal: 'Create an Express application with JSON middleware and a GET /healthz endpoint.',
    whyNotes: 'A lightweight health endpoint is the industry standard used by cloud hosts (Render, Kubernetes) to know when the service is ready for traffic.',
    commands: [
      { title: 'Install Express', cmd: 'cd server && npm install express dotenv' },
      { title: 'Run server', cmd: 'node src/index.js' },
    ],
    acceptanceChecks: [
      { id: 'c1', label: 'curl http://localhost:5000/healthz returns 200 OK', sampleOutput: '{"status":"ok","uptime":12.4}' },
    ],
    questions: [
      { q: 'What HTTP status code should a healthy service return on /healthz?', options: ['200 OK', '404 Not Found', '301 Redirect', '500 Internal Error'], answer: 0, explain: '200 OK signifies to hosting platforms that the process is healthy.' },
    ],
    explainBackPrompt: 'Explain why cloud providers rely on health check endpoints for zero-downtime deploys.',
  },
  {
    id: 'm3',
    num: 3,
    title: 'MongoDB Connection & Task Model',
    lessonId: 'mongoose',
    goal: 'Connect to MongoDB using Mongoose and define the Task schema with title, description, status, and timestamps.',
    whyNotes: 'Enabling timestamps: true automatically manages createdAt and updatedAt fields, which later enables efficient cursor pagination.',
    commands: [
      { title: 'Install Mongoose', cmd: 'npm install mongoose' },
    ],
    acceptanceChecks: [
      { id: 'c1', label: 'Server logs "Connected to MongoDB" on startup' },
      { id: 'c2', label: 'Task schema validates that title is required and trimmed' },
    ],
    questions: [
      { q: 'What does { timestamps: true } in a Mongoose schema do?', options: ['Adds createdAt and updatedAt Date fields automatically', 'Measures query latency', 'Limits documents to 1 hour', 'Syncs time with NTP'], answer: 0, explain: 'Mongoose automatically sets and updates createdAt and updatedAt on document saves.' },
    ],
    explainBackPrompt: 'Explain how Mongoose schemas provide validation before documents reach the database.',
  },
  {
    id: 'm4',
    num: 4,
    title: 'REST CRUD for Tasks',
    lessonId: 'rest-api',
    goal: 'Implement REST endpoints: GET /api/tasks, POST /api/tasks, PATCH /api/tasks/:id, DELETE /api/tasks/:id.',
    whyNotes: 'Using PATCH rather than PUT allows partial updates (e.g. flipping only the status field) without resending the entire task object.',
    commands: [
      { title: 'Test creating a task with curl', cmd: 'curl -X POST http://localhost:5000/api/tasks -H "Content-Type: application/json" -d \'{"title":"Test Task"}\'' },
    ],
    acceptanceChecks: [
      { id: 'c1', label: 'POST returns 201 Created with saved document' },
      { id: 'c2', label: 'DELETE returns 204 No Content or 200 OK' },
    ],
    questions: [
      { q: 'Why is PATCH preferred over PUT for updating a task status?', options: ['PATCH allows partial field updates; PUT replaces the entire resource', 'PATCH is faster over HTTP/2', 'PUT cannot accept JSON', 'PATCH is idempotent'], answer: 0, explain: 'PATCH updates specific fields without requiring the client to transmit all existing properties.' },
    ],
    explainBackPrompt: 'Explain why REST APIs use standard HTTP verbs (POST, GET, PATCH, DELETE) for resource operations.',
  },
  {
    id: 'm5',
    num: 5,
    title: 'Validation & Error Handling',
    lessonId: 'validation',
    goal: 'Add schema validation at the edge and a centralized 4-argument error handler in Express.',
    whyNotes: 'Centralized error handling guarantees that database connection errors or unexpected crashes return clean JSON error payloads instead of leaking stack traces.',
    commands: [
      { title: 'Test bad input', cmd: 'curl -X POST http://localhost:5000/api/tasks -H "Content-Type: application/json" -d \'{"title":""}\'' },
    ],
    acceptanceChecks: [
      { id: 'c1', label: 'Empty title returns 400 Bad Request with field errors' },
      { id: 'c2', label: 'Unknown route returns 404 JSON response' },
    ],
    questions: [
      { q: 'Why should error stack traces be hidden in production?', options: ['They expose internal code structure, file paths, and potential vulnerabilities to attackers', 'They slow down the network connection', 'JSON does not support newlines', 'Browsers crash on stack traces'], answer: 0, explain: 'Stack traces in production leak implementation details and package versions to potential adversaries.' },
    ],
    explainBackPrompt: 'Explain how centralized Express error-handling middleware prevents silent server crashes.',
  },
  {
    id: 'm6',
    num: 6,
    title: 'React App, Routing & Data Fetching',
    lessonId: 'data-fetching',
    goal: 'Scaffold React frontend with Vite, configure client-side routes (/ and /board), and fetch task data.',
    whyNotes: 'Handling loading, error, and empty states explicitly prevents confusing blank screens for the user.',
    commands: [
      { title: 'Create client app', cmd: 'npm create vite@latest client -- --template react' },
      { title: 'Install client router', cmd: 'cd client && npm install react-router-dom' },
    ],
    acceptanceChecks: [
      { id: 'c1', label: 'Vite dev server runs at http://localhost:5173' },
      { id: 'c2', label: 'Task list displays loading indicator and renders fetched tasks' },
    ],
    questions: [
      { q: 'Why handle loading and error states explicitly in React data fetching?', options: ['To prevent runtime crashes and provide clear user feedback during slow network round-trips', 'React throws an error if loading is omitted', 'Browsers freeze without loading spinners', 'Because fetch() is synchronous'], answer: 0, explain: 'Explicit loading/error states deliver good UX and prevent rendering undefined data.' },
    ],
    explainBackPrompt: 'Explain what happens in the component lifecycle while fetch() is in flight.',
  },
  {
    id: 'm7',
    num: 7,
    title: 'Forms, State & Optimistic UI',
    lessonId: 'react-rendering',
    goal: 'Implement task creation form and status toggling with optimistic UI updates.',
    whyNotes: 'Optimistic updates update the local UI state immediately, then roll back only if the backend returns an error.',
    commands: [
      { title: 'Test optimistic toggle', cmd: 'Clicking a checkbox immediately marks it done before the network request resolves.' },
    ],
    acceptanceChecks: [
      { id: 'c1', label: 'Tasks update instantly on click' },
      { id: 'c2', label: 'Failed requests roll back state and display a toast alert' },
    ],
    questions: [
      { q: 'How does an optimistic UI update handle server failure?', options: ['It reverts local state to the previous snapshot and notifies the user', 'It automatically reboots the computer', 'It deletes the local database', 'It redirects to the home page'], answer: 0, explain: 'Optimistic UI must preserve the previous state snapshot to revert if the network request fails.' },
    ],
    explainBackPrompt: 'Explain why preserving the previous state snapshot is necessary for optimistic updates.',
  },
  {
    id: 'm8',
    num: 8,
    title: 'Authentication & Protected Routes',
    lessonId: 'jwt-auth',
    goal: 'Add User registration, bcrypt password hashing, JWT generation on login, and auth middleware on task routes.',
    whyNotes: 'Storing passwords with bcrypt (cost 10+) protects users even if the database is leaked.',
    commands: [
      { title: 'Install bcrypt and jsonwebtoken', cmd: 'cd server && npm install bcryptjs jsonwebtoken' },
    ],
    acceptanceChecks: [
      { id: 'c1', label: 'POST /api/auth/register stores salted password hash, never plain text' },
      { id: 'c2', label: 'Unauthenticated requests to /api/tasks return 401 Unauthorized' },
    ],
    questions: [
      { q: 'Why is plain-text password storage unacceptable?', options: ['Any database breach immediately compromises user accounts across every service where they reuse passwords', 'MongoDB rejects plain-text strings', 'Bcrypt is required by the HTTP standard', 'Plain text passwords crash Node'], answer: 0, explain: 'Storing hashed passwords protects user credentials against database leaks.' },
    ],
    explainBackPrompt: 'Explain how a JWT token proves identity to the backend on each request without session lookup in memory.',
  },
  {
    id: 'm9',
    num: 9,
    title: 'Realtime Updates with WebSockets',
    lessonId: 'websockets',
    goal: 'Connect Socket.IO or ws to broadcast task updates to all connected clients viewing the board.',
    whyNotes: 'WebSockets allow other team members to see tasks move across the board without polling.',
    commands: [
      { title: 'Install socket.io', cmd: 'cd server && npm install socket.io && cd ../client && npm install socket.io-client' },
    ],
    acceptanceChecks: [
      { id: 'c1', label: 'Moving a task in one browser window updates the second window in real time' },
    ],
    questions: [
      { q: 'How do WebSockets differ from HTTP polling?', options: ['WebSockets maintain an open two-way channel where the server can push data to clients instantly without repeated polling overhead', 'HTTP polling uses UDP', 'WebSockets only work on localhost', 'Polling is faster'], answer: 0, explain: 'WebSockets provide persistent full-duplex communication with minimal framing overhead.' },
    ],
    explainBackPrompt: 'Explain the difference between client polling and server-push over WebSockets.',
  },
  {
    id: 'm10',
    num: 10,
    title: 'Deployment, CI & Defend Your Design',
    lessonId: 'deploying',
    goal: 'Deploy TaskFlow live, set up automated GitHub Actions CI, and defend your architectural decisions.',
    whyNotes: 'Shipping the completed project to a live URL confirms the full stack functions under production conditions.',
    commands: [
      { title: 'Run production build check', cmd: 'npm run build' },
    ],
    acceptanceChecks: [
      { id: 'c1', label: 'Deployed app is accessible at a public HTTPS URL' },
      { id: 'c2', label: 'Defend your design: answer all 5 design defense questions' },
    ],
    questions: [
      { q: 'Why choose JWTs over server-side session stores for this architecture?', options: ['JWTs are stateless and allow any server instance to verify auth without shared session store lookup', 'Sessions cannot store user IDs', 'Cookies are prohibited on HTTPS', 'JWTs are automatically encrypted'], answer: 0, explain: 'Stateless JWT verification scales easily across multiple server instances.' },
    ],
    explainBackPrompt: 'Defend your architecture: explain why your chosen schema, auth method, and deployment structure fit TaskFlow.',
  },
];
