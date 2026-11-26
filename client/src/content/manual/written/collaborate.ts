/**
 * Chapter: Work with others (Part III · The builder’s craft).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'Working alone, you can keep the whole app in your head. Add one more person and things change: two people edit the same file, someone’s half-finished feature breaks your page, and nobody remembers why that strange line exists.',
      'Every product of any size is built by several people — and now by people working alongside AI agents. What makes it work isn’t genius. It is shared habits: one history of every change, small changes reviewed by another pair of eyes, and decisions written down.',
      'How do ten people change the same code at the same time without chaos?',
    ],
    predict: {
      q: 'You and a teammate both edited the same function on different branches. What happens when you merge?',
      options: [
        'Git keeps the newer version',
        'Git throws away both changes',
        'Changes to different lines are combined; if you both changed the same lines, Git stops and asks you to decide',
        'The merge always fails',
      ],
      answer: 2,
      reveal:
        'Git compares both branches with their common ancestor. Changes to different lines merge by themselves; when both sides changed the *same* lines, Git can’t know which is right, so it marks a [[conflict]] and asks a human. Small, frequent merges keep conflicts small and rare.',
    },
  },

  idea: {
    lede: 'Whether it is two friends or two hundred engineers — plus their AI assistants — working together on code comes down to five habits.',
    jobs: [
      {
        title: 'One shared history',
        text: '[[git|Git]] records every change as a [[git-commit|commit]], with who, when and why. A shared [[remote]] such as GitHub is the copy everyone trusts.',
      },
      {
        title: 'Work on a branch',
        text: 'Each change happens on its own [[branch]], so unfinished work never breaks `main`.',
      },
      {
        title: 'Small changes, reviewed',
        text: 'A [[pull-request|pull request]] proposes a change; automated checks run, and another person reviews it before it is merged.',
      },
      {
        title: 'Write it down',
        text: 'Commit messages, pull request descriptions, a README, decision notes — the *why* that code alone can’t show.',
      },
      {
        title: 'Agree on the rules once',
        text: 'Formatting, naming, folder structure, how to branch and release — decided once and enforced by tools, not argued in every review.',
      },
    ],
    picture:
      'A team writing a book together. There is one master copy everyone trusts (the remote). Each writer drafts a chapter in their own copy (a branch). Before a chapter goes into the book, an editor reads it and the spell-checker runs (pull requests and CI). Margin notes explain unusual choices (documentation). And a style guide settled, once, whether it is “colour” or “color” (agreed rules).',
  },

  lessonNotes: {
    git: 'The shared history: snapshots, branches, merges and conflicts, rebasing, remotes and pull requests.',
  },

  options: {
    lede: 'Teams differ in how they branch and release. The common thread: keep `main` working, keep changes small, and let tools enforce what people would otherwise argue about.',
    items: [
      {
        name: 'GitHub flow',
        what: 'A branch per feature or fix, a pull request, a review, a merge into `main`, a deploy.',
        pickWhen: 'Small teams and open source — the common default.',
        cost: 'Branches that live too long drift apart and conflict.',
        examples: 'Pull requests on GitHub, GitLab or Bitbucket',
        tools: ['github-actions'],
      },
      {
        name: 'Trunk-based development',
        what: 'Everyone merges small changes into `main` at least daily; unfinished features hide behind feature flags.',
        pickWhen: 'Teams with good automated tests that ship often.',
        cost: 'Needs strong CI, and the discipline to keep every change small.',
        examples: 'Short-lived branches; feature flags (Unleash, LaunchDarkly, PostHog)',
      },
      {
        name: 'Release branches',
        what: 'A version is stabilised on its own branch while work continues on `main`.',
        pickWhen: 'Mobile apps, installed software — anything people keep using in old versions.',
        cost: 'Fixes must be applied to several branches.',
        examples: '`release/1.4` branches, Git flow',
      },
      {
        name: 'Pairing and mobbing',
        what: 'Two or more people work on the same code at the same time, one at the keyboard.',
        pickWhen: 'Hard problems, onboarding someone new, spreading knowledge.',
        cost: 'Feels slower, and it is tiring all day long.',
        examples: 'VS Code Live Share, screen sharing',
      },
      {
        name: 'People plus AI agents',
        what: 'AI agents open branches and pull requests too; people set the tasks, review and merge.',
        pickWhen: 'Well-defined tasks with good tests: bug fixes, migrations, tests, small features.',
        cost: 'More to review — and vague tasks produce confident, wrong changes.',
        examples: 'Coding agents in the editor or terminal that open pull requests',
      },
    ],
    choose: [
      { when: 'Two or three people, one product', pick: 'GitHub flow: branch, pull request, review, merge.' },
      { when: 'A team with strong tests that ships daily', pick: 'Trunk-based development with feature flags.' },
      { when: 'An app people install and keep for months', pick: 'Release branches.' },
      { when: 'AI agents writing code too', pick: 'The same rules as people: a branch, a pull request, green checks, a human review.' },
    ],
  },

  modern: {
    lede: 'In the AI era far more code arrives in pull requests — some from people, some from agents. Reviewing well becomes the central team skill: reading a change, asking whether it does what was asked, checking it is tested, and spotting what it quietly breaks. Small changes and clear descriptions are what make that possible.',
    defaults: [
      '`main` is always deployable; all work happens on short-lived branches.',
      'Small pull requests — ideally a few hundred lines at most — describing what, why and how to test.',
      'CI runs on every pull request, and at least one other person reviews before merging.',
      'Formatting and linting run automatically (Prettier, ESLint), so reviews discuss ideas, not spaces.',
      'Commit messages explain *why*; a README gets a newcomer running in 15 minutes.',
      'AI-written changes get the same branch, the same checks and the same review as anyone’s.',
    ],
    aiGood: [
      'Writing commit messages and pull request descriptions from a diff',
      'Reviewing a pull request for bugs, missing tests and unclear names',
      'Resolving merge conflicts — with you confirming each side',
      'Writing READMEs, contributing guides and decision records',
      'Explaining a confusing Git situation',
    ],
    aiWrong: [
      { mistake: 'Resolves a conflict by keeping one side wholesale.', fix: 'Read both sides — the right answer often combines them.' },
      { mistake: 'Writes commit messages that repeat the diff, not the reason.', fix: 'Say why the change was needed.' },
      { mistake: 'Produces one huge change that touches everything.', fix: 'Ask for small, focused pull requests.' },
      { mistake: 'Suggests `git push --force` on a shared branch.', fix: 'Never on shared branches; `--force-with-lease` on your own, if at all.' },
      { mistake: 'Approves its own code in review.', fix: 'A person reads every change that ships.' },
      { mistake: 'Reformats files it didn’t need to touch.', fix: 'Keep the diff to what the task needs.' },
    ],
  },

  build: {
    title: 'Work like a team — even alone',
    brief: 'Run your bookmarks app the way a team would: a protected `main`, branches, pull requests with checks and a reviewer — a friend, or your AI assistant as a second reviewer, with you deciding — and a conflict resolved on purpose.',
    byHand: [
      { title: 'Protect main', text: 'On GitHub, require a pull request and passing checks before anything merges into `main`.', see: ['git', 9] },
      { title: 'A branch for each change', text: '`git switch -c feature/tag-filter`, then commit small steps with messages that say why.', see: ['git', 4] },
      { title: 'Open a pull request', text: 'Describe what changed, why, and how to test it. Watch the checks run.', see: ['git', 9] },
      { title: 'Review it properly', text: 'Read your own diff as a reviewer: does it do what was asked, is it tested, what could it break? Ask a friend to review it too.' },
      { title: 'Make a conflict on purpose', text: 'Change the same line on two branches, merge one, then merge the other and resolve the conflict by hand.', see: ['git', 7] },
      { title: 'Merge or rebase?', text: 'Bring the latest `main` into a branch both ways, and compare the resulting history.', see: ['git', 8] },
      { title: 'Write it down', text: 'A README that takes a newcomer from clone to running app in 15 minutes, and one decision note.' },
    ],
    withAI: {
      lede: 'Use your AI assistant as a second reviewer. The prompt asks for specific, line-by-line findings and a verdict — the decision to merge stays yours.',
      prompt: `Review this pull request as a careful senior teammate. I'll paste the description and the diff.

1. Does the change do what the description says? Point out anything missing or extra.
2. List bugs or risky cases (security, permissions, error handling, edge cases), with the exact lines.
3. Which behaviour is not covered by the tests in the diff?
4. Suggest clearer names or simpler code only where it really matters.
5. End with a one-line verdict: approve, approve with comments, or request changes.

Be specific and cite lines. Do not rewrite the whole change.`,
    },
    verify: [
      'Nobody can push straight to `main`; merging needs a pull request with green checks.',
      'Your last three commit messages explain *why*, not just *what*.',
      'Your pull request has a description someone else could test from.',
      'You resolved a conflict by reading both sides, not by picking one blindly.',
      'You can explain merging versus rebasing using your own history.',
      'Someone — or something — reviewed your pull request, and you changed something because of it.',
      'A friend got the app running from your README alone.',
    ],
  },

  breakIt: [
    {
      title: 'A week of commits',
      lang: 'text',
      code: `fix
wip
asdf
final changes
final changes 2`,
      err: [1, 2, 3, 4, 5],
      answer:
        'Six months from now nobody — not you, not an AI reading the history — can tell why anything changed. Say what and why: `Fix duplicate bookmarks on double-click (debounce + unique index)`. Squash work-in-progress commits before merging.',
    },
    {
      title: 'One giant pull request',
      lang: 'text',
      code: `PR #42: "Updates"
Files changed: 87   +4,912 −3,207`,
      err: [1, 2],
      answer:
        'Nobody can review 8,000 changed lines properly: reviewers skim and approve, and bugs slip through. Split it — one pull request per idea (the refactor, the feature, the formatting), each small enough to read in one sitting.',
    },
    {
      title: 'Resolving a conflict',
      lang: 'text',
      code: `<<<<<<< HEAD
const LIMIT = 50; // raised for the new dashboard
=======
const LIMIT = 20; // lowered: big pages time out on mobile
>>>>>>> feature/mobile-fix`,
      err: [2, 4],
      answer:
        'Both sides had a reason. Keeping either one blindly breaks the other person’s fix. Read both, talk if you need to, and combine them — perhaps 20 by default, and 50 for the dashboard’s own query.',
      see: ['git', 7],
    },
    {
      title: 'Tidying a shared branch',
      lang: 'bash',
      code: `$ git rebase main
$ git push --force origin feature/shared-checkout`,
      err: [2],
      answer:
        'Rebasing rewrites the branch’s commits, and force-pushing a branch others use throws away whatever they pushed in the meantime. On shared branches, merge `main` in instead — or use `--force-with-lease`, which refuses if someone else has pushed.',
      see: ['git', 8],
    },
  ],

  explain: [
    'Why does every change happen on a branch and arrive through a pull request?',
    'What causes a merge conflict, and how do you resolve one well?',
    'Why should AI-written changes get the same review as human ones?',
  ],

  deeper: [
    {
      q: 'What is a feature flag?',
      a: 'A switch in your code that turns a feature on or off without deploying — so unfinished work can be merged safely, released to a few users first, and switched off instantly if it breaks.',
    },
    {
      q: 'What makes a good code review?',
      a: 'Checking the change does what was asked, is tested, handles failure and is understandable — and being kind and specific. Style debates belong to automatic formatters, not reviewers.',
    },
    {
      q: 'Why do teams use version numbers like 2.4.1?',
      a: 'Semantic versioning: breaking changes bump the first number, new features the second, fixes the third — a promise to everyone who depends on your code about how risky an upgrade is.',
    },
    {
      q: 'Why do big companies keep everything in one repository?',
      a: 'In a monorepo, a change that spans several projects is one pull request, and shared code is easy to reuse — at the price of heavier tooling to build and test only what changed.',
    },
    {
      q: 'How does open source collaboration work?',
      a: 'Contributors fork a project, change it on a branch and open a pull request; maintainers review and merge. Issues, discussions and contributing guides keep thousands of strangers pulling in one direction.',
    },
    {
      q: 'How do teams work with AI agents day to day?',
      a: 'Agents take well-defined tasks — fix this bug, add these tests — and open pull requests. People write clear task descriptions, keep the tests strong, and review every change as carefully as a colleague’s.',
    },
  ],

  next: [
    { q: 'How do you find your way around code you didn’t write?', chapter: 'read-code' },
    { q: 'How do you make sure a change breaks nothing?', chapter: 'testing' },
    { q: 'How do merged changes reach users?', chapter: 'ship' },
    { q: 'How do you build with AI without losing control?', chapter: 'build-with-ai' },
  ],
};

export default writing;
