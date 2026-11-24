/* Every Skillpack tool's full topic list, keyed by SkillTool.id (../data.ts). One file per track. */
import { BACKEND } from './backend';
import { DATABASES } from './databases';
import { DEVOPS } from './devops';
import { FRONTEND } from './frontend';
import { MOBILE } from './mobile';
import type { TopicSection, ToolTopics } from './types';

export type { TopicSection, ToolTopics };

export const TOOL_TOPICS: ToolTopics = { ...FRONTEND, ...BACKEND, ...DATABASES, ...DEVOPS, ...MOBILE };

export const topicCount = (id: string) => TOOL_TOPICS[id]?.reduce((n, s) => n + s.topics.length, 0) ?? 0;
