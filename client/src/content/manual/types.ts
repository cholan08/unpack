/**
 * The Manual — the data shape (see docs/VISION.md §3 and docs/PLAN-MANUAL.md).
 *
 *   chapters.ts            the spine: four parts, every chapter, and links to what already exists
 *   written/<chapter>.ts   one chapter's hand-written sections (loaded on demand)
 *
 * Text fields accept the lesson rich-text markup: **bold** *italic* `code` [[term]] {tone:text}.
 */
import type { LucideIcon } from 'lucide-react';
import type { PillarId } from '@/engine/types';

export type ManualPartId = 'how' | 'blocks' | 'craft' | 'products';

export interface ManualPart {
  id: ManualPartId;
  /** Roman numeral shown on the contents page. */
  num: string;
  title: string;
  /** One line: what this part gives the learner. */
  promise: string;
}

/** The spine entry for one chapter. Written once; links to content that already exists. */
export interface Chapter {
  /** URL slug: /manual/:id. Also the file name under written/. */
  id: string;
  part: ManualPartId;
  /** The problem, in plain words: "Know who the user is". Never a tool name. */
  title: string;
  /** The usual name for it: "Authentication". */
  short: string;
  /** The curiosity hook: a question the learner can almost answer. */
  question: string;
  /** What the chapter covers, one line (shown before the chapter is written too). */
  covers: string;
  glyph: LucideIcon;
  /** Topic lenses: colour comes from the first one; the contents page filters by any of them. */
  lens: PillarId[];
  /** MERN lesson ids, in the order to read them (only written ones are shown). */
  lessons?: string[];
  /** Notebook ids (only notebooks with written pages are shown). */
  notebooks?: string[];
  /** Skill Pack tool ids: the technologies that solve this problem. */
  tools?: string[];
  /** Techpack sheet ids. */
  sheets?: string[];
  /** Gate: the course part id whose gate proves this chapter. */
  gate?: string;
  /** Capstone milestone ids that use this block. */
  milestones?: string[];
  /** A page that *is* this chapter (Part IV products), instead of a chapter page. */
  href?: string;
}

/* ---------------- the hand-written chapter ---------------- */

export interface Predict {
  q: string;
  options: string[];
  /** Index into options. */
  answer: number;
  /** Shown after any pick: why the answer is right. */
  reveal: string;
}

export interface Option {
  name: string;
  /** What it is, in one or two sentences. */
  what: string;
  pickWhen: string;
  /** What you give up. */
  cost: string;
  /** Real names, e.g. "Clerk, Auth0, Firebase Auth". */
  examples?: string;
  /** Skill Pack tool ids to link. */
  tools?: string[];
}

/** A link to one step of a MERN lesson: [lessonId, step] (step 1 = the first step). */
export type StepRef = [string, number];

export interface BuildStep {
  title: string;
  text: string;
  /** The lesson step that teaches this. */
  see?: StepRef;
}

export interface BreakIt {
  title: string;
  code: string;
  lang?: string;
  /** Lines to mark as the problem once revealed. */
  err?: number[];
  /** What is wrong and how to fix it. */
  answer: string;
  see?: StepRef;
}

export interface ChapterWriting {
  /** Set when the owner has reviewed the AI draft (YYYY-MM-DD). Until then the page shows "draft". */
  reviewed?: string;
  /** The question: the problem as a short story, then a prediction before the answer. */
  hook: { story: string[]; predict: Predict };
  /** The idea without a stack: the jobs any solution must do, and an everyday picture. */
  idea: { lede: string; jobs: { title: string; text: string }[]; picture: string };
  /** One line per lesson id: why this lesson, at this point in the chapter. */
  lessonNotes?: Record<string, string>;
  /** The ways to solve it, and how to choose. */
  options: { lede: string; items: Option[]; choose: { when: string; pick: string }[] };
  /** How it's done today, including AI, and what the builder still checks themselves. */
  modern: { lede: string; defaults: string[]; aiGood: string[]; aiWrong: { mistake: string; fix: string }[] };
  /** A mini build, by hand once and with AI. */
  build: {
    title: string;
    brief: string;
    byHand: BuildStep[];
    withAI: { lede: string; prompt: string };
    /** Checks the learner runs on the result, whoever wrote the code. */
    verify: string[];
    /**
     * The build ends with something live: the page asks for its public link and keeps it as proof
     * (a level needs it — docs/VISION.md §5). Shown under the checks.
     */
    proof?: { label: string; hint: string; /** Said once, when the link is first saved. */ done?: string };
  };
  /** "What's wrong with this code?" cards. */
  breakIt: BreakIt[];
  /** Explain-back prompts (open the mentor). */
  explain: string[];
  /** Questions to chase next, each with a short answer. */
  deeper: { q: string; a: string }[];
  /** The next questions, each leading to a chapter. */
  next: { q: string; chapter: string }[];
}
