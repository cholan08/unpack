/**
 * Chapter: Your first ship (Level 1 — docs/VISION.md §5).
 * The start of the Path door: a page you made, written with AI as your pair, online at a public link
 * in about an hour. Follows the model chapter's order and voice (written/identity.ts).
 * AI drafted; the owner reviews (set `reviewed` only then).
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You have made things on a computer before: a document, a drawing, a spreadsheet. They live on your laptop. To show someone, you send a copy — or you turn the screen around.',
      'A **link** is different. Anyone, anywhere, on any device, can open it at any time, and they all see the same thing — the latest version. Putting something behind a link is what builders call **shipping**.',
      'It sounds like it needs servers, a company and a lot of money. It needs much less than that.',
    ],
    predict: {
      q: 'What is the least you need to put a page you made on the internet — today?',
      options: [
        'A server you rent and set up yourself, a domain name, and a framework like React',
        'One HTML file and a free static host',
        'A paid subscription to a website builder',
        'Permission from your internet provider',
      ],
      answer: 1,
      reveal:
        'One file is enough. A web page is a text file of HTML; a **static host** keeps copies of it on computers that are always on and gives it a public [[https]] address. No server code, no database and no domain name are needed for a first version, and many hosts are free for a small personal site. Servers, frameworks and domains come later — when the page has to *do* something.',
    },
  },

  idea: {
    lede: 'Forget tools for a moment. Every launch, from a one-page portfolio to a company’s new product, does the same four jobs.',
    jobs: [
      {
        title: 'Make the thing',
        text: 'Write what people will see. Here that is one HTML file: your words, a little CSS for looks, perhaps a picture. Small enough that you can read every line of it.',
      },
      {
        title: 'Check it like a stranger',
        text: 'Open it the way a visitor will: on a phone, with no context, clicking everything. A page written with AI looks finished long before it is.',
      },
      {
        title: 'Put a copy somewhere always on',
        text: 'A host keeps your files on machines that never sleep and answers every visitor. For a page made of plain files, that is often a [[cdn]] — copies in many cities, so everyone gets a nearby one.',
      },
      {
        title: 'Share the link, then improve it',
        text: 'Send it to one person and watch what confuses them. Change the file and publish again: every later version goes live the same way, at the same address.',
      },
    ],
    picture:
      'Putting up a poster. You design it at your desk (your laptop) and proofread it (your checks). Then a print shop puts copies in every station (the host and its CDN), where anyone passing can read it. When you fix a typo you send the print shop a new version — not a letter to every reader.',
  },

  lessonNotes: {
    'url-to-page': 'What happens every time someone opens your link: the name lookup, the secure connection, the request — and where the time goes.',
    rendering: 'How the browser turns your HTML and CSS into pixels, and why one tag in the wrong place can hold the whole page back.',
    deploying: 'The same idea at full size: a whole app, not one page — static files to a CDN, the server somewhere always on.',
  },

  options: {
    lede: 'There are four common ways to put a page online. For a first ship, every one of them has a free option.',
    items: [
      {
        name: 'Drag and drop to a static host',
        what: 'Drop your folder onto the host’s website and get a public link a minute later. Nothing to install.',
        pickWhen: 'Your first ship, today.',
        cost: 'Every update means dropping the folder again, and you may need a free account to keep the site online.',
        examples: 'Netlify Drop; Cloudflare and others also take a direct upload',
      },
      {
        name: 'A Git repository, published as a site',
        what: 'Your files live in a [[git|Git]] repository; each change you push is published, and you keep the history of every version.',
        pickWhen: 'You will keep improving the page and want to undo mistakes.',
        cost: 'A little Git to learn first. Free GitHub Pages sites are published from public repositories.',
        examples: 'GitHub Pages, GitLab Pages',
      },
      {
        name: 'A deploy platform connected to Git',
        what: 'Connect a repository once. The platform builds and publishes every push, and gives each proposed change its own preview link.',
        pickWhen: 'The page grows into an app with a [[build]] step, like React.',
        cost: 'More settings to understand, and free tiers have limits — some are for personal, non-commercial use only.',
        examples: 'Netlify, Vercel, Cloudflare Pages, Render',
      },
      {
        name: 'A website builder',
        what: 'Design the page in an online editor; the company hosts it for you.',
        pickWhen: 'You need a polished page quickly and don’t want to touch code.',
        cost: 'You learn little about how it works, free plans show the builder’s branding, and leaving means rebuilding.',
        examples: 'Carrd, Wix, Squarespace, Framer',
      },
    ],
    choose: [
      { when: 'You want a link today, with nothing installed', pick: 'Drag and drop to a static host, like Netlify Drop.' },
      { when: 'You will keep changing the page', pick: 'A Git repository published with GitHub Pages — or a deploy platform connected to it.' },
      { when: 'It will grow into a React app', pick: 'A deploy platform (Netlify, Vercel, Cloudflare) connected to your repository.' },
      { when: 'You need a nice page and don’t care how it works', pick: 'A website builder. You will learn less — a fair trade for some pages, but not for this one.' },
    ],
  },

  modern: {
    lede: 'An AI assistant can write a good-looking page in under a minute. That is the point of this chapter: you build with AI from your very first project — and you learn to read what it gives you before you put your name on it.',
    defaults: [
      'One `index.html` file with the CSS inside it. No framework, no build step, no packages.',
      'Words you wrote yourself. AI can shape the layout; your words make it yours.',
      'A static host with free [[https]] and its free address (`your-name.netlify.app`, `your-name.github.io`). Buy a domain later, if ever.',
      'Images you have the right to use, saved in the same folder and linked with relative paths.',
      'Look at it on a phone before you share it.',
    ],
    aiGood: [
      'A first layout from a short description of you',
      'Plain, readable HTML and CSS you can learn from',
      'Making it work well on a phone',
      'Explaining any line you don’t understand',
      'Fixing a broken layout, once you paste the code and say what looks wrong',
    ],
    aiWrong: [
      { mistake: 'Fills the page with invented facts: jobs you never had, projects you never built, quotes nobody said.', fix: 'Give it only your real facts, and read every sentence before you ship. Your name is on it.' },
      { mistake: 'Leaves placeholders behind: “Lorem ipsum”, `you@example.com`, links to `#`.', fix: 'Search the file for `lorem`, `example` and `href="#"` before you publish.' },
      { mistake: 'Links pictures from other websites, or from paths only your computer has (`C:\\Users\\…`).', fix: 'Save images in the project folder and link them relatively: `src="photo.jpg"`.' },
      { mistake: 'Reaches for React, a build tool and a dozen packages for one page.', fix: 'Ask for a single HTML file with the CSS inside and no frameworks.' },
      { mistake: 'Forgets the viewport line, so phones show a shrunken desktop page.', fix: 'Check the `<head>` has `<meta name="viewport" content="width=device-width, initial-scale=1">`.' },
      { mistake: 'Pale grey text on white, and images without `alt` text.', fix: 'Ask for strong contrast and alt text on every image — then check both yourself.' },
      { mistake: 'Puts an API key or a password into the page to make a contact form work.', fix: 'Everything in a page is public. Use a plain `mailto:` link, or a form service built to be called from the browser.' },
    ],
  },

  build: {
    title: 'Your page, online',
    brief:
      'A one-page site about you — who you are, what you are curious about, one thing you have made or want to make, and how to reach you — at a public link you can send to a friend tonight. About an hour, most of it spent on your own words.',
    byHand: [
      {
        title: 'Write your words first',
        text: 'In a plain note, write four things: your name; one sentence about what you are curious about; one thing you have made or want to make; how to reach you. This is the part no AI can do for you.',
      },
      {
        title: 'One folder, one file',
        text: 'Make a folder called `my-page` with a file inside called `index.html`. Hosts send `index.html` when someone opens your address.',
      },
      {
        title: 'Write the HTML',
        text: 'Start with `<!doctype html>`, then a `<head>` holding a `<title>` and the viewport line, then a `<body>` with your words in `<h1>`, `<p>` and `<a>` tags. Open the file in your browser: that is your page, running on your own computer.',
        see: ['rendering', 2],
      },
      {
        title: 'Give it some style',
        text: 'Add a `<style>` block inside the head: a comfortable font size, a maximum width so lines stay short (about `65ch`), and room to breathe. Refresh and look again.',
      },
      {
        title: 'Check it like a stranger',
        text: 'Narrow the window to the width of a phone, click every link, and read every word out loud. Fix what is wrong now — strangers won’t tell you.',
      },
      {
        title: 'Put it online',
        text: 'Open Netlify Drop (`app.netlify.com/drop`) and drag the whole `my-page` folder onto it. A minute later you have a public `https://…netlify.app` link. If it asks you to create a free account to keep the site, do — otherwise it may be taken down.',
        see: ['deploying', 3],
      },
      {
        title: 'Open it on your phone',
        text: 'Type the link on your phone using mobile data, not your Wi-Fi. If it opens there, it opens for anyone, anywhere. Then paste it below.',
        see: ['url-to-page', 1],
      },
    ],
    withAI: {
      lede: 'Now make it again with an AI assistant as your pair — a chat assistant like Claude, ChatGPT or Gemini, or the one in your editor. A good prompt is a **spec**: what you want, the rules it must follow, and what you will check. Put your own words where the brackets are.',
      prompt: `Make me a one-page personal website as a single index.html file.

About me (use only these facts — do not invent anything):
- Name: [your name]
- What I'm curious about: [one sentence]
- Something I made or want to make: [one or two sentences]
- How to reach me: [an email address or a profile link]

Rules
- One file: HTML with the CSS in a <style> tag. No JavaScript, no frameworks, no external libraries or fonts.
- Include <meta name="viewport" content="width=device-width, initial-scale=1"> and a <title>.
- Phone first: a readable font size, and lines no wider than about 70 characters.
- Strong contrast. If you add an image, use a relative path (photo.jpg) and alt text.
- No placeholder text, no lorem ipsum, no links to "#".

After the code, list anything you weren't sure about, so I can check it.`,
    },
    verify: [
      'Open the link on your phone using mobile data, not Wi-Fi: it loads, and you can read it without zooming.',
      'The address starts with `https://`, and the browser shows no warning.',
      'Every sentence is true and yours: no invented jobs, projects or quotes.',
      'Search the file for `lorem`, `example.com` and `href="#"`: nothing found.',
      'Click every link on the live page: none of them is broken.',
      'Open the link in a private window: it works without you being logged in anywhere.',
      'View the page source (Ctrl+U, or ⌘⌥U on a Mac): nothing in it you wouldn’t show a stranger — no keys, no passwords.',
    ],
    proof: {
      label: 'Paste your live link',
      hint: 'The public https:// address of your page. It is kept in this browser as the proof of your first ship.',
      done: 'It’s live. That’s your first ship — a real link, made by you.',
    },
  },

  breakIt: [
    {
      title: 'Tiny on a phone',
      lang: 'html',
      code: `<!doctype html>
<html lang="en">
<head>
  <title>Ana Silva</title>
</head>
<body>
  <h1>Hi, I'm Ana</h1>`,
      err: [3, 4, 5],
      answer:
        'The `<head>` has no viewport line, so a phone pretends to be a wide desktop screen and shrinks the whole page to fit. Add `<meta name="viewport" content="width=device-width, initial-scale=1">` inside the head.',
      see: ['rendering', 2],
    },
    {
      title: 'It works on my laptop',
      lang: 'html',
      code: `<img src="C:\\Users\\ana\\Pictures\\me.jpg">
<a href="file:///C:/Users/ana/Documents/cv.pdf">My CV</a>`,
      err: [1, 2],
      answer:
        'Both paths point at Ana’s own computer. Online, each visitor’s browser looks for that drive on *their* computer and finds nothing. Put `me.jpg` and `cv.pdf` in the project folder and link them relatively (`src="me.jpg"`). Add `alt` text too: screen readers read it, and it shows if the image fails.',
    },
    {
      title: 'Half secure',
      lang: 'html',
      code: `<img src="http://photos.example.org/sunset.jpg" alt="A sunset over the bay">
<script src="http://widgets.example.org/visitor-counter.js"></script>`,
      err: [1, 2],
      answer:
        'Your page arrives over https, but these two load over plain http. Browsers block insecure scripts on a secure page outright, and upgrade or flag insecure images — so parts of the page quietly break. Use https addresses; better, keep your images in your own folder and leave out scripts you don’t need.',
    },
    {
      title: 'A contact form that “just works”',
      lang: 'html',
      code: `<script>
  const key = "sk_live_51Hx…"; // the email service's secret key
  function send(form) {
    fetch("https://api.mail-service.example/send", {
      method: "POST",
      headers: { Authorization: "Bearer " + key },
      body: new FormData(form),
    });
  }
</script>`,
      err: [2, 6],
      answer:
        'Every visitor downloads everything in a page. Anyone can open the source, copy this key and send email as you — until the bill or the ban arrives. A static page can’t keep a secret. For version one, use a `mailto:` link; later, a form service built for browsers, or your own server holding the key.',
    },
  ],

  explain: [
    'Explain to a friend what happens between you dropping your folder onto the host and their phone showing your page.',
    'Why can’t a page you publish keep a secret, like an API key?',
    'What did the AI get wrong in your first draft, and how did you notice?',
  ],

  deeper: [
    {
      q: 'What is the difference between a static site and a dynamic one?',
      a: 'A static site sends the same files to everyone; the host just hands them out. A dynamic site runs code on a server for each request — to look up *your* orders, say. Static is simpler, faster and almost free to host. You add a server when the page has to remember or decide something.',
    },
    {
      q: 'Do I need my own domain name?',
      a: 'Not to ship. The host’s free address works. A domain of your own costs a small yearly fee, and pointing it at your host means adding a few records in [[dns]] — worth it once you share the link widely.',
    },
    {
      q: 'Why is https free now, when it used to cost money?',
      a: 'Certificate authorities such as Let’s Encrypt issue certificates for free and automatically, so hosts switch [[https]] on for every site. The certificate shows the address really belongs to the site, and [[tls]] encrypts everything on the way.',
    },
    {
      q: 'Where does my page actually live once it is online?',
      a: 'On the host’s servers — usually many of them. Static hosts keep copies on a [[cdn]], so a visitor in Lagos and one in Tokyo are each answered from somewhere nearby.',
    },
    {
      q: 'How do I change the page once it is live?',
      a: 'Edit the file and publish again: drop the folder again, or push to your repository if the host is connected to Git. Each publish replaces the old version at the same address, and most hosts keep earlier versions so you can roll back.',
    },
    {
      q: 'When does a page need a server and a database?',
      a: 'When it must remember something visitors send (sign-ups, comments, orders), or show each person something different. That is where Part II of the Manual begins: *Remember things* and *Answer requests*.',
    },
  ],

  next: [
    { q: 'What did the browser do with your file, step by step?', chapter: 'how-the-web-works' },
    { q: 'If AI wrote half of it, how do you check the half you didn’t write?', chapter: 'build-with-ai' },
    { q: 'How do you make the page answer when someone taps something?', chapter: 'interact' },
    { q: 'How do you keep every version, and undo a bad change?', chapter: 'collaborate' },
  ],
};

export default writing;
