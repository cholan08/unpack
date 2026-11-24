import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'git',
  title: 'Git',
  name: 'Git & GitHub',
  tagline: 'Version control for every project: commits, branches, merges, remotes, pull requests, undoing mistakes and team workflows.',
  color: 'orange',
  pillar: 'devops',
  order: 30,
  cover: {
    big: 'GIT',
    full: 'Git & GitHub',
    cloud: ['Save every', 'version,', 'work', 'together'],
    art: {
      topLeft: iconArt('laptop', 'Git', 'orange'),
      topRight: flowArt(['Working dir', 'Staging', 'Local repo', 'Remote'], 'orange'),
      left: codeArt(['git add .', 'git commit -m "msg"', 'git push origin main'], 'Basics'),
      centre: hubArt('Repo', ['Commits', 'Branches', 'Merges', 'Remotes'], 'box', 'orange'),
    },
    side: { title: 'Daily', items: ['status', 'add', 'commit', 'push'] },
    why: { title: 'Why Git ?', items: ['Never lose work', 'Team collaboration', 'Every job uses it', 'Your portfolio lives on GitHub'] },
    footer: 'Commit early, commit often!',
  },
  pages: [
    pg('introduction', 'Introduction to Git', 'Version control and why it matters', 'Git vs GitHub', 'Install and configure', 'Repositories'),
    pg('basics', 'The Core Workflow', 'Working dir, staging, repository', 'add, commit, status, log', 'diff', '.gitignore'),
    pg('branching', 'Branching & Merging', 'Branches and HEAD', 'Fast-forward vs three-way merge', 'Merge conflicts', 'switch and checkout'),
    pg('remotes', 'Remotes & GitHub', 'clone, fetch, pull, push', 'origin and upstream', 'Forks', 'SSH keys'),
    pg('collaboration', 'Pull Requests & Code Review', 'The PR workflow', 'Reviews and comments', 'Branch protection', 'Issues and projects'),
    pg('undo', 'Undoing Things', 'restore and reset', 'revert', 'commit --amend', 'reflog: the safety net'),
    pg('rebase', 'Rebase & History', 'Rebase vs merge', 'Interactive rebase', 'Squashing', 'cherry-pick'),
    pg('workflows', 'Branching Strategies', 'Git Flow', 'GitHub Flow', 'Trunk-based development', 'Conventional commits and tags'),
    pg('actions', 'GitHub Actions Basics', 'Workflows and triggers', 'Jobs and steps', 'Running tests on every push', 'Secrets'),
    revision('Merge vs rebase', 'reset vs revert', 'fetch vs pull'),
  ],
});
