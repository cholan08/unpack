/** A tool's full syllabus: sections in learning order, each a list of topic names. */
export type TopicSection = { title: string; topics: string[] };
export type ToolTopics = Record<string, TopicSection[]>;
