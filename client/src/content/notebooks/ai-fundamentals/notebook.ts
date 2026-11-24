import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'ai-fundamentals',
  title: 'AI & LLMs',
  name: 'AI & LLM Fundamentals',
  tagline: 'What sits under every AI feature: ML basics, transformers, LLMs, prompting, LLM APIs, RAG, agents and evals.',
  color: 'green',
  pillar: 'aiml',
  order: 10,
  cover: {
    big: 'AI',
    full: 'AI & LLM Fundamentals',
    cloud: ['Predict', 'the next', 'token,', 'at scale'],
    art: {
      topLeft: iconArt('cloud', 'AI', 'green'),
      topRight: flowArt(['Prompt', 'Tokens', 'Model', 'Response'], 'green'),
      left: codeArt(['messages: [', '  { role: "user",', '    content: "Hi" }', ']'], 'API call'),
      centre: hubArt('LLM', ['Prompts', 'Context', 'Tools', 'Memory'], 'box', 'green'),
    },
    side: { title: 'Build', items: ['Prompting', 'RAG', 'Agents', 'Evals'] },
    why: { title: 'Why AI ?', items: ['Every app is adding AI', 'Use it well, not blindly', 'New kinds of jobs', 'See past the hype'] },
    footer: 'Garbage in, garbage out!',
  },
  pages: [
    pg('introduction', 'Introduction to AI', 'AI vs ML vs deep learning', 'Supervised, unsupervised, reinforcement', 'What changed with LLMs', 'Real-world uses'),
    pg('ml-basics', 'Machine Learning Basics', 'Data, features, labels', 'Training vs inference', 'Overfitting', 'Evaluation metrics'),
    pg('transformers', 'Neural Networks & Transformers', 'Neurons and layers', 'Embeddings', 'Attention', 'The transformer architecture'),
    pg('llms', 'Large Language Models', 'Tokens and context windows', 'Pre-training and fine-tuning', 'Temperature and sampling', 'Hallucinations'),
    pg('prompting', 'Prompt Engineering', 'Clear instructions and roles', 'Few-shot examples', 'Asking for step-by-step reasoning', 'Structured output (JSON)'),
    pg('apis', 'Using LLM APIs', 'Messages and system prompts', 'Streaming', 'Tool / function calling', 'Cost and rate limits'),
    pg('rag', 'RAG: Retrieval-Augmented Generation', 'Why RAG', 'Embeddings and vector databases', 'Chunking and retrieval', 'Grounded answers'),
    pg('agents', 'AI Agents', 'The agent loop: think, act, observe', 'Tools and MCP', 'Memory', 'Multi-agent systems'),
    pg('evals-safety', 'Evals, Safety & Ethics', 'Evaluating outputs', 'Bias and fairness', 'Prompt injection', 'Privacy and responsible AI'),
    revision('AI vs ML vs DL', 'RAG vs fine-tuning', 'Chatbot vs agent'),
  ],
});
