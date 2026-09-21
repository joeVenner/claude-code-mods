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
