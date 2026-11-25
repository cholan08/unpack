/**
 * Chapter: Handle files and media (uploads & storage).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You change your profile photo. A second later it sits in the corner of every page, on your phone and your laptop, sharp on both. Somewhere, a 4 MB picture from your camera became a small, square, quick-loading image — and was stored somewhere that isn’t your app’s database.',
      'Files are different from the rest of your data. They are big, they arrive slowly over shaky connections, they can hide nasty surprises, and thousands of people may want the same one at the same moment.',
      'Where does a file go after you upload it — and why not into the database with everything else?',
    ],
    predict: {
      q: 'Your app stores profile photos as base64 text inside each user’s document in MongoDB. What goes wrong first as you grow?',
      options: [
        'Nothing — databases are built for this',
        'Every user query drags megabytes of images along, documents creep toward their size limit, and the database does a file server’s job',
        'Base64 images can’t be displayed in a browser',
        'MongoDB deletes large documents',
      ],
      answer: 1,
      reveal:
        'Base64 makes each file about a third bigger, every read of a user drags their photo along, backups balloon, and documents creep toward MongoDB’s 16 MB limit — while your database, the most precious part of your system, spends its time serving pictures. Files belong in **[[object-storage|object storage]]**, built for exactly this; the database keeps a small key pointing to each one.',
    },
  },

  idea: {
    lede: 'Profile photos, PDFs, videos, voice notes — handling files is the same five jobs everywhere.',
    jobs: [
      {
        title: 'Receive it without choking',
        text: 'Send files as [[multipart]] form data, not text inside JSON, and stream them instead of holding whole files in memory. Set size limits before you read a byte.',
      },
      {
        title: 'Never trust it',
        text: 'Check the real type and size on the server — not the file name, not what the browser claims. Never use the uploaded name as a path.',
      },
      {
        title: 'Store it where files belong',
        text: 'Put the bytes in object storage, and keep only a key and a few facts — owner, size, type — in your database.',
      },
      {
        title: 'Serve it fast, or privately',
        text: 'Public files go out through a [[cdn|CDN]]; private ones get short-lived signed links, handed out only after checking who is asking.',
      },
      {
        title: 'Transform once, reuse forever',
        text: 'Resize, compress and convert — thumbnails, modern formats, video encodings — ideally in the background, so the upload itself stays quick.',
      },
    ],
    picture:
      'A cloakroom. You hand over a heavy coat (the file) and get a small numbered ticket (the key in your database). The coats hang in a big room built for coats (object storage), not behind the reception desk (the database). The attendant checks it really is a coat and not something dangerous (validation). And when you come back, you show your ticket — nobody else can claim your coat (signed links).',
  },

  lessonNotes: {
    uploads: 'All five jobs: why base64 in JSON goes wrong, multipart streaming, object storage with a key in MongoDB, direct uploads with presigned URLs, CDN and signed links — and never trusting an upload.',
  },

  options: {
    lede: 'Almost every product stores files the same way today: in object storage. The real choices are who uploads where, and who serves the files.',
    items: [
      {
        name: 'Object storage',
        what: 'A service that keeps any number of files under keys, cheaply and durably, behind an HTTP API.',
        pickWhen: 'Almost always — it is the standard home for user files.',
        cost: 'You pay for storage and, above all, for downloads; access rules take a little setup.',
        examples: 'Amazon S3, Cloudflare R2, Google Cloud Storage, Backblaze B2 — or MinIO on your own server',
        tools: ['aws', 'google-cloud'],
      },
      {
        name: 'Your server’s own disk',
        what: 'Save uploads into a folder on the server.',
        pickWhen: 'Experiments on your laptop, or a single small VPS.',
        cost: 'Many platforms wipe it on every deploy, and several servers can’t share it.',
        examples: 'multer’s disk storage',
      },
      {
        name: 'Direct-to-storage uploads',
        what: 'Your server hands the browser a short-lived presigned URL, and the browser uploads straight to storage.',
        pickWhen: 'Big files, or many uploads, where you don’t want every byte passing through your server.',
        cost: 'More steps: create the URL, upload, then confirm and record it.',
        examples: 'S3 and R2 presigned URLs',
      },
      {
        name: 'A media platform',
        what: 'Upload, storage, resizing, format conversion and a CDN in one service, with transformations written into the URL.',
        pickWhen: 'Image- or video-heavy products that need many sizes and formats.',
        cost: 'Pricing that grows with traffic, and lock-in.',
        examples: 'Cloudinary, imgix, Uploadcare; Mux or Cloudflare Stream for video',
      },
      {
        name: 'Your backend service’s storage',
        what: 'File storage built into a backend-as-a-service, with access rules tied to its sign-in.',
        pickWhen: 'You already use Supabase or Firebase.',
        cost: 'Tied to that platform’s rules and prices.',
        examples: 'Supabase Storage, Cloud Storage for Firebase',
      },
    ],
    choose: [
      { when: 'A small app, files passing through your server', pick: 'multer streaming to object storage, with a key in MongoDB.' },
      { when: 'Big files, or lots of uploads', pick: 'Presigned URLs: the browser uploads straight to storage.' },
      { when: 'Lots of images in many sizes', pick: 'A media platform — or resizing in a background job.' },
      { when: 'Video', pick: 'A video platform. Encoding and streaming are a whole field of their own.' },
      { when: 'Learning, on your laptop', pick: 'Local disk is fine — just never in production.' },
    ],
  },

  modern: {
    lede: 'AI will happily write an upload route that works for a 100 KB test image. Real uploads are 12 MB photos from phones, PDFs that are really something else, and files named `../../server.js`. The rules here are old and dull — which is exactly why generated code tends to skip them.',
    defaults: [
      'Upload as multipart, or with a presigned URL — never base64 inside JSON.',
      'Limit size and number of files before reading; check the real type from the file’s content, not its name.',
      'Store files in object storage under random keys you generate; keep the key, owner, size and type in the database.',
      'Serve public files through a CDN; give private files short-lived signed URLs after an ownership check.',
      'Resize and convert images (to WebP or AVIF, say) in a background job, and strip location data from photos.',
      'Keep storage buckets private by default, and allow only what you mean to.',
    ],
    aiGood: [
      'Wiring multer, S3 or R2 clients, and presigned URLs',
      'Building the upload screen: progress, drag and drop, previews',
      'Writing a background job that resizes images',
      'Setting up bucket policies and CORS rules for direct uploads',
      'Explaining a storage permission error',
    ],
    aiWrong: [
      { mistake: 'Base64-encodes files into JSON and saves them in the database.', fix: 'Multipart or presigned uploads, object storage, and a key in the database.' },
      { mistake: 'Sets no size limit, so one request can fill memory or disk.', fix: 'Set limits in multer (and in presigned policies) before reading the file.' },
      { mistake: 'Trusts the file extension, or the type the browser sent.', fix: 'Check the file’s first bytes, against a short list of allowed types.' },
      { mistake: 'Uses the uploaded file name as the storage path.', fix: 'Generate your own random key; keep the original name only as data.' },
      { mistake: 'Makes the whole bucket public to fix a 403.', fix: 'Keep it private; use signed URLs, or a CDN for what should be public.' },
      { mistake: 'Saves to the server’s disk on a platform that wipes it on deploy.', fix: 'Object storage from the start.' },
      { mistake: 'Resizes images inside the request, holding the server up.', fix: 'A background job, or a media service.' },
    ],
  },

  build: {
    title: 'Screenshots on bookmarks',
    brief: 'Let people attach a screenshot to each bookmark: uploaded straight to object storage, checked, turned into a thumbnail, and served fast — while images on private bookmarks stay private.',
    byHand: [
      { title: 'Get a bucket', text: 'Create a private bucket on Cloudflare R2 or Amazon S3, and put its access keys in `.env`.', see: ['uploads', 4] },
      { title: 'Ask permission to upload', text: '`POST /api/uploads` checks the user, the declared type (images only) and size (under 5 MB), then returns a presigned upload URL and a random key.', see: ['uploads', 5] },
      { title: 'Upload straight to storage', text: 'The browser sends the file to that URL with a progress bar. Your server never touches the bytes.', see: ['uploads', 5] },
      { title: 'Record it', text: 'The client tells your API the upload is done; the server checks that the object exists and its real size, then saves the key on the bookmark.' },
      { title: 'Never trust it', text: 'Read the file’s first bytes to confirm it really is a PNG, JPEG or WebP. Anything else is deleted.', see: ['uploads', 7] },
      { title: 'Make a thumbnail', text: 'A background job resizes it to a 400 px-wide WebP with `sharp`, strips its metadata, and stores it under a second key.' },
      { title: 'Serve it right', text: 'Public bookmarks show the thumbnail through a CDN; private ones get a signed URL that lasts 10 minutes, after an ownership check.', see: ['uploads', 6] },
    ],
    withAI: {
      lede: 'Now let your AI assistant build it. The spec spells out every check — and ends by asking what each step protects against, so you can judge its understanding as well as its code.',
      prompt: `Add screenshot attachments to bookmarks in my Express + Mongoose + React app, using Cloudflare R2 (S3-compatible) and presigned URLs.

Flow
1. POST /api/uploads { contentType, size } → the user must be logged in; contentType must be image/png, image/jpeg or image/webp; size ≤ 5 MB. Return { url, key }: key is a random id (never the file name), url is a presigned PUT valid for 5 minutes.
2. The React client PUTs the file to url and shows a progress bar.
3. POST /api/bookmarks/:id/image { key } → check the bookmark belongs to the user, the object exists in R2, its real size is allowed, and its first bytes match an allowed image type; then save the key.
4. A background job makes a 400px-wide WebP thumbnail with sharp, strips metadata, and stores it as "<key>-thumb".
5. GET /api/bookmarks/:id/image → a signed GET URL valid for 10 minutes, for the owner only.

Rules
- The bucket stays private. Keys only in .env.
- No base64, and no files on the server's disk in production.

Then list what each step protects against.`,
    },
    verify: [
      'Upload a 2 MB photo: a progress bar, then a thumbnail on the bookmark.',
      'The Network tab shows the file going to the storage URL, not through your API.',
      'Try a 20 MB file: refused **before** anything uploads.',
      'Rename a text file to `photo.png` and upload it: rejected by the type check.',
      'In the bucket, objects have random names, not the original file names.',
      'Open a private image’s signed link again after 10 minutes: it no longer works.',
      'The bucket’s public access is switched off.',
    ],
  },

  breakIt: [
    {
      title: 'Photos in the user document',
      lang: 'js',
      code: `const userSchema = new Schema({
  name: String,
  avatar: String, // "data:image/jpeg;base64,/9j/4AAQSk…"
});`,
      err: [3],
      answer:
        'Base64 makes each photo about a third bigger, and now every query that loads a user drags it along — lists, logins, everything. Documents grow toward the 16 MB limit and backups balloon. Keep the file in object storage and store a short key: `avatarKey: String`.',
      see: ['uploads', 2],
    },
    {
      title: 'Saving it as named',
      lang: 'js',
      code: `const upload = multer({ dest: 'uploads/' });
app.post('/api/files', upload.single('file'), async (req, res) => {
  await fs.rename(req.file.path, \`uploads/\${req.file.originalname}\`);
  res.json({ ok: true });
});`,
      err: [1, 3],
      answer:
        'No size limit, so one request can fill the disk. And the client’s file name decides where the file lands: a crafted name like `../../server.js` can escape the folder, and two people’s `photo.jpg` overwrite each other. Set `limits`, generate your own key, and store files in object storage rather than on the server’s disk.',
      see: ['uploads', 7],
    },
    {
      title: 'Is it a PNG?',
      lang: 'js',
      code: `if (!req.file.originalname.endsWith('.png')) {
  return res.status(400).json({ error: 'PNG only' });
}`,
      err: [1],
      answer:
        'The name is just text the client chose — a script renamed `x.png` sails through. Check the file’s actual first bytes (its “magic number”), for example with the `file-type` library, against a short list of allowed types.',
      see: ['uploads', 7],
    },
    {
      title: 'Fixing a 403',
      lang: 'json',
      code: `{
  "Effect": "Allow",
  "Principal": "*",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::my-app-uploads/*"
}`,
      err: [3, 5],
      answer:
        'This makes every file in the bucket readable by anyone on the internet — private documents included — just to make one image load. Keep the bucket private: serve public images through a CDN (or a separate public bucket), and private ones with signed URLs.',
    },
  ],

  explain: [
    'Why do files go into object storage while the database keeps only a key?',
    'Why can’t you trust a file’s name, or the type the browser reports?',
    'How does a presigned URL let the browser upload without your server handling the file?',
  ],

  deeper: [
    {
      q: 'How does video streaming work?',
      a: 'A video is encoded at several qualities and cut into short chunks (HLS or DASH). The player picks the best quality the connection allows, chunk by chunk — which is why the picture sharpens or blurs mid-video.',
    },
    {
      q: 'What is “egress” on a cloud bill?',
      a: 'The cost of data leaving the provider — every download. Storing files is cheap; a popular file downloaded millions of times is not. CDNs, and providers without download fees such as Cloudflare R2, help.',
    },
    {
      q: 'Should uploads be scanned for viruses?',
      a: 'If other people will download what users upload — documents in a shared workspace, for example — yes. A scanning service or ClamAV runs in a background job before a file is shared.',
    },
    {
      q: 'What are WebP and AVIF?',
      a: 'Modern image formats, much smaller than JPEG or PNG at the same quality. Browsers support them widely; serve them with a fallback for the rare old browser.',
    },
    {
      q: 'How do apps upload huge files over a bad connection?',
      a: 'Resumable uploads: the file is sent in chunks, and if the connection drops, the upload continues from the last chunk instead of starting again (S3 multipart uploads, the tus protocol).',
    },
    {
      q: 'What is EXIF data, and why strip it?',
      a: 'Metadata a camera writes into each photo: the model, the time — and often the GPS location. Publishing it can reveal where someone lives. Strip it when you process images.',
    },
  ],

  next: [
    { q: 'How do you process files without making people wait?', chapter: 'background' },
    { q: 'Why do images load fast for everyone, everywhere?', chapter: 'fast' },
    { q: 'How do you make sure only the owner sees a private file?', chapter: 'protect' },
    { q: 'How do you put the whole app online?', chapter: 'ship' },
  ],
};

export default writing;
