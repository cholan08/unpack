export interface CommonErrorItem {
  id: string;
  error: string;
  category: 'browser' | 'react' | 'express' | 'mongo' | 'auth';
  meaning: string;
  cause: string;
  solution: string;
  lessonId: string;
  step: number;
}

export const COMMON_ERRORS: CommonErrorItem[] = [
  {
    id: 'cors-missing-header',
    error: "Access to fetch at 'http://localhost:5000/api' from origin 'http://localhost:5173' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
    category: 'browser',
    meaning: 'The browser is enforcing the Same-Origin Policy. The Express server did not return the CORS headers permitting localhost:5173 to read this response.',
    cause: 'The Express app does not use the cors middleware or the CORS origin does not match the frontend port.',
    solution: 'Install and configure cors in Express: app.use(cors({ origin: "http://localhost:5173" }))',
    lessonId: 'cors',
    step: 2,
  },
  {
    id: 'react-missing-key',
    error: 'Warning: Each child in a list should have a unique "key" prop.',
    category: 'react',
    meaning: 'React cannot determine which list items have changed, moved, or been deleted between renders.',
    cause: 'A component mapped over an array and returned JSX elements without a key attribute, or with a non-unique key.',
    solution: 'Add a stable, unique key prop from the data item (e.g. key={todo._id}), not the array index.',
    lessonId: 'lists-keys',
    step: 1,
  },
  {
    id: 'headers-already-sent',
    error: 'Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client',
    category: 'express',
    meaning: 'Your server code attempted to send an HTTP response (res.json, res.send, res.redirect) after a response was already dispatched for that request.',
    cause: 'Usually caused by calling res.json() without returning, or calling next() after answering the request.',
    solution: 'Ensure you return after sending responses: return res.status(400).json(...)',
    lessonId: 'middleware',
    step: 3,
  },
  {
    id: 'mongo-duplicate-key',
    error: 'MongoServerError: E11000 duplicate key error collection: mydb.users index: email_1 dup key: { email: "user@example.com" }',
    category: 'mongo',
    meaning: 'A write operation violated a unique index constraint in the MongoDB database.',
    cause: 'An insert or update attempted to use a value for a unique-indexed field that already exists in another document.',
    solution: 'Catch duplicate key errors (err.code === 11000) and return a friendly 409 Conflict or 400 Bad Request to the client.',
    lessonId: 'indexes',
    step: 4,
  },
  {
    id: 'cannot-read-map-of-undefined',
    error: "TypeError: Cannot read properties of undefined (reading 'map')",
    category: 'react',
    meaning: 'A component attempted to call .map() on a variable that is currently undefined rather than an array.',
    cause: 'Data has not finished fetching yet and the initial state was initialized to undefined instead of [] or was not guarded by a loading check.',
    solution: 'Initialize array state with [] (e.g. useState([])) or conditionally guard rendering: (todos || []).map(...)',
    lessonId: 'data-fetching',
    step: 2,
  },
  {
    id: 'jwt-expired',
    error: 'TokenExpiredError: jwt expired',
    category: 'auth',
    meaning: 'The JSON Web Token has exceeded its expiration timestamp (exp claim).',
    cause: 'The client sent an expired access token in the Authorization header.',
    solution: 'Use a refresh token flow to request a new access token, or redirect the user to log in again.',
    lessonId: 'jwt-auth',
    step: 4,
  },
];
