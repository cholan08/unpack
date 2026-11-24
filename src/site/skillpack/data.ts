/* Skillpack — the full-stack tool map. Display-only for now: tiles are not
   linked to any content yet. `icon` keys live in ./icons.tsx. */

export type SkillTool = { name: string; icon: string; sub?: string };
export type SkillGroup = { title: string; note?: string; tools: SkillTool[] };
export type SkillTrack = {
  id: string;
  /** Big heading split into a plain part and an accented part, e.g. FRONT + END. */
  head: [string, string];
  label: string;
  /** Role colour token used for the accent. */
  accent: 'client' | 'server' | 'data' | 'net' | 'auth';
  groups: SkillGroup[];
};

export const SKILL_TRACKS: SkillTrack[] = [
  {
    id: 'frontend',
    head: ['Front', 'end'],
    label: 'Frontend',
    accent: 'client',
    groups: [
      {
        title: 'Core Basics',
        tools: [
          { name: 'HTML', icon: 'html' },
          { name: 'CSS', icon: 'css' },
          { name: 'JavaScript', icon: 'javascript' },
          { name: 'TypeScript', icon: 'typescript' },
        ],
      },
      {
        title: 'Frameworks / Libraries',
        tools: [
          { name: 'React', icon: 'react' },
          { name: 'Vue.js', icon: 'vue' },
          { name: 'Angular', icon: 'angular' },
          { name: 'Next.js', icon: 'next', sub: 'React Framework' },
          { name: 'NuxtJS', icon: 'nuxt' },
        ],
      },
      {
        title: 'Styling / UI',
        tools: [
          { name: 'Bootstrap', icon: 'bootstrap' },
          { name: 'Tailwind CSS', icon: 'tailwind' },
          { name: 'Material UI', icon: 'mui' },
          { name: 'Chakra UI', icon: 'chakra' },
          { name: 'shadcn/ui', icon: 'shadcn', sub: 'UI Components' },
        ],
      },
    ],
  },
  {
    id: 'backend',
    head: ['Back', 'end'],
    label: 'Backend',
    accent: 'server',
    groups: [
      {
        title: 'Languages & Runtimes',
        tools: [
          { name: 'Python', icon: 'python' },
          { name: 'Node.js', icon: 'node' },
          { name: 'Java', icon: 'java' },
          { name: 'Ruby', icon: 'ruby' },
          { name: 'PHP', icon: 'php' },
          { name: 'C#', icon: 'csharp' },
          { name: 'Rust', icon: 'rust' },
          { name: 'Go', icon: 'go' },
        ],
      },
      {
        title: 'Frameworks',
        tools: [
          { name: 'Express.js', icon: 'express' },
          { name: 'Django', icon: 'django' },
          { name: 'Spring Boot', icon: 'springboot' },
          { name: 'Ruby on Rails', icon: 'rails' },
          { name: 'ASP.NET', icon: 'dotnet' },
          { name: 'Laravel', icon: 'laravel' },
          { name: 'NestJS', icon: 'nest' },
        ],
      },
    ],
  },
  {
    id: 'databases',
    head: ['Data', 'bases'],
    label: 'Databases',
    accent: 'data',
    groups: [
      { title: 'Relational (RDBMS)', tools: [{ name: 'MySQL', icon: 'mysql' }, { name: 'PostgreSQL', icon: 'postgres' }] },
      { title: 'NoSQL (Document)', tools: [{ name: 'MongoDB', icon: 'mongodb' }, { name: 'CouchDB', icon: 'couchdb' }] },
      { title: 'Wide Column', tools: [{ name: 'Cassandra', icon: 'cassandra' }] },
      { title: 'Search & Analytics', tools: [{ name: 'Elasticsearch', icon: 'elasticsearch' }] },
      {
        title: 'Graph Database',
        tools: [{ name: 'Neo4j', icon: 'neo4j' }, { name: 'ArangoDB', icon: 'arangodb', sub: 'Multi-Model' }],
      },
      { title: 'Caching / Key-Value', tools: [{ name: 'Redis', icon: 'redis' }] },
      {
        title: 'Message Queues & Event Streaming',
        tools: [
          { name: 'Kafka', icon: 'kafka' },
          { name: 'RabbitMQ', icon: 'rabbitmq' },
          { name: 'Amazon SQS', icon: 'sqs' },
          { name: 'ZeroMQ', icon: 'zeromq' },
        ],
      },
    ],
  },
  {
    id: 'devops',
    head: ['Dev', 'Ops'],
    label: 'DevOps',
    accent: 'net',
    groups: [
      { title: 'Web Server / Reverse Proxy', tools: [{ name: 'Nginx', icon: 'nginx' }, { name: 'Apache', icon: 'apache' }] },
      {
        title: 'Cloud Platforms',
        tools: [{ name: 'AWS', icon: 'aws' }, { name: 'Azure', icon: 'azure' }, { name: 'Google Cloud', icon: 'gcloud' }],
      },
      {
        title: 'Infrastructure as Code',
        tools: [{ name: 'Ansible', icon: 'ansible' }, { name: 'Terraform', icon: 'terraform' }, { name: 'Chef', icon: 'chef' }],
      },
      {
        title: 'CI/CD',
        tools: [
          { name: 'Jenkins', icon: 'jenkins' },
          { name: 'GitHub Actions', icon: 'ghactions' },
          { name: 'GitLab CI/CD', icon: 'gitlab' },
        ],
      },
      {
        title: 'Containers & Orchestration',
        tools: [{ name: 'Docker', icon: 'docker' }, { name: 'Kubernetes', icon: 'kubernetes' }, { name: 'OpenShift', icon: 'openshift' }],
      },
      {
        title: 'Monitoring & Logging',
        tools: [{ name: 'ELK Stack', icon: 'elk' }, { name: 'Prometheus', icon: 'prometheus' }, { name: 'Grafana', icon: 'grafana' }],
      },
    ],
  },
  {
    id: 'mobile',
    head: ['Mobile ', 'App'],
    label: 'Mobile',
    accent: 'auth',
    groups: [
      {
        title: 'Cross Platform',
        tools: [
          { name: 'React Native', icon: 'react' },
          { name: 'Flutter', icon: 'flutter' },
          { name: 'Ionic', icon: 'ionic' },
          { name: '.NET MAUI', icon: 'dotnet' },
          { name: 'PWA', icon: 'pwa', sub: 'Progressive Web App' },
        ],
      },
      {
        title: 'Android',
        note: 'Native Development',
        tools: [{ name: 'Java', icon: 'java' }, { name: 'Kotlin', icon: 'kotlin' }, { name: 'Android SDK', icon: 'android' }],
      },
      {
        title: 'iOS',
        note: 'Native Development',
        tools: [{ name: 'Swift', icon: 'swift' }, { name: 'Objective-C', icon: 'apple' }, { name: 'Xcode', icon: 'xcode' }],
      },
    ],
  },
];
