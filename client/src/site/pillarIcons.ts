/** One icon per main topic, used by the sidebar, home cards and the command palette. */
import { BrainCircuit, Compass, Database, Hammer, Monitor, Rocket, Server, type LucideIcon } from 'lucide-react';
import type { PillarId } from '@/engine/types';

export const PILLAR_ICON: Record<PillarId, LucideIcon> = {
  start: Compass,
  frontend: Monitor,
  backend: Server,
  database: Database,
  devops: Rocket,
  aiml: BrainCircuit,
  projects: Hammer,
};
