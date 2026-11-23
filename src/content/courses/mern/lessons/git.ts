import { actor, box, chip, defineLesson, dot, flow, link, patch, zone } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- the commit graph: main on the top row, the login branch below ---------- */
const Y1 = 300;
const Y2 = 450;
const c = (x: number, y: number, hash: string, msg: string, tone: NodeSpec['tone'], below = true) =>
  dot(x, y, hash, { sub: msg, tone, caption: below ? 'below' : 'above' });

const c1 = c(110, Y1, 'a1f3', 'add todo list', 'client');
const c2 = c(230, Y1, '7b3a', 'style the list', 'client');
const c3 = c(350, Y1, 'c9d1', 'delete button', 'client');
const c4 = c(470, Y2, 'e2f8', 'login form', 'warn', false);
const c5 = c(590, Y2, '4d0b', 'call /api/login', 'warn', false);
const c6 = c(470, Y1, '91ac', 'fix header typo', 'client');
const c7 = c(710, Y1, 'f00d', 'merge login', 'ok');

const HEAD = { text: 'HEAD', tone: 'neutral' } as const;
const main = (x: number, head = true) => chip(x, 205, 'main', { tone: 'client', icon: 'waypoints', badge: head ? HEAD : undefined, w: 92 });
const login = (x: number, y: number, head = false) => chip(x, y, 'login', { tone: 'warn', icon: 'waypoints', badge: head ? HEAD : undefined, w: 92 });

const edge = (a: string, b: string, o: Partial<LinkSpec> = {}) => link(a, b, { arrow: false, ...o });
const ptr = (from: string, to: string) => link(from, to, { tone: 'neutral' });

/* step 2: the three areas */
const work = zone(170, 300, 290, 400, 'Working directory', { tone: 'neutral', icon: 'file' });
const staging = zone(500, 300, 290, 400, 'Staging area', { tone: 'warn', icon: 'inbox' });
const repo = zone(830, 300, 290, 400, 'Repository (.git)', { tone: 'client', icon: 'boxes' });

