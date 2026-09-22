import { ANNOUNCEMENT, MODS_README, MODS_TYPES, SEC_DEFAULT_README, type ConceptItem, type LearnSource } from "./learnContent";
import type { TimelineItem } from "./Timeline";

/** Shown at the top of the tier section and asserted in tests; keep the wording plain and literal. */
export const NO_SCANNER_NOTICE =
  "This is a design specification. No security scanner is running today, so no listing on this site has a tier.";

export type SecurityTierId = "TIER_A" | "TIER_B" | "TIER_C" | "REVOKED";

export interface SecurityTier {
  readonly id: SecurityTierId;
  readonly name: string;
  /** What the spec says qualifies a package for this tier. */
  readonly criteria: string;
  /** What the spec proposes the CLI would do. Always a proposal, never current behavior. */
  readonly proposedBehavior: string;
}

/** Source: marketplace architecture report (04), "Security Tier Definition Matrix". */
export const SECURITY_TIERS: readonly SecurityTier[] = [
  {
    id: "TIER_A",
    name: "Verified",
    criteria: "Passed static and dynamic audits, uses no elevated privileges, and comes from a trusted author.",
    proposedBehavior: "Loads and runs without asking.",
  },
  {
    id: "TIER_B",
    name: "Restricted",
    criteria: "Uses the workspace filesystem or a small set of allowed network endpoints.",
    proposedBehavior:
      "Asks the user before granting each declared permission, for example network access to a named host.",
  },
  {
    id: "TIER_C",
    name: "Experimental",
    criteria: "A community package that passes a syntax check but comes from an untrusted origin.",
    proposedBehavior:
      "Needs an explicit trust step from the user. The report names a /mod trust command for this, which is not a confirmed Claude Code command.",
  },
  {
    id: "REVOKED",
    name: "Revoked",
    criteria: "Failed the security criteria, or was reported for a vulnerability.",
    proposedBehavior: "Removed from the listing and blocked by the CLI everywhere at once.",
  },
];

/** Source: marketplace architecture report (04), "Multi-Phase Security Scanning Pipeline". */
export const SCAN_PIPELINE: readonly TimelineItem[] = [
  {
    title: "Check package integrity",
    description: "Confirm the package is the one the author published and that its manifests are well formed.",
    details: [
      "Verify the author's Ed25519 signature against their public key.",
      "Compare the tarball's SHA-256 checksum.",
      "Validate the plugin.json and hooks.json schemas.",
    ],
  },
  {
    title: "Analyze the code statically",
    description: "Read the code without running it, looking for patterns the spec treats as dangerous.",
    details: [
      "Walk the TypeScript or Babel syntax tree.",
      "Flag forbidden imports such as child_process, plus eval(), Function(), obfuscated strings and WebAssembly.",
      "Compare the permissions the package declares with the API calls it actually makes.",
    ],
  },
  {
    title: "Run it in a sandbox",
    description: "Execute the package in an isolated environment and watch what it does.",
    details: [
      "Fire synthetic lifecycle events at it.",
      "Monitor filesystem access and network calls that go outside its declared limits.",
      "Check memory use and CPU time; the report proposes a budget of under 50ms per hook.",
    ],
  },
  {
    title: "Assign a tier",
    description: "Combine the results into one of the tiers above, or reject the package.",
    details: [
      "Clean results and a verified author lead to TIER_A.",
      "Declared permissions that need user confirmation lead to TIER_B.",
      "An unverified author or unconstrained network access leads to TIER_C.",
      "A malicious pattern or a sandbox violation leads to rejection.",
    ],
  },
];

export interface InstallGuidance {
  readonly title: string;
  readonly body: string;
}

export const BEFORE_YOU_INSTALL: readonly InstallGuidance[] = [
  {
    title: "Read the source",
    body: "Open the repository from the entry page and read what the package ships: commands, scripts, hook definitions and any bundled binaries. A short skill or command file takes minutes to read.",
  },
  {
    title: "Check the publisher",
    body: "Confirm the publisher is who you expect and that the repository sits under their account or organization. Look-alike names and forks are a common way to pass off other code.",
  },
  {
    title: "Review permissions and hooks",
    body: "Hooks run commands on their own when lifecycle events fire, and MCP servers run as local processes or talk to remote services. Find out which events a package hooks into and what it can reach before you enable it.",
  },
  {
    title: "Prefer pinned versions",
    body: "Install a specific tag or commit instead of a moving branch or a latest tag, so a later push cannot change what runs on your machine. Try new extensions in a throwaway project first.",
  },
];

