import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'n8n',
  title: 'n8n',
  name: 'n8n Workflow Automation',
  tagline: 'Connect apps and automate work visually: triggers, nodes, expressions, APIs, code and AI agents.',
  color: 'orange',
  pillar: 'backend',
  order: 80,
  cover: {
    big: 'n8n',
    full: 'n8n Workflow Automation',
    cloud: ['Connect', 'apps,', 'automate', 'the boring'],
    art: {
      topLeft: iconArt('laptop', 'n8n', 'orange'),
      topRight: flowArt(['Trigger', 'Transform', 'Decide', 'Action'], 'orange'),
      left: codeArt(['{{ $json.email }}', '{{ $now.toISO() }}', '{{ $node["Form"].json }}'], 'Expressions'),
      centre: hubArt('Workflow', ['Triggers', 'Apps', 'Data', 'AI agents'], 'box', 'orange'),
    },
    side: { title: 'Nodes', items: ['Webhook', 'HTTP Request', 'IF / Switch', 'Code'] },
    why: { title: 'Why n8n ?', items: ['Automate repetitive work', 'Connects hundreds of apps', 'Open source, self-hostable', 'Build AI agents visually'] },
    footer: 'Do it twice? Automate it!',
  },
  pages: [
    pg('introduction', 'Introduction to n8n', 'What workflow automation is', 'n8n vs Zapier vs Make', 'Cloud vs self-hosted', 'A tour of the editor'),
    pg('core-concepts', 'Core Concepts', 'Workflows, nodes, connections', 'Items and JSON data', 'Executions', 'Credentials'),
    pg('triggers', 'Triggers', 'Manual and schedule (cron) triggers', 'Webhook trigger', 'App event triggers', 'Polling vs push'),
    pg('data-expressions', 'Data & Expressions', 'Expressions {{ }}', '$json, $node, $now', 'The Edit Fields (Set) node', 'Item linking'),
    pg('logic', 'Logic & Flow Control', 'IF and Switch', 'Merge', 'Looping over items', 'Wait and sub-workflows'),
    pg('http-apis', 'HTTP Requests & APIs', 'The HTTP Request node', 'Auth types', 'Pagination', 'Calling your own Express API'),
    pg('code-node', 'The Code Node', 'JavaScript in n8n', 'Transforming items', 'When to reach for code', 'Python support'),
    pg('ai-agents', 'AI Agents in n8n', 'Chat model nodes', 'The AI Agent node and tools', 'Memory', 'RAG with vector stores'),
    pg('production', 'Errors, Self-hosting & Scaling', 'Error workflows and retries', 'Self-hosting with Docker', 'Queue mode', 'Security best practices'),
    pg('use-cases', 'Real-World Workflows', 'Lead capture → CRM', 'Daily report emails', 'Slack and Telegram bots', 'Content pipelines'),
    revision('Trigger vs action node', 'Webhook vs polling', 'n8n vs custom code'),
  ],
});
