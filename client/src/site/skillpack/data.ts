/* Skillpack — the full-stack tool map. Each tile links to that tool's
   topic page (/skillpack/:id, topics in ./topics). `icon` keys live in ./icons.tsx. */

/** `id` is the URL key (/skillpack/:id) and the key into ./topics. A tool listed twice shares one id. */
export type SkillTool = { id: string; name: string; icon: string; sub?: string };
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
          { id: 'html', name: 'HTML', icon: 'html' },
          { id: 'css', name: 'CSS', icon: 'css' },
          { id: 'javascript', name: 'JavaScript', icon: 'javascript' },
          { id: 'typescript', name: 'TypeScript', icon: 'typescript' },
        ],
      },
      {
        title: 'Frameworks / Libraries',
        tools: [
          { id: 'react', name: 'React', icon: 'react' },
          { id: 'vue', name: 'Vue.js', icon: 'vue' },
          { id: 'angular', name: 'Angular', icon: 'angular' },
          { id: 'nextjs', name: 'Next.js', icon: 'next', sub: 'React Framework' },
          { id: 'nuxt', name: 'NuxtJS', icon: 'nuxt' },
        ],
      },
      {
        title: 'Styling / UI',
        tools: [
          { id: 'bootstrap', name: 'Bootstrap', icon: 'bootstrap' },
          { id: 'tailwind-css', name: 'Tailwind CSS', icon: 'tailwind' },
          { id: 'material-ui', name: 'Material UI', icon: 'mui' },
          { id: 'chakra-ui', name: 'Chakra UI', icon: 'chakra' },
          { id: 'shadcn', name: 'shadcn/ui', icon: 'shadcn', sub: 'UI Components' },
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
          { id: 'python', name: 'Python', icon: 'python' },
          { id: 'node', name: 'Node.js', icon: 'node' },
          { id: 'java', name: 'Java', icon: 'java' },
          { id: 'ruby', name: 'Ruby', icon: 'ruby' },
          { id: 'php', name: 'PHP', icon: 'php' },
          { id: 'csharp', name: 'C#', icon: 'csharp' },
          { id: 'rust', name: 'Rust', icon: 'rust' },
          { id: 'go', name: 'Go', icon: 'go' },
        ],
      },
      {
        title: 'Frameworks',
        tools: [
          { id: 'express', name: 'Express.js', icon: 'express' },
          { id: 'django', name: 'Django', icon: 'django' },
          { id: 'spring-boot', name: 'Spring Boot', icon: 'springboot' },
          { id: 'ruby-on-rails', name: 'Ruby on Rails', icon: 'rails' },
          { id: 'aspnet', name: 'ASP.NET', icon: 'dotnet' },
          { id: 'laravel', name: 'Laravel', icon: 'laravel' },
          { id: 'nestjs', name: 'NestJS', icon: 'nest' },
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
      { title: 'Relational (RDBMS)', tools: [{ id: 'mysql', name: 'MySQL', icon: 'mysql' }, { id: 'postgresql', name: 'PostgreSQL', icon: 'postgres' }] },
      { title: 'NoSQL (Document)', tools: [{ id: 'mongodb', name: 'MongoDB', icon: 'mongodb' }, { id: 'couchdb', name: 'CouchDB', icon: 'couchdb' }] },
      { title: 'Wide Column', tools: [{ id: 'cassandra', name: 'Cassandra', icon: 'cassandra' }] },
      { title: 'Search & Analytics', tools: [{ id: 'elasticsearch', name: 'Elasticsearch', icon: 'elasticsearch' }] },
      {
        title: 'Graph Database',
        tools: [{ id: 'neo4j', name: 'Neo4j', icon: 'neo4j' }, { id: 'arangodb', name: 'ArangoDB', icon: 'arangodb', sub: 'Multi-Model' }],
      },
      { title: 'Caching / Key-Value', tools: [{ id: 'redis', name: 'Redis', icon: 'redis' }] },
      {
        title: 'Message Queues & Event Streaming',
        tools: [
          { id: 'kafka', name: 'Kafka', icon: 'kafka' },
          { id: 'rabbitmq', name: 'RabbitMQ', icon: 'rabbitmq' },
          { id: 'amazon-sqs', name: 'Amazon SQS', icon: 'sqs' },
          { id: 'zeromq', name: 'ZeroMQ', icon: 'zeromq' },
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
      { title: 'Web Server / Reverse Proxy', tools: [{ id: 'nginx', name: 'Nginx', icon: 'nginx' }, { id: 'apache', name: 'Apache', icon: 'apache' }] },
      {
        title: 'Cloud Platforms',
        tools: [{ id: 'aws', name: 'AWS', icon: 'aws' }, { id: 'azure', name: 'Azure', icon: 'azure' }, { id: 'google-cloud', name: 'Google Cloud', icon: 'gcloud' }],
      },
      {
        title: 'Infrastructure as Code',
        tools: [{ id: 'ansible', name: 'Ansible', icon: 'ansible' }, { id: 'terraform', name: 'Terraform', icon: 'terraform' }, { id: 'chef', name: 'Chef', icon: 'chef' }],
      },
      {
        title: 'CI/CD',
        tools: [
          { id: 'jenkins', name: 'Jenkins', icon: 'jenkins' },
          { id: 'github-actions', name: 'GitHub Actions', icon: 'ghactions' },
          { id: 'gitlab-ci', name: 'GitLab CI/CD', icon: 'gitlab' },
        ],
      },
      {
        title: 'Containers & Orchestration',
        tools: [{ id: 'docker', name: 'Docker', icon: 'docker' }, { id: 'kubernetes', name: 'Kubernetes', icon: 'kubernetes' }, { id: 'openshift', name: 'OpenShift', icon: 'openshift' }],
      },
      {
        title: 'Monitoring & Logging',
        tools: [{ id: 'elk', name: 'ELK Stack', icon: 'elk' }, { id: 'prometheus', name: 'Prometheus', icon: 'prometheus' }, { id: 'grafana', name: 'Grafana', icon: 'grafana' }],
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
          { id: 'react-native', name: 'React Native', icon: 'react' },
          { id: 'flutter', name: 'Flutter', icon: 'flutter' },
          { id: 'ionic', name: 'Ionic', icon: 'ionic' },
          { id: 'maui', name: '.NET MAUI', icon: 'dotnet' },
          { id: 'pwa', name: 'PWA', icon: 'pwa', sub: 'Progressive Web App' },
        ],
      },
      {
        title: 'Android',
        note: 'Native Development',
        tools: [{ id: 'java', name: 'Java', icon: 'java' }, { id: 'kotlin', name: 'Kotlin', icon: 'kotlin' }, { id: 'android-sdk', name: 'Android SDK', icon: 'android' }],
      },
      {
        title: 'iOS',
        note: 'Native Development',
        tools: [{ id: 'swift', name: 'Swift', icon: 'swift' }, { id: 'objective-c', name: 'Objective-C', icon: 'apple' }, { id: 'xcode', name: 'Xcode', icon: 'xcode' }],
      },
    ],
  },
];
