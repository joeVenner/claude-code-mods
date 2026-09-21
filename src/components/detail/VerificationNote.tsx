import type { ReactNode } from "react";
import type { Verification } from "@/lib/types";
import { InlineLink } from "./InlineLink";

export interface VerificationNoteProps {
  readonly verification: Verification;
}

/** One-line status statement for the rail. Built from `verification`, never hardcoded dates. */
export function VerificationNote({ verification }: VerificationNoteProps): ReactNode {
  return (
    <p className="text-sm leading-relaxed text-fg-muted">
      Source verified on <time dateTime={verification.checkedAt}>{verification.checkedAt}</time>. Not a security
      review.
    </p>
  );
}

/** Plain-language explanation of what the status badge does and does not promise. */
export function VerificationExplainer({ verification }: VerificationNoteProps): ReactNode {
  return (
    <section aria-labelledby="badge-meaning-heading" className="flex max-w-[65ch] flex-col gap-3">
      <h2 id="badge-meaning-heading" className="text-xl font-semibold tracking-tight text-fg">
        What the badge means
      </h2>
      <p className="text-base leading-relaxed text-fg-muted">
        Source verified means the source URL for this entry responded with HTTP 200 on{" "}
        <time dateTime={verification.checkedAt}>{verification.checkedAt}</time>. That is the whole claim. Nobody has
        read, scanned or run this code on your behalf, and the badge does not mean Anthropic or anyone else endorses
        it.
      </p>
      <p className="text-base leading-relaxed text-fg-muted">
        Sources change after the check date. Read the code and the publisher page before you install.{" "}
        <InlineLink href="/security/#before-you-install">How to check an extension</InlineLink>
      </p>
    </section>
  );
}
