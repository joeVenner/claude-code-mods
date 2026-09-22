import { LEARN_SOURCES } from "./learnContent";

/**
 * The 9 official videos from the announcement issue, as typed data. Every title, caption and asset id
 * is copied exactly from the issue body (fetched 2026-09-22); nothing here is paraphrased or guessed.
 *
 * The videos are not re-hosted. `videoUrl` and `posterUrl` are GitHub's own stable attachment URLs
 * (`github.com/user-attachments/assets/<id>`), the same ones the issue itself embeds: GitHub redirects
 * each one, on every request, to a short-lived signed link, so the stable URL keeps working indefinitely
 * without us holding a copy. See `VIDEO_HOSTS` for the hosts a browser reaches on that redirect, which
 * `vercel.json`'s Content-Security-Policy must allow.
 */

export const ANNOUNCEMENT_ISSUE_URL = LEARN_SOURCES.announcementIssue;

/** The two hosts a browser touches loading a video or poster: the stable front door, then its redirect target. */
export const VIDEO_HOSTS = {
  frontDoor: "github.com",
  redirectTarget: "github-production-user-asset-6210df.s3.amazonaws.com",
} as const;

export type VideoGroup = "basic" | "advanced" | "case-study";

export const VIDEO_GROUP_LABELS: Readonly<Record<VideoGroup, string>> = {
  basic: "Basic",
  advanced: "Advanced",
  "case-study": "Case studies",
};

/** As the issue states it: Basic and Advanced videos are 60 seconds each; Case Studies run longer, stated only approximately. */
export const VIDEO_GROUP_DURATIONS: Readonly<Record<VideoGroup, string>> = {
  basic: "60 seconds",
  advanced: "60 seconds",
  "case-study": "around 2 minutes",
};

export interface Video {
  readonly id: string;
  readonly order: number;
  readonly group: VideoGroup;
  readonly title: string;
  /** The issue's own one-sentence caption for this video, quoted exactly, never rewritten. */
  readonly caption: string;
  readonly videoUrl: string;
  readonly posterUrl: string;
  /**
   * An event or pattern the caption names outright, such as `ui.press`. Null unless the caption itself
   * says it: most captions describe what a video shows without naming a specific event, and nothing is
   * invented here to fill that in.
   */
  readonly eventNamed: string | null;
}

function assetUrl(id: string): string {
  return `https://${VIDEO_HOSTS.frontDoor}/user-attachments/assets/${id}`;
}

export const VIDEOS: readonly Video[] = [
  {
    id: "a-hook-as-a-function",
    order: 1,
    group: "basic",
    title: "A hook as a function",
    caption: "We introduce the ability for hooks to be TypeScript functions, with full type definitions and LSP support.",
    videoUrl: assetUrl("6e354c92-d71e-4882-bcce-c5f76883d40a"),
    posterUrl: assetUrl("6b624978-2f97-4fbb-8f70-8507df9364f3"),
    eventNamed: null,
  },
  {
    id: "a-hook-that-says-no",
    order: 2,
    group: "basic",
    title: "A hook that says no",
    caption: "Function hooks may be used to restrict behavior, for safety and control, as you're used to.",
    videoUrl: assetUrl("7b8a3fda-c6b3-40f9-853b-22a86c7cba9d"),
    posterUrl: assetUrl("ec1ac1b6-4dee-4823-af38-f66988577162"),
    eventNamed: null,
  },
  {
    id: "plugins-can-draw-now",
    order: 3,
    group: "basic",
    title: "Plugins can draw now",
    caption: "You can hook onto components and modify their props or wrap their returned render nodes.",
    videoUrl: assetUrl("ea09f465-d147-4884-947e-fb32c39649fa"),
    posterUrl: assetUrl("14592d0b-9f16-4a59-8c0a-542e71134b8f"),
    eventNamed: null,
  },
  {
    id: "admin-control-as-a-hook",
    order: 4,
    group: "basic",
    title: "Admin control as a hook",
    caption: "Admins can remove affordances from $ so that all plugins below cannot invoke that side-effect.",
    videoUrl: assetUrl("26177745-89fa-466b-a2f6-4649369ec7e2"),
    posterUrl: assetUrl("62fcaf64-ddee-417f-9f97-dac5560be3a4"),
    eventNamed: null,
  },
  {
    id: "order-is-nesting",
    order: 5,
    group: "advanced",
    title: "Order is nesting",
    caption:
      "Plugins nest like middleware. The first one registered wraps the rest, so admins prepend for control and append for defaults.",
    videoUrl: assetUrl("3a45eadd-9d40-405b-b044-4683f3dd3a36"),
    posterUrl: assetUrl("63550ca2-acbc-40e8-b1e7-42a9fa44d447"),
    eventNamed: null,
  },
  {
    id: "press-a-plugins-button",
    order: 6,
    group: "advanced",
    title: "Press a plugin's button",
    caption: "Hooks catch interactions too. One hook on ui.press sees the same button pressed in the terminal and in the desktop app.",
    videoUrl: assetUrl("7f01bbee-1de2-46f9-b75d-5bc68cf4dbfc"),
    posterUrl: assetUrl("35ecb6a6-0726-4a16-8d6c-8fe7765b7821"),
    eventNamed: "ui.press",
  },
  {
    id: "every-event-at-once",
    order: 7,
    group: "advanced",
    title: "Every event at once",
    caption: "A single hook on * sees every event, including every plugin's own calls on $, so an audit log is one function.",
    videoUrl: assetUrl("c7e3243f-9af0-445d-aa75-12c4d20ac9bc"),
    posterUrl: assetUrl("aa9b84cf-f3f4-4a3f-82a7-6d39c0925c88"),
    eventNamed: "*",
  },
  {
    id: "one-sentence-one-plugin",
    order: 8,
    group: "case-study",
    title: "One sentence. One plugin",
    caption:
      "From one short ask, Claude writes, validates and loads a plugin that replaces secrets in tool output before the model reads them.",
    videoUrl: assetUrl("44601a4e-a4b4-4e0b-b1d2-4621293b8150"),
    posterUrl: assetUrl("7cefbf7a-05d5-49c7-845d-d4a27e505c1b"),
    eventNamed: null,
  },
  {
    id: "change-what-claude-code-shows",
    order: 9,
    group: "case-study",
    title: "Change what Claude Code shows",
    caption:
      "A plugin hides sensitive values in Claude Code Desktop until you hover over them, so you can share your screen without showing your data.",
    videoUrl: assetUrl("9a3abf85-0df2-4975-ac7c-0424a8dff5d2"),
    posterUrl: assetUrl("7c64337f-cc4d-401e-b51f-b9a55ddec0a3"),
    eventNamed: null,
  },
];

/** Videos in one group, in the order the issue lists them. */
export function videosInGroup(group: VideoGroup): readonly Video[] {
  return VIDEOS.filter((video) => video.group === group).sort((left, right) => left.order - right.order);
}

export const NOT_RE_HOSTED_NOTE =
  "These clips play from Anthropic's own GitHub attachment URLs, the same ones the announcement issue embeds. Nothing is copied to this site, so a clip stops working here exactly when it stops working on the issue, and only there.";

export const NO_CAPTIONS_NOTE =
  "No captions or transcripts are available for these clips: they were never watched frame by frame to write any, only described from the issue's own one-sentence caption for each.";
