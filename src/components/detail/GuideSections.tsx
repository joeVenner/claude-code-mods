import type { ReactNode } from "react";
import { CopyCommand } from "@/components/ui/CopyCommand";
import type { GuideSection } from "@/lib/types";
import type { GuideAnchor } from "./guide";

export interface GuideSectionsProps {
  readonly guide: readonly GuideSection[];
  /** Same length and order as `guide`, from `buildGuideAnchors`, so the table of contents matches. */
  readonly anchors: readonly GuideAnchor[];
}

function commandLabel(title: string, index: number, total: number): string {
  return total === 1 ? title : `${title}, step ${index + 1} of ${total}`;
}

/**
 * The long-form guide, in the order the source data gives it. Commands are consecutive rows
 * under the paragraphs because a setup is often several commands that run one after another.
 */
export function GuideSections({ guide, anchors }: GuideSectionsProps): ReactNode {
  return (
    <div className="flex flex-col gap-12">
      {guide.map((section, sectionIndex) => {
        const { id } = anchors[sectionIndex];
        return (
          <section key={id} className="flex flex-col gap-4">
            <h2
              id={id}
              className="scroll-mt-24 text-2xl font-semibold leading-[1.15] tracking-tight text-fg text-balance md:text-3xl"
            >
              {section.title}
            </h2>
            <div className="flex max-w-[65ch] flex-col gap-4 text-base leading-relaxed text-fg-muted [overflow-wrap:anywhere]">
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={`${paragraphIndex}-${paragraph}`}>{paragraph}</p>
              ))}
            </div>
            {section.commands.length > 0 ? (
              <div className="flex max-w-[44rem] flex-col gap-1">
                {section.commands.map((command, commandIndex) => (
                  <CopyCommand
                    key={`${commandIndex}-${command}`}
                    command={command}
                    copyLabel={commandLabel(section.title, commandIndex, section.commands.length)}
                  />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