export default defineLesson({
  metrics: [
    { id: 'commits', label: 'Commits' },
    { id: 'branches', label: 'Branches' },
    { id: 'undo', label: 'Can go back' },
  ],
  legend: { data: 'changes', res: 'download' },
  goals: [
    { text: 'What a commit is', step: 2 },
    { text: 'Why a branch is cheap', step: 4 },
    { text: 'What a merge does', step: 6 },
    { text: 'Resolving a conflict', step: 7 },
    { text: 'Merge vs rebase', step: 8 },
    { text: 'Push, pull and pull requests', step: 9 },
  ],
  steps: [
    {
      short: 'Versions by hand',
      beat: 'problem',
      title: 'app-final-REAL-2.js',
      body: [
        'Without version control, saving history means copying files: `app-v2.js`, `app-final.js`, `app-final-REAL.js`. Which one works? What changed between them? Which is Ben’s?',
        'Two people editing the same project by emailing zips is worse: someone’s work always gets overwritten.',
      ],
      metrics: { commits: 0, branches: 0, undo: 'no' },
      scene: {
        nodes: {
          folder: zone(500, 300, 560, 360, 'my-project/', { tone: 'neutral', icon: 'file' }),
          you: actor(110, 300, 'You'),
          ben: actor(890, 300, 'Ben'),
          f1: chip(360, 210, 'app.js', { tone: 'neutral', icon: 'file', w: 210 }),
          f2: chip(640, 210, 'app-v2.js', { tone: 'neutral', icon: 'file', w: 210 }),
          f3: chip(360, 300, 'app-final.js', { tone: 'warn', icon: 'file', w: 210 }),
          f4: chip(640, 300, 'app-final-REAL.js', { tone: 'warn', icon: 'file', w: 210 }),
          f5: chip(360, 390, 'app-final-REAL-2.js', { tone: 'danger', icon: 'file', w: 210, state: 'error' }),
          f6: chip(640, 390, 'backup-tuesday.zip', { tone: 'danger', icon: 'file', w: 210 }),
        },
        links: [link('you', 'folder'), link('ben', 'folder')],
        flows: [
          flow(['you', 'folder'], { kind: 'data', label: 'save a copy', every: 4 }),
          flow(['ben', 'folder'], { kind: 'err', label: 'overwrite!', every: 4, offset: 2 }),
        ],
      },
    },
    {
      short: 'Commit',
      beat: 'solution',
      title: 'A commit is a snapshot of the whole project',
      body: [
        '[[git|Git]] keeps the history for you. You edit files as usual in the *working directory*, pick the changes that belong together with `git add` (the [[staging|staging area]]), and save them as a [[git-commit|commit]].',
        'A commit is a snapshot of every file, plus a message, an author, and a link to the commit before it. You can always go back to any of them.',
      ],
      code: {
        lang: 'bash',
        file: 'Terminal',
        code: `$ git status                   # what changed?
$ git add app.js TodoList.jsx  # stage these two
$ git commit -m "Add todo list"
[main a1f3c2e] Add todo list
 2 files changed, 48 insertions(+)`,
        hl: [2, 3],
      },
      metrics: { commits: 1, branches: 1, undo: 'yes' },
      scene: {
        nodes: {
          work,
          staging,
          repo,
          f1: chip(500, 255, 'app.js', { tone: 'warn', icon: 'file', w: 170 }),
          f2: chip(500, 315, 'TodoList.jsx', { tone: 'warn', icon: 'file', w: 170 }),
          f3: chip(170, 290, 'notes.txt', { tone: 'neutral', icon: 'file', w: 170, badge: { text: 'not staged', tone: 'neutral' } }),
          c1: { ...c1, x: 830, y: 290, state: 'active' },
        },
        links: [link('work', 'staging', { label: 'git add' }), link('staging', 'repo', { label: 'git commit' })],
        flows: [
          flow(['work', 'staging'], { kind: 'data', label: 'app.js, TodoList.jsx', every: 4.4 }),
          flow(['staging', 'repo'], { kind: 'data', label: 'snapshot', every: 4.4, offset: 1.6 }),
        ],
      },
    },
    {
      short: 'History',
      beat: 'technique',
      title: 'History is a chain of snapshots',
      body: [
        'Every commit points back to its parent, so the history is a chain. Each one has a unique id (a hash of its contents), usually shortened to a few characters.',
        'The branch `main` is a label on the newest commit, and [[head|HEAD]] says “this is where you are”. Commit again and `main` moves forward.',
      ],
      code: {
        lang: 'bash',
        file: 'Terminal',
        code: `$ git log --oneline
c9d1e04 (HEAD -> main) Add delete button
7b3a9f2 Style the list
a1f3c2e Add todo list`,
        hl: [2],
      },
      metrics: { commits: 3, branches: 1, undo: 'yes' },
      scene: {
        nodes: { c1, c2, c3: { ...c3, state: 'active' }, main: main(350) },
        links: [edge('c1', 'c2'), edge('c2', 'c3'), ptr('main', 'c3')],
        flows: [flow(['c3', 'c2', 'c1'], { kind: 'data', label: 'parent', every: 4, dwell: 0.3 })],
      },
    },
    {
      short: 'Branch',
      beat: 'technique',
      title: 'A branch is just a pointer',
      body: [
        'To build the login page without disturbing `main`, create a [[branch]]. Git doesn’t copy any files: it writes one tiny file holding the id of the current commit, and moves HEAD to it.',
        'Both branches point at the same commit for now. They’ll split as soon as you commit.',
      ],
      check: {
        q: 'What does `git switch -c login` copy?',
        options: ['The whole project folder', 'Only the files you’ve changed', 'Nothing — it writes a pointer to the current commit', 'The most recent commit'],
        answer: 2,
        explain: 'A branch is a named pointer (a 41-byte file in `.git/refs/heads/`). Creating one is instant, so make branches freely.',
      },
      code: {
        lang: 'bash',
        file: 'Terminal',
        code: `$ git switch -c login       # create a branch, move HEAD to it
Switched to a new branch 'login'

$ cat .git/refs/heads/login
c9d1e04a8b3f…               # that's all a branch is`,
        hl: [1, 5],
      },
      metrics: { commits: 3, branches: 2, undo: 'yes' },
      scene: {
        nodes: { c1, c2, c3: { ...c3, state: 'active' }, main: main(290, false), login: login(410, 205, true) },
        links: [edge('c1', 'c2'), edge('c2', 'c3'), ptr('main', 'c3'), ptr('login', 'c3')],
      },
    },
    {
      short: 'Diverge',
      beat: 'technique',
      title: 'Two lines of work, side by side',
      body: [
        'You make two commits on `login`; the `login` pointer moves along with them. Meanwhile a teammate fixes a typo on `main`.',
        'History has forked: both branches share everything up to `c9d1`, then go their own way. Neither one sees the other’s changes yet.',
      ],
      code: {
        lang: 'bash',
        file: 'Terminal',
        code: `# on login
$ git commit -am "Add login form"
$ git commit -am "Call /api/login"

# meanwhile, on main
$ git switch main
$ git commit -am "Fix header typo"`,
        hl: [2, 3, 7],
      },
      metrics: { commits: 6, branches: 2, undo: 'yes' },
      scene: {
        nodes: { c1, c2, c3, c4, c5: { ...c5, state: 'active' }, c6, main: main(470, false), login: login(590, 535, true) },
        links: [
          edge('c1', 'c2'),
          edge('c2', 'c3'),
          edge('c3', 'c6'),
          edge('c3', 'c4', { route: 'hvh', tone: 'warn' }),
          edge('c4', 'c5', { tone: 'warn' }),
          ptr('main', 'c6'),
          ptr('login', 'c5'),
        ],
        flows: [flow(['c3', 'c4', 'c5'], { kind: 'data', label: ['commit', 'commit'], every: 4, dwell: 0.3 })],
      },
    },
    {
      short: 'Merge',
      beat: 'technique',
      title: 'Merge: join the two lines back together',
      body: [
        'When login is ready, switch to `main` and [[merge]] `login` into it. Git finds the commit both share (`c9d1`), combines the changes made on each side since then, and records a **merge commit** with two parents.',
        '`main` moves to the merge commit. The `login` branch has done its job and can be deleted.',
      ],
      code: {
        lang: 'bash',
        file: 'Terminal',
        code: `$ git switch main
$ git merge login
Merge made by the 'ort' strategy.
 LoginForm.jsx | 42 ++++++++++++
 api.js        |  9 +++`,
        hl: [1, 2],
      },
      metrics: { commits: 7, branches: 2, undo: 'yes' },
      scene: {
        nodes: { c1, c2, c3, c4, c5, c6, c7: { ...c7, state: 'active' }, main: main(710), login: login(590, 535) },
        links: [
          edge('c1', 'c2'),
          edge('c2', 'c3'),
          edge('c3', 'c6'),
          edge('c3', 'c4', { route: 'hvh', tone: 'warn' }),
          edge('c4', 'c5', { tone: 'warn' }),
          edge('c6', 'c7'),
          edge('c5', 'c7', { route: 'hvh', tone: 'warn' }),
          ptr('main', 'c7'),
          ptr('login', 'c5'),
        ],
        flows: [
          flow(['c5', 'c7'], { kind: 'data', label: 'login’s changes', every: 4 }),
          flow(['c6', 'c7'], { kind: 'data', label: 'main’s changes', every: 4, offset: 0.4 }),
        ],
      },
    },
    {
      short: 'Conflict',
      beat: 'problem',
      title: 'When both sides changed the same line',
      body: [
        'Git merges automatically when the two sides touched different lines. But if both changed the **same** lines differently — main fixed a typo in the header, login rewrote it — Git can’t know which you want. That’s a [[conflict|merge conflict]].',
        'Git stops and marks the spot in the file. You edit it to the version you want, delete the markers, then `git add` and `git commit` to finish the merge.',
      ],
      callout: { kind: 'tip', text: 'Conflicts are normal, not a failure. Small branches merged often have small conflicts.' },
      code: {
        lang: 'text',
        file: 'Header.jsx',
        code: `<<<<<<< HEAD (main)
  <h1>My todos</h1>
=======
  <h1>Welcome back, {user.name}</h1>
>>>>>>> login

# edit the file to what you want, then:
$ git add Header.jsx && git commit`,
        err: [1, 3, 5],
        hl: [8],
      },
      metrics: { commits: '6 (+ merge pending)', branches: 2, undo: 'yes' },
      scene: {
        nodes: {
          c1,
          c2,
          c3,
          c4,
          c5,
          c6: { ...c6, state: 'active' },
          c7: { ...c7, state: 'error', label: '?', sub: 'merge paused', badge: { text: 'CONFLICT', tone: 'danger' } },
          main: main(470),
          login: login(590, 535),
        },
        links: [
          edge('c1', 'c2'),
          edge('c2', 'c3'),
          edge('c3', 'c6'),
          edge('c3', 'c4', { route: 'hvh', tone: 'warn' }),
          edge('c4', 'c5', { tone: 'warn' }),
          edge('c6', 'c7', { style: 'dashed', tone: 'danger' }),
          edge('c5', 'c7', { route: 'hvh', style: 'dashed', tone: 'danger' }),
          ptr('main', 'c6'),
          ptr('login', 'c5'),
        ],
        flows: [
          flow(['c5', 'c7'], { kind: 'err', label: 'Header.jsx line 2', fail: true, every: 4 }),
          flow(['c6', 'c7'], { kind: 'err', label: 'Header.jsx line 2', fail: true, every: 4, offset: 0.4 }),
        ],
      },
    },
    {
      short: 'Rebase',
      beat: 'tradeoff',
      title: 'Rebase: replay your commits on top instead',
      body: [
        'The alternative to merging is to [[rebase]]: take login’s commits and *replay* them on top of the latest `main`, as if you’d started from there. Git creates **new** commits (new ids) and leaves the old ones behind.',
        'The result is a straight line with no merge commit — easier to read. The catch: it rewrites history. Only rebase commits nobody else has pulled; never rebase a shared branch.',
      ],
      callout: { kind: 'warn', text: 'Golden rule: rebase your own local branch freely; never rebase commits already pushed to a branch others use.' },
      code: {
        lang: 'bash',
        file: 'Terminal',
        code: `$ git switch login
$ git rebase main     # replay login's commits on top of main
$ git switch main
$ git merge login     # fast-forward: just move the pointer`,
        hl: [2, 4],
      },
      metrics: { commits: 6, branches: 2, undo: 'yes' },
      scene: {
        nodes: {
          c1,
          c2,
          c3,
          c6,
          c4o: { ...c4, label: 'e2f8', state: 'ghost' },
          c5o: { ...c5, label: '4d0b', state: 'ghost' },
          c4: { ...c4, x: 590, y: Y1, label: 'b7e1', caption: 'below', state: 'active' },
          c5: { ...c5, x: 710, y: Y1, label: '3c9a', caption: 'below', state: 'active' },
          main: main(470, false),
          login: login(710, 205, true),
        },
        links: [
          edge('c1', 'c2'),
          edge('c2', 'c3'),
          edge('c3', 'c6'),
          edge('c3', 'c4o', { route: 'hvh', style: 'dashed' }),
          edge('c4o', 'c5o', { style: 'dashed' }),
          edge('c6', 'c4', { tone: 'warn' }),
          edge('c4', 'c5', { tone: 'warn' }),
          ptr('main', 'c6'),
          ptr('login', 'c5'),
        ],
        flows: [
          flow(['c4o', 'c4'], { kind: 'data', label: 'replay', every: 4.4 }),
          flow(['c5o', 'c5'], { kind: 'data', label: 'replay', every: 4.4, offset: 0.6 }),
        ],
      },
    },
    {
      short: 'Push & PR',
      beat: 'technique',
      title: 'Remotes, pull requests, and working as a team',
      body: [
        'Everything so far happened on your laptop. A [[remote]] — usually on GitHub, named `origin` — is another full copy of the repository. `git push` uploads your new commits; `git pull` downloads everyone else’s.',
        'On a team you push your branch and open a [[pull-request|pull request]]: teammates review the diff, automated tests run, and only then does it merge into `main`.',
      ],
      code: {
        lang: 'bash',
        file: 'Terminal',
        code: `$ git push -u origin login     # upload the branch
# on GitHub: open a pull request  login → main
# review + CI checks pass → "Merge"
$ git switch main && git pull  # download the merged main`,
        hl: [1, 4],
      },
      metrics: { commits: 7, branches: 2, undo: 'yes' },
      scene: {
        nodes: {
          zl: zone(285, 290, 530, 300, 'Your laptop', { tone: 'client', icon: 'terminal' }),
          zr: zone(790, 290, 380, 300, 'GitHub · origin', { tone: 'net', icon: 'cloud' }),
          c1: { ...c1, x: 80, sub: undefined },
          c2: { ...c2, x: 165, sub: undefined },
          c3: { ...c3, x: 250, sub: undefined },
          c6: { ...c6, x: 335, sub: undefined },
          c7: { ...c7, x: 420, sub: undefined, state: 'active' },
          main: main(420),
          o1: dot(640, Y1, 'a1f3', { tone: 'net' }),
          o2: dot(715, Y1, '7b3a', { tone: 'net' }),
          o3: dot(790, Y1, 'c9d1', { tone: 'net' }),
          o4: dot(865, Y1, '91ac', { tone: 'net' }),
          o5: dot(940, Y1, 'f00d', { tone: 'ok', state: 'active' }),
          pr: box(790, 505, 'Pull request #12', { sub: 'login → main · 2 approvals', icon: 'workflow', tone: 'net', w: 300, state: 'ok' }),
        },
        links: [
          edge('c1', 'c2'),
          edge('c2', 'c3'),
          edge('c3', 'c6'),
          edge('c6', 'c7'),
          ptr('main', 'c7'),
          edge('o1', 'o2'),
          edge('o2', 'o3'),
          edge('o3', 'o4'),
          edge('o4', 'o5'),
          link('zl', 'zr', { label: 'push / pull' }),
          link('zr', 'pr'),
        ],
        flows: [
          flow(['zl', 'zr'], { kind: 'data', label: 'git push', every: 6 }),
          flow(['zr', 'pr'], { kind: 'event', label: 'review + CI', back: 'event', backLabel: 'merged ✓', every: 6, offset: 1.3 }),
          flow(['zr', 'zl'], { kind: 'res', label: 'git pull', every: 6, offset: 4.2 }),
        ],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Git in one picture',
      body: [
        'A {client:commit} is a snapshot of the whole project, linked to its parent. Stage with `git add`, save with `git commit`.',
        'A {warn:branch} is a pointer to a commit; HEAD says which branch you’re on. Branches are free — use one per feature.',
        '{ok:Merge} joins histories with a merge commit; {warn:rebase} replays commits for a straight line (never on shared branches). Conflicts are normal: edit, add, commit.',
        'Push to a remote, open a pull request, review, merge, pull.',
      ],
      metrics: { commits: 7, branches: 2, undo: 'yes' },
      scene: {
        nodes: patch({ c1, c2, c3, c4, c5, c6, c7, main: main(710), login: login(590, 535) }, { c7: { state: 'active' } }),
        links: [
          edge('c1', 'c2'),
          edge('c2', 'c3'),
          edge('c3', 'c6'),
          edge('c3', 'c4', { route: 'hvh', tone: 'warn' }),
          edge('c4', 'c5', { tone: 'warn' }),
          edge('c6', 'c7'),
          edge('c5', 'c7', { route: 'hvh', tone: 'warn' }),
          ptr('main', 'c7'),
          ptr('login', 'c5'),
        ],
      },
    },
  ],
});
