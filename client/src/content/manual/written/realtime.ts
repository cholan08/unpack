/**
 * Chapter: Update live (real-time).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You send a message to a group chat. Before you have put the phone down, three friends have seen it and one is typing back. In a shared document, a colleague’s cursor moves as they type. On a delivery map, the rider creeps closer, street by street.',
      'But the web was built for asking: the browser requests, the server answers, the conversation ends. The server has no way to tap your browser on the shoulder and say *something changed*. Live apps had to find a way around that.',
      'How does a server push news to you the instant it happens — to thousands of people at once?',
    ],
    predict: {
      q: 'A chat app checks for new messages by asking the server every 2 seconds. 10,000 people have it open. What is the problem?',
      options: [
        'None — two seconds is fast enough for chat',
        'About 5,000 requests a second, nearly all answered “nothing new” — and messages are still up to 2 seconds late',
        'The browser will block that many requests',
        'Messages arrive out of order',
      ],
      answer: 1,
      reveal:
        'That is [[polling]]: 10,000 people ÷ 2 seconds = 5,000 requests every second, almost all wasted, and each message still waits up to two seconds. A [[websocket|WebSocket]] turns it around: each browser opens *one* connection that stays open, and the server sends a message down it the moment something happens. No asking, no waiting.',
    },
  },

  idea: {
    lede: 'Chat, live scores, multiplayer games, shared documents, delivery maps — every live feature does the same five jobs.',
    jobs: [
      {
        title: 'Keep a line open',
        text: 'Instead of asking again and again, the browser opens one long-lived connection the server can push through: a WebSocket, or server-sent events.',
      },
      {
        title: 'Send to the right people',
        text: 'Group connections into [[room|rooms]] — a chat, a document, a match — and send each event only to the people in that room.',
      },
      {
        title: 'Know who is on the line',
        text: 'Check who is connecting, just like any request, and which rooms they may join. An open connection is still a door into your app.',
      },
      {
        title: 'Save first, then broadcast',
        text: 'The database stays the truth. Save the change, then tell everyone; a client that missed something catches up by asking for what changed.',
      },
      {
        title: 'Plan for drops and more servers',
        text: 'Phones sleep and networks blink, so clients reconnect. With several servers, a shared channel ([[pubsub|pub/sub]]) makes sure every event reaches people connected to any of them.',
      },
    ],
    picture:
      'A phone tree versus a radio station. Polling is everyone ringing the station every two seconds to ask “anything new?”. Real-time is everyone tuned to the right channel (a room) while the station announces news the moment it happens. The station still writes everything in its log (the database), so anyone who tuned in late can read what they missed.',
  },

  lessonNotes: {
    websockets: 'All five jobs: why HTTP can only answer, one open line in both directions, rooms, checking who connects, Redis pub/sub across servers, and catching up after a drop.',
  },

  options: {
    lede: 'Real-time is a spectrum. Pick the simplest option that feels instant *enough* — many “live” features only need an update every few seconds.',
    items: [
      {
        name: 'Polling',
        what: 'The client asks again every few seconds.',
        pickWhen: 'Updates every 10–30 seconds are fine: a dashboard, a build status, a notification count.',
        cost: 'Wasted requests, and every update can be late by up to one interval.',
        examples: '`setInterval` with fetch; TanStack Query’s `refetchInterval`',
      },
      {
        name: 'Server-sent events (SSE)',
        what: 'One long HTTP response that the server keeps writing events into — server to browser only.',
        pickWhen: 'The server pushes and the client mostly listens: live feeds, progress bars, streamed AI answers.',
        cost: 'One direction only; the client still sends its changes as normal requests.',
        examples: '`EventSource` in the browser — and the way most AI APIs stream their answers',
      },
      {
        name: 'WebSockets',
        what: 'A two-way connection that stays open; either side can send at any time.',
        pickWhen: 'Chat, multiplayer, collaborative editing — both sides talk often.',
        cost: 'Long-lived connections are harder to scale across servers, and every proxy and host on the way must support them.',
        examples: 'Socket.IO (this course), `ws`',
        tools: ['node'],
      },
      {
        name: 'A managed real-time service',
        what: 'A provider runs the connections, rooms and scaling; your server publishes events through its API.',
        pickWhen: 'You want live features without running WebSocket servers — or you deploy serverless.',
        cost: 'A bill per connection or message, and one more dependency.',
        examples: 'Ably, Pusher, Supabase Realtime, Firebase',
      },
      {
        name: 'Sync engines (CRDTs)',
        what: 'Libraries that keep one shared document in step between many people, merging simultaneous edits automatically — even offline.',
        pickWhen: 'Google-Docs-style collaboration and offline-first apps.',
        cost: 'A new way of thinking about data, and harder debugging.',
        examples: 'Yjs, Automerge, Liveblocks',
      },
    ],
    choose: [
      { when: 'Updates every half-minute are fine', pick: 'Polling. Simple, cacheable, works everywhere.' },
      { when: 'The server streams and the client listens', pick: 'Server-sent events.' },
      { when: 'Both sides talk often: chat, games, presence', pick: 'WebSockets, with Socket.IO.' },
      { when: 'Live features on serverless hosting, or no servers to run', pick: 'A managed real-time service.' },
      { when: 'Several people editing the same thing at once', pick: 'A sync engine such as Yjs or Liveblocks.' },
    ],
  },

  modern: {
    lede: 'AI can get a chat demo working in ten minutes. The demo works because it runs on one server, in one tab, on a perfect network. Real-time breaks exactly where a demo never goes: a second server, a phone that slept, a user who joins a room they shouldn’t.',
    defaults: [
      'Start with the simplest thing that feels live enough — polling or SSE — and move to WebSockets when both sides talk often.',
      'Authenticate the connection when it opens, and check permission for every room a client asks to join.',
      'Save to the database first, then broadcast. The database is the truth.',
      'On every reconnect, fetch what changed since the last event the client saw.',
      'More than one server? Share events through Redis pub/sub, or use a managed service.',
      'Send small events (what changed), not whole documents.',
    ],
    aiGood: [
      'Wiring Socket.IO on the server and the client',
      'Designing event names and payloads',
      'Writing reconnect-and-catch-up logic',
      'Adding typing indicators and “online” presence',
      'Explaining a connection error, or a proxy that drops WebSockets',
    ],
    aiWrong: [
      { mistake: 'Lets any client join any room by name.', fix: 'Check on the server that the user may join that room.' },
      { mistake: 'Trusts the user id sent inside a socket message.', fix: 'Use the identity of the authenticated connection.' },
      { mistake: 'Broadcasts before saving — or never saves.', fix: 'Save first, then emit; if the save fails, tell the sender.' },
      { mistake: 'Assumes the connection never drops.', fix: 'Reconnect, then refetch the state or the changes since the last event.' },
      { mistake: 'Keeps room state in one server’s memory, which breaks with a second server.', fix: 'The Redis adapter or a managed service — and the database for anything lasting.' },
      { mistake: 'Uses WebSockets for something that changes once a minute.', fix: 'Polling or SSE is simpler and cheaper.' },
      { mistake: 'Sends the whole list on every change.', fix: 'Send the change, and let clients apply it.' },
    ],
  },

  build: {
    title: 'Live bookmarks',
    brief: 'Two browser windows, one shared list: add a bookmark in one and it appears in the other at once — only for people allowed to see that list, and without losing anything when a laptop goes to sleep.',
    byHand: [
      { title: 'Feel the problem', text: 'Poll `GET /api/bookmarks` every 2 seconds, open the Network tab, and count the requests that came back with nothing new.', see: ['websockets', 1] },
      { title: 'Open one line', text: 'Add Socket.IO to your Express server, and connect from React when the page loads.', see: ['websockets', 2] },
      { title: 'Check who is connecting', text: 'Read the session cookie (or a token) when the connection opens, and reject anyone who isn’t logged in.', see: ['websockets', 4] },
      { title: 'A room per list', text: 'When a client asks to join `list:42`, check that the user may see list 42, then `socket.join(\'list:42\')`.', see: ['websockets', 3] },
      { title: 'Save, then tell', text: '`POST /api/bookmarks` saves to MongoDB, then `io.to(\'list:42\').emit(\'bookmark:created\', bookmark)`.', see: ['websockets', 3] },
      { title: 'Catch up after a drop', text: 'On every `connect` — reconnects included — refetch the list, or ask for the changes since the last one you saw.', see: ['websockets', 7] },
      { title: 'Ready for a second server', text: 'Add the Socket.IO Redis adapter, so an event emitted on one server reaches clients connected to another.', see: ['websockets', 6] },
    ],
    withAI: {
      lede: 'Now let your AI assistant build it. The spec covers the three places demos break — permissions, saving, reconnecting — and asks for a two-user test.',
      prompt: `Add real-time updates to my bookmarks app (Express + Mongoose + React) with Socket.IO.

Behaviour
- Bookmarks belong to lists. When a bookmark is created or deleted, everyone viewing that list sees it at once.

Rules
- Authenticate every socket connection from the existing session cookie; reject unauthenticated connections.
- Clients join a room "list:<id>" with a "list:join" event; the server checks that the user may view that list before joining.
- Never trust user ids sent in socket messages; use the authenticated user from the connection.
- REST stays the way to change data: the POST and DELETE routes save to MongoDB first, then emit "bookmark:created" / "bookmark:deleted" with only the changed bookmark (or its id).
- On connect and on every reconnect, the client refetches the list (invalidate the TanStack Query cache).
- Use @socket.io/redis-adapter when REDIS_URL is set, so it works across several server instances.

Then show me how to test it with two browser windows and two different users.`,
    },
    verify: [
      'Two windows, same user, same list: add a bookmark in one — it appears in the other within a second.',
      'The Network tab shows one WebSocket connection, not a stream of polling requests.',
      'A second user who can’t see list 42 sends `list:join` for it: refused, and they receive nothing from that list.',
      'Connect without logging in: the connection is rejected.',
      'Take one window offline, add bookmarks in the other, bring it back: the first window catches up.',
      'Stop the database and add a bookmark: nobody is told about a bookmark that wasn’t saved.',
      'Run two server instances with Redis: a window on one sees changes made through the other.',
    ],
  },

  breakIt: [
    {
      title: 'Join any room',
      lang: 'js',
      code: `io.on('connection', (socket) => {
  socket.on('join', (room) => socket.join(room));
});`,
      err: [2],
      answer:
        'Any connected user can join any room just by naming it — `join(\'list:42\')` — and hear everything said there. Check on the server that this user may see that list before calling `socket.join`.',
      see: ['websockets', 4],
    },
    {
      title: 'Who said that?',
      lang: 'js',
      code: `socket.on('message', async ({ userId, text, room }) => {
  const msg = await Message.create({ author: userId, text, room });
  io.to(room).emit('message', msg);
});`,
      err: [1, 2],
      answer:
        'The client says who it is — so anyone can post as anyone, into any room. Take the author from the authenticated connection (for example `socket.data.user.id`), validate `text`, and check that the user belongs to `room`.',
    },
    {
      title: 'Tell first, save later',
      lang: 'js',
      code: `socket.on('message', async (text) => {
  io.to(room).emit('message', { text, at: Date.now() });
  await Message.create({ text, room, author: user.id });
});`,
      err: [2, 3],
      answer:
        'Everyone sees the message before it is saved. If the save fails, people have seen a message that doesn’t exist, and anyone who reloads won’t find it. Save first, then broadcast the saved message, with its id.',
      see: ['websockets', 7],
    },
    {
      title: 'The second server',
      lang: 'js',
      code: `// two instances behind a load balancer
io.to('list:42').emit('bookmark:created', bookmark);`,
      err: [2],
      answer:
        'Each instance only knows its own connections, so people connected to the other server never hear about the new bookmark — the room is split in half. Add the Redis adapter (`io.adapter(createAdapter(pub, sub))`) so emits reach every instance.',
      see: ['websockets', 5],
    },
  ],

  explain: [
    'Why can’t plain HTTP push a message to the browser — and how does a WebSocket change that?',
    'Why save to the database before broadcasting a change?',
    'What goes wrong with real-time when you add a second server, and how is it fixed?',
  ],

  deeper: [
    {
      q: 'How do “typing…” and “online” indicators work?',
      a: 'They are presence: small, frequent, throw-away events (“Ana is typing”) sent to a room and never saved. If one is lost nothing breaks — they are refreshed every few seconds.',
    },
    {
      q: 'How do shared documents merge two people’s edits?',
      a: 'With CRDTs or operational transformation — algorithms that let each person edit their own copy and merge the changes so everyone ends up with the same document, even after working offline.',
    },
    {
      q: 'How many connections can one server hold?',
      a: 'Tens of thousands of mostly idle WebSockets on a single Node process is normal. The limits are memory, open file handles, and how much each message costs to send; beyond that you add servers and a shared channel.',
    },
    {
      q: 'Why do AI chat answers appear word by word?',
      a: 'The model’s API streams its output as it is generated, usually over server-sent events, and the app shows each piece as it arrives instead of waiting for the whole answer.',
    },
    {
      q: 'How do mobile apps get updates when they are closed?',
      a: 'They don’t keep a connection open. The phone’s operating system has its own push service that wakes the app with a notification — that is the chapter *Reach people*.',
    },
    {
      q: 'Is there anything newer than WebSockets?',
      a: 'WebTransport, built on HTTP/3, carries two-way data with lower latency and can send messages that don’t have to arrive in order — useful for games and media. WebSockets remain the everyday choice.',
    },
  ],

  next: [
    { q: 'How does an app reach you when it isn’t even open?', chapter: 'notify' },
    { q: 'What happens when ten thousand people are connected at once?', chapter: 'scale' },
    { q: 'How do you do slow work without making everyone wait?', chapter: 'background' },
    { q: 'How does the server know who is on the other end of the line?', chapter: 'identity' },
  ],
};

export default writing;
