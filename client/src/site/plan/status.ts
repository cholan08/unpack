/**
 * Where the learner stands on a topic's skill plan — pure functions of (plan, progress).
 * A skill is done when the learner ticked it as known, or finished every written lesson it links.
 */
import { COURSES, findEntry } from '@/content/registry';
import { NOTEBOOKS } from '@/content/notebooks/registry';
import type { Course, LessonMeta } from '@/engine/types';
import type { useProgress } from '@/lib/progress';
import { SKILL_ICONS } from '../skillpack/icons';
import { TOOL_INDEX } from '../skillpack/lookup';
import { TECH_SHEETS } from '../techpack/data';
import { PLANS, type PlanSkill, type PlanStage } from './data';

type Store = ReturnType<typeof useProgress>;

/** Plans link lessons of the main course. */
const course: Course | undefined = COURSES[0];

export interface SkillLesson {
  meta: LessonMeta;
  done: boolean;
  /** Step reached, when started but not finished. */
  step?: number;
  total?: number;
}

export interface SkillStatus {
  skill: PlanSkill;
  /** Written lessons only; links to lessons not written yet are left out. */
  lessons: SkillLesson[];
  lessonsDone: number;
  known: boolean;
  /** Finished every written lesson it links (and it links at least one). */
  byLessons: boolean;
  done: boolean;
  /** The lesson to open next for this skill: in progress, else first not done, else the first. */
  nextLesson?: SkillLesson;
}

export function skillStatus(skill: PlanSkill, progress: Store): SkillStatus {
  const lessons: SkillLesson[] = [];
  for (const id of skill.lessons ?? []) {
    const meta = course?.lessons[id];
    if (!meta || !course) continue;
    const p = progress.lessons[`${course.id}/${id}`];
    lessons.push({ meta, done: !!p?.done, step: p && !p.done ? p.step : undefined, total: p?.total });
  }
  const lessonsDone = lessons.filter((l) => l.done).length;
  const known = !!progress.known?.[skill.id];
  const byLessons = lessons.length > 0 && lessonsDone === lessons.length;
  const nextLesson = lessons.find((l) => l.step !== undefined) ?? lessons.find((l) => !l.done) ?? lessons[0];
  return { skill, lessons, lessonsDone, known, byLessons, done: known || byLessons, nextLesson };
}

export interface StageStatus {
  stage: PlanStage;
  skills: SkillStatus[];
  core: number;
  coreDone: number;
  state: 'done' | 'current' | 'next';
}

export interface PlanStatus {
  stages: StageStatus[];
  core: number;
  coreDone: number;
  pct: number;
  /** The stage being worked on (first with a core skill left), if any. */
  current?: StageStatus;
  /** First core skill not done, in plan order. */
  nextSkill?: SkillStatus;
  /** A lesson of this plan the learner left part-way through. */
  resume?: SkillLesson;
  lessons: number;
  notebooks: number;
  skills: number;
}

export function planStatus(stages: PlanStage[], progress: Store): PlanStatus {
  let currentSeen = false;
  const out: StageStatus[] = stages.map((stage) => {
    const skills = stage.skills.map((s) => skillStatus(s, progress));
    const coreSkills = skills.filter((s) => s.skill.level === 'core');
    const coreDone = coreSkills.filter((s) => s.done).length;
    let state: StageStatus['state'] = 'next';
    if (coreDone === coreSkills.length) state = 'done';
    else if (!currentSeen) {
      state = 'current';
      currentSeen = true;
    }
    return { stage, skills, core: coreSkills.length, coreDone, state };
  });
  const all = out.flatMap((s) => s.skills);
  const core = out.reduce((n, s) => n + s.core, 0);
  const coreDone = out.reduce((n, s) => n + s.coreDone, 0);
  const current = out.find((s) => s.state === 'current');
  const lessonIds = new Set(all.flatMap((s) => s.lessons.map((l) => l.meta.id)));
  const notebookIds = new Set(all.map((s) => s.skill.notebook).filter(Boolean));
  return {
    stages: out,
    core,
    coreDone,
    pct: core ? coreDone / core : 0,
    current,
    nextSkill: current?.skills.find((s) => s.skill.level === 'core' && !s.done),
    resume: all.flatMap((s) => s.lessons).find((l) => l.step !== undefined),
    lessons: lessonIds.size,
    notebooks: notebookIds.size,
    skills: all.length,
  };
}

export const lessonHref = (l: SkillLesson) => (course ? `/${course.id}/${l.meta.id}${l.step ? `?s=${l.step}` : ''}` : '/');

/** The course-map part where a skill's lessons start, for "see them in order". */
export const coursePartOf = (lessonId: string) => (course ? findEntry(course, lessonId)?.part : undefined);
export const courseId = course?.id;

/* ---------------- dev check: every link in the plans points at something real ---------------- */

if (import.meta.env.DEV) {
  const books = new Set(NOTEBOOKS.map((b) => b.id));
  const sheets = new Set(TECH_SHEETS.map((s) => s.id));
  const ids = new Set<string>();
  for (const [topic, stages] of Object.entries(PLANS))
    for (const st of stages)
      for (const s of st.skills) {
        const where = `[plans] ${topic} / ${s.id}`;
        if (ids.has(s.id)) console.warn(`${where}: skill id used twice`);
        ids.add(s.id);
        if (s.tool && !TOOL_INDEX.has(s.tool)) console.warn(`${where}: no Skill Pack tool "${s.tool}"`);
        if (s.notebook && !books.has(s.notebook)) console.warn(`${where}: no notebook "${s.notebook}"`);
        if (s.sheet && !sheets.has(s.sheet)) console.warn(`${where}: no Techpack sheet "${s.sheet}"`);
        if (s.icon && !SKILL_ICONS[s.icon]) console.warn(`${where}: no icon "${s.icon}"`);
        for (const l of s.lessons ?? []) if (course && !findEntry(course, l)) console.warn(`${where}: no lesson "${l}" in ${course.id}`);
      }
}