/**
 * How Claude Code itself keeps a function hooks plugin in check, as its declarations, the Mods README and
 * the announcement describe it. This is not the site's proposed tier model above, which is a design for
 * a registry that does not exist: this is what the engine says it does. The site did not test it.
 */

export const RUNTIME_SECTION_NOTE =
  "Function hooks are early access. This section restates what Anthropic's type declarations, the Mods README and the announcement say the engine does. This site did not test it, and the API may change between releases without notice.";

/** Claude Code names these tiers. This page says seats, so they are not mistaken for the proposed tiers A, B, C and revoked. */
export const RUNTIME_SEAT_NOTE =
  "Claude Code calls these tiers in its declarations. This page calls them seats so they are not confused with the proposed tiers A, B and C in the next section, which have nothing to do with them.";

export interface RuntimeSeat {
  readonly id: string;
  /** The seat's name as the declarations spell it. */
  readonly name: string;
  readonly who: string;
}

/** Outermost first: earlier is outer, and outer has more authority. */
export const RUNTIME_SEATS: readonly RuntimeSeat[] = [
  { id: "prepend", name: "prepend", who: "The managed plugins an administrator lists first. The outermost seat." },
  { id: "user", name: "user", who: "Everything a person installs, as the declarations put it: a mod you load yourself sits here." },
  { id: "append", name: "append", who: "The managed plugins an administrator lists after the user seat." },
  { id: "builtin", name: "builtin", who: "The plugins bundled in the Claude Code binary." },
  { id: "core", name: "core", who: "The engine's own innermost link. No plugin loads here." },
];

export const RUNTIME_POINTS: readonly ConceptItem[] = [
  {
    id: "order-is-authority",
    term: "Order is authority",
    description:
      "Hooks on the same event nest in seat order and no other way. Earlier is outer, and outer has more authority. On the events whose result a hook can change, a hook above another can pass the event on, rewrite it, refuse it or answer it; on an event such as session.end a hook only observes, and its own value changes nothing.",
    sources: [MODS_TYPES],
  },
  {
    id: "side-effects-go-through-dollar",
    term: "Side effects go through $",
    description:
      "A mod reaches files, the network and processes through calls on $. Each call is an event the engine makes, so the hooks above the caller see it. An administrator can remove affordances from $, so that every plugin beneath cannot use that side effect.",
    sources: [ANNOUNCEMENT, MODS_README, MODS_TYPES],
  },
  {
    id: "a-failing-hook-is-skipped",
    term: "A failing hook is skipped",
    description:
      "At every engine event, a hook that throws, overruns its time budget or answers a wrong shape is skipped: the hooks beneath and core run in its place, or its last next result stands, and the failure is reported by name. That means a guard that fails is absent for that dispatch, not that the call is refused. Each hook's time budget is its own code alone, and the clock stops while it waits on next(e) or on a call on $.",
    sources: [MODS_TYPES],
  },
  {
    id: "what-it-does-not-tell-you",
    term: "What this does not tell you",
    description:
      "The seats govern what one plugin can do to another and to an organization's settings, and the README describes seating the security mod outermost on a machine with managed settings or for a Team or Enterprise organization. It does not say those are the only cases a plugin can be seated above yours: another user-seat plugin can be too. A mod you run from a folder is code you chose to run: read it first.",
    sources: [MODS_README],
  },
];

export interface SecurityModFacts {
  /** What its README says it is: one sentence, as the catalog's own guide states it. */
  readonly whatItIs: string;
  readonly moves: string;
  /** Where whatItIs and moves come from: the security mod's own README, not the general Mods README. */
  readonly source: LearnSource;
}

/** The three moves the security mod's README says it has, and nothing else. Shown only beside the catalog's security mod. */
export const SECURITY_MOD_FACTS: SecurityModFacts = {
  whatItIs:
    "Its README says that, seated outermost, it keeps an organization's classic hooks, managed CLAUDE.md and rules, settings and MCP allowlist out of the reach of the plugins a person installs, and adds no policy of its own.",
  moves:
    "It has three moves and nothing else: continue past the user seat, refuse a user seat caller by name, or pass. Its README seats it first in the prepend seat on a machine with managed settings or for a Team or Enterprise organization, unless managed prependPlugins says otherwise, and says that loading it with --plugin-dir seats a plugin that can only pass.",
  source: SEC_DEFAULT_README,
};
