/* Find a Skillpack tool by id, where it sits on the page, and its neighbours in page order. */
import { SKILL_TRACKS, type SkillGroup, type SkillTool, type SkillTrack } from './data';

export type ToolPlace = { track: SkillTrack; group: SkillGroup };
export type ToolEntry = { tool: SkillTool; places: ToolPlace[] };

/** Every tool once, in page order. A tool listed in two tracks (Java) keeps both places. */
export const TOOL_INDEX: Map<string, ToolEntry> = (() => {
  const m = new Map<string, ToolEntry>();
  for (const track of SKILL_TRACKS)
    for (const group of track.groups)
      for (const tool of group.tools) {
        const e = m.get(tool.id);
        if (e) e.places.push({ track, group });
        else m.set(tool.id, { tool, places: [{ track, group }] });
      }
  return m;
})();

const ORDER = [...TOOL_INDEX.keys()];

export function neighbours(id: string) {
  const i = ORDER.indexOf(id);
  return {
    prev: i > 0 ? TOOL_INDEX.get(ORDER[i - 1])!.tool : undefined,
    next: i >= 0 && i < ORDER.length - 1 ? TOOL_INDEX.get(ORDER[i + 1])!.tool : undefined,
  };
}

export const toolHref = (id: string) => `/skillpack/${id}`;
