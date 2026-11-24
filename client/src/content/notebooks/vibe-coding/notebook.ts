import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'vibe-coding',
  title: 'Vibe Coding',
  name: 'Vibe Coding: Fundamentals & Overview',
  tagline: 'Building software with AI: how coding agents work, prompting for code, a safe workflow, reviewing AI code and shipping it.',
  color: 'pink',
  pillar: 'aiml',
  order: 20,
  cover: {
    big: 'VIBE CODING',
    full: 'Vibe Coding: Fundamentals & Overview',
    cloud: ['Describe it,', 'review it,', 'test it,', 'ship it'],
    art: {
      topLeft: iconArt('laptop', 'AI', 'pink'),
      topRight: flowArt(['Prompt', 'AI writes code', 'You review', 'Run & iterate'], 'pink'),
      left: codeArt(['"Add a login page', ' with email + Google,', ' and write tests."'], 'Prompt'),
      centre: hubArt('You + AI', ['Intent', 'Context', 'Review', 'Tests'], 'user', 'pink'),
    },
    side: { title: 'Tools', items: ['Claude Code', 'Cursor', 'v0 / Lovable', 'Copilot'] },
    why: { title: 'Why Vibe Coding ?', items: ['Build much faster', 'Prototype ideas in hours', 'Learn by reading AI code', 'The new developer workflow'] },
    footer: 'You are still the engineer!',
  },
  pages: [
    pg('introduction', 'What is Vibe Coding?', 'Where the term came from', 'Vibe coding vs AI-assisted engineering', 'Who it is for', 'Where it shines and where it fails'),
    pg('how-it-works', 'How AI Coding Tools Work', 'LLMs, tokens, context windows', 'Agents and tool use', 'Why AI makes things up', 'Models and costs'),
    pg('tools', 'The Tool Landscape', 'Chat assistants', 'AI IDEs and CLI agents', 'App builders: v0, Lovable, Bolt', 'Choosing a tool'),
    pg('prompting', 'Prompting for Code', 'Give context and constraints', 'Spec before code', 'Iterate in small steps', 'Examples and acceptance criteria'),
    pg('workflow', 'A Vibe Coding Workflow', 'Plan → build → run → review', 'Project rules files (CLAUDE.md)', 'Git checkpoints', 'Breaking work into tasks'),
    pg('review', 'Reviewing AI Code', 'Read every diff', 'Spotting invented APIs', 'Security red flags', 'Tests as the safety net'),
    pg('debugging', 'Debugging with AI', 'Share errors and logs', 'Reproduce first', 'Ask for the root cause', 'When to take over'),
    pg('shipping', 'From Prototype to Production', 'Hardening a vibe-coded app', 'Auth, validation, secrets', 'Deploying', 'Maintaining AI-written code'),
    pg('limits', 'Limits, Risks & Ethics', 'Over-reliance and skill decay', 'Licensing and privacy', 'Keeping costs under control', 'Keeping your fundamentals sharp'),
    revision('Vibe coding vs AI-assisted engineering', 'Chat assistant vs agent', 'Prototype vs production'),
  ],
});
