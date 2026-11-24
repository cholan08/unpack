import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'cicd',
  title: 'CI/CD',
  name: 'CI/CD & DevOps',
  tagline: 'Ship small changes safely and often: DevOps culture, pipelines, GitHub Actions, deploy strategies, IaC and monitoring.',
  color: 'yellow',
  pillar: 'devops',
  order: 70,
  cover: {
    big: 'CI/CD',
    full: 'CI/CD & DevOps',
    cloud: ['Small', 'changes,', 'shipped safely,', 'often'],
    art: {
      topLeft: iconArt('server', 'CI/CD', 'yellow'),
      topRight: flowArt(['Push', 'Build & test', 'Deploy', 'Monitor'], 'yellow'),
      left: codeArt(['on: push', 'jobs:', '  test:', '    runs-on: ubuntu-latest', '    steps: [npm test]'], 'Workflow'),
      centre: hubArt('Pipeline', ['Build', 'Test', 'Release', 'Observe'], 'box', 'yellow'),
    },
    side: { title: 'Tools', items: ['GH Actions', 'Jenkins', 'Docker', 'Terraform'] },
    why: { title: 'Why CI/CD ?', items: ['Ship faster', 'Fewer broken releases', 'Automate the boring parts', 'The heart of DevOps'] },
    footer: 'If it hurts, do it more often!',
  },
  pages: [
    pg('introduction', 'Introduction to DevOps', 'DevOps culture and principles', 'The Dev vs Ops problem', 'The DevOps lifecycle', 'DORA metrics'),
    pg('ci', 'Continuous Integration', 'What CI is', 'Build, lint, test on every push', 'Fast feedback', 'Artifacts'),
    pg('cd', 'Continuous Delivery & Deployment', 'Delivery vs deployment', 'Environments: dev, staging, prod', 'Release strategies', 'Rollbacks'),
    pg('github-actions', 'GitHub Actions', 'Workflows, jobs, steps', 'Triggers and matrices', 'Secrets and environments', 'Caching'),
    pg('strategies', 'Deployment Strategies', 'Blue-green', 'Canary', 'Rolling', 'Feature flags'),
    pg('iac', 'Infrastructure as Code', 'Why IaC', 'Terraform basics', 'Ansible basics', 'State and drift'),
    pg('monitoring', 'Monitoring & Observability', 'Logs, metrics, traces', 'Prometheus and Grafana', 'Alerting', 'Incident response'),
    pg('devsecops', 'DevSecOps', 'Shifting security left', 'Dependency and image scanning', 'Secrets in pipelines', 'Supply-chain security'),
    revision('CI vs CD', 'Continuous delivery vs deployment', 'Blue-green vs canary'),
  ],
});
