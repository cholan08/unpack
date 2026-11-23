import { box, browser, db, defineLesson, doc, field, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: browser · Express · object storage (top) and MongoDB (bottom) ---------- */
const picker: ScreenLine[] = [{ t: 'h', text: 'Attach a photo' }, { t: 'input', text: 'receipt.jpg · 4 MB' }, { t: 'btn', text: 'Upload', state: 'active' }];
const web = browser(130, 300, { w: 210, h: 170, url: 'todo-app.com', screen: picker });
const api = box(450, 300, 'Express', { sub: 'POST …/photo', icon: 'express', tone: 'server', w: 230 });
const storage = box(810, 140, 'Object storage', { sub: 'S3 / R2 · photos/…', icon: 'cloud', tone: 'data', w: 220 });
const mongo = db(810, 440, 'MongoDB', { items: ['todos'], w: 150, h: 110 });
const todoDoc = (photo: string, hl = true) => doc(810, 440, 'todo', [field('text', '"Buy milk"'), field('photo', photo, { hl })], { w: 280 });

const base: Record<string, NodeSpec> = { web, api, storage, mongo };
const links: LinkSpec[] = [link('web', 'api'), link('api', 'storage'), link('api', 'mongo')];

export default defineLesson({
  metrics: [
    { id: 'db', label: 'Bytes in MongoDB', better: 'lower' },
    { id: 'server', label: 'File bytes through Express', better: 'lower' },
  ],
  legend: { data: 'file bytes', req: 'request', auth: 'signed URL' },
  goals: [
    { text: 'Why files don’t belong in the database', step: 2 },
    { text: 'multipart uploads with multer', step: 3 },
    { text: 'Object storage + a key in MongoDB', step: 4 },
    { text: 'Direct uploads with presigned URLs', step: 5 },
    { text: 'Validating what users upload', step: 7 },
  ],
  steps: [
    {
      short: 'Photos',
      beat: 'setup',
      title: 'Todos get photo attachments',
      body: [
        'Users want to attach a photo to a todo — a receipt, a whiteboard, a broken bike part. Photos are megabytes, not the few hundred bytes of a todo.',
        'Where should those bytes travel, and where should they live?',
      ],
      metrics: { db: '1 KB', server: '—' },
      scene: { nodes: { web, api, mongo }, links: [link('web', 'api'), link('api', 'mongo')], flows: [flow(['web', 'api'], { kind: 'data', label: 'receipt.jpg (4 MB)', every: 3.6 })] },
    },
    {
      short: 'In the DB?',
      beat: 'problem',
      title: 'Base64 in JSON, straight into MongoDB',
      body: [
        'The quick hack: read the file as base64, put it in the JSON body, save it in the todo document. Base64 makes it **33% bigger**, the request body is enormous, and MongoDB documents max out at 16 MB.',
        'Worse, every query that reads todos now drags megabytes of image data along, backups balloon, and the database — your most expensive storage — fills with files.',
      ],
      metrics: { db: '5.3 MB', server: '5.3 MB' },
      scene: {
        nodes: { web, api, mongo: { ...mongo, state: 'error', meter: 0.92, badge: { text: 'growing fast', tone: 'danger' } }, todo: { ...todoDoc('"/9j/4AAQSkZJRgABA… (5.3 MB)"'), x: 810, y: 170, state: 'error' } },
        links: [link('web', 'api'), link('api', 'mongo')],
        flows: [flow(['web', 'api', 'mongo'], { kind: 'data', label: ['JSON + base64 (5.3 MB)', 'insert 5.3 MB'], every: 4, speed: 0.5 })],
      },
    },
    {
      short: 'multipart',
      beat: 'technique',
      title: 'Send files as multipart, stream them on the server',
      body: [
        'Browsers upload files with [[multipart|multipart/form-data]]: raw bytes, no base64. On the server, middleware like `multer` parses it and gives you the file — with **limits** on size and count, so nobody can fill your disk.',
        'Better than JSON, but the bytes still have to go somewhere other than MongoDB.',
      ],
      code: {
        file: 'routes/photos.js',
        lang: 'js',
        code: `const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },   // 5 MB, one file
});

app.post('/api/todos/:id/photo', requireAuth, upload.single('photo'), savePhoto);

// browser: const body = new FormData(); body.append('photo', file); fetch(url, { method: 'POST', body });`,
        hl: [3, 6],
      },
      metrics: { db: '1 KB', server: '4 MB' },
      scene: { nodes: { web, api: { ...api, sub: 'multer · 5 MB limit' }, mongo }, links: [link('web', 'api'), link('api', 'mongo')], flows: [flow(['web', 'api'], { kind: 'data', label: 'multipart (4 MB)', back: 'res', backLabel: '201', every: 3.6 })] },
    },
    {
      short: 'Object storage',
      beat: 'technique',
      title: 'Files in object storage, a key in MongoDB',
      body: [
        'Put the bytes in [[object-storage|object storage]] — S3, Cloudflare R2 and friends are built for exactly this: cheap, enormous, served over HTTP. Save only the **key** (or URL) in the todo document.',
        'The database stays small and fast; files can be cached by a CDN.',
      ],
      code: {
        file: 'routes/photos.js',
        lang: 'js',
        code: `const key = \`photos/\${req.user.id}/\${crypto.randomUUID()}.jpg\`;
await s3.send(new PutObjectCommand({ Bucket, Key: key, Body: req.file.buffer, ContentType: 'image/jpeg' }));
await Todo.updateOne({ _id: req.params.id, userId: req.user.id }, { $set: { photo: key } });`,
        hl: [1, 2, 3],
      },
      metrics: { db: '1 KB', server: '4 MB' },
      scene: {
        nodes: { ...base, mongo: todoDoc('"photos/6740/9f2c….jpg"') },
        links,
        flows: [flow(['web', 'api', 'storage'], { kind: 'data', label: ['4 MB', 'PutObject'], every: 4.6 }), flow(['api', 'mongo'], { kind: 'req', label: 'save key', every: 4.6, offset: 2.4 })],
      },
    },
    {
      short: 'Presigned',
      beat: 'solution',
      title: 'Presigned URLs: let the browser upload directly',
      body: [
        'Why pass 4 MB through Express at all? The server can sign a short-lived [[presigned-url|presigned URL]] that allows **one** upload to **one** key for a few minutes. The browser `PUT`s the file straight to storage, then tells the API it’s done.',
        'Your server only handles tiny JSON requests — no file bytes, no memory spikes, no timeouts on slow connections.',
      ],
      code: {
        file: 'routes/photos.js',
        lang: 'js',
        code: `// 1. browser asks for permission
app.post('/api/uploads', requireAuth, async (req, res) => {
  const key = \`photos/\${req.user.id}/\${crypto.randomUUID()}.jpg\`;
  const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket, Key: key, ContentType: 'image/jpeg' }), { expiresIn: 300 });
  res.json({ url, key });
});
// 2. browser: await fetch(url, { method: 'PUT', body: file })
// 3. browser: PATCH /api/todos/:id { photo: key }`,
        hl: [4, 7],
      },
      changes: ['~ File bytes skip Express entirely', '+ Server signs a 5-minute upload URL'],
      metrics: { db: '1 KB', server: '0 MB' },
      scene: {
        nodes: { ...base, mongo: todoDoc('"photos/6740/9f2c….jpg"') },
        links: [...links, link('web', 'storage', { route: 'over', bend: 40, tone: 'data', label: 'PUT (direct)' })],
        flows: [
          flow(['web', 'api'], { kind: 'auth', label: 'may I upload?', back: 'auth', backLabel: 'signed URL', every: 6.4 }),
          flow(['web', 'storage'], { kind: 'data', label: 'PUT 4 MB', back: 'res', backLabel: '200', every: 6.4, offset: 2.2 }),
          flow(['web', 'api', 'mongo'], { label: ['done: key', 'save key'], every: 6.4, offset: 4.6 }),
        ],
      },
    },
    {
      short: 'Serving',
      beat: 'technique',
      title: 'Serving photos: CDN for public, signed links for private',
      body: [
        'Public images can be served through a CDN in front of the bucket, resized into thumbnails once rather than shipping 4 MB originals to every phone.',
        'Private files (a user’s receipts) stay in a private bucket; the API checks ownership and returns a short-lived signed **GET** URL for each view.',
      ],
      metrics: { db: '1 KB', server: '0 MB' },
      scene: {
        nodes: { ...base, mongo: todoDoc('"photos/6740/9f2c….jpg"', false), storage: { ...storage, sub: 'private bucket' } },
        links: [...links, link('web', 'storage', { route: 'over', bend: 40, tone: 'data' })],
        flows: [
          flow(['web', 'api'], { kind: 'auth', label: 'view photo', back: 'auth', backLabel: 'signed GET (5 min)', every: 5.6 }),
          flow(['web', 'storage'], { kind: 'req', label: 'GET', back: 'data', backLabel: 'image', every: 5.6, offset: 2.4 }),
        ],
      },
    },
    {
      short: 'Validate',
      beat: 'tradeoff',
      title: 'Never trust an upload',
      body: [
        'A file called `cat.jpg` can be anything. Check the real type from its first bytes (“magic numbers”), not the extension or the browser’s `Content-Type`. Enforce size limits on both the signed URL and the server.',
        'Generate your own random keys (never use the user’s filename as a path), and don’t serve uploads from your app’s origin — an uploaded HTML or SVG file can carry scripts.',
      ],
      check: {
        q: 'A user uploads `holiday.jpg`. How do you know it’s really an image?',
        options: ['The .jpg extension', 'The Content-Type the browser sent', 'Inspect the file’s first bytes (its signature) on the server', 'Ask the user to confirm'],
        answer: 2,
        explain: 'Extensions and Content-Type are supplied by the client and trivially faked. The file signature — e.g. FF D8 FF for JPEG — tells you what the bytes are.',
      },
      metrics: { db: '1 KB', server: '0 MB' },
      scene: {
        nodes: patch(base, { web: { screen: [{ t: 'h', text: 'Attach a photo' }, { t: 'input', text: 'holiday.jpg (actually .html)' }, { t: 'error', text: 'Not an image' }] }, api: { state: 'ok', badge: { text: 'checks signature + size', tone: 'ok' } } }),
        links,
        flows: [flow(['web', 'api'], { kind: 'err', label: 'holiday.jpg', back: 'err', backLabel: '415 not an image', every: 4 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Uploads, done right',
      body: [
        'Files go to {data:object storage}; MongoDB stores only the key. Never base64 files into documents.',
        'Use multipart with limits if Express handles the bytes — or better, a {auth:presigned URL} so the browser uploads directly.',
        'Serve public files via a CDN and private ones via short-lived signed links. Validate type by signature, enforce size, use random keys.',
      ],
      metrics: { db: '1 KB', server: '0 MB' },
      scene: {
        nodes: { ...base, mongo: todoDoc('"photos/6740/9f2c….jpg"') },
        links: [...links, link('web', 'storage', { route: 'over', bend: 40, tone: 'data' })],
        flows: [
          flow(['web', 'api'], { kind: 'auth', label: 'sign', back: 'auth', every: 6 }),
          flow(['web', 'storage'], { kind: 'data', label: 'PUT', back: 'res', every: 6, offset: 2.2 }),
        ],
      },
    },
  ],
});
