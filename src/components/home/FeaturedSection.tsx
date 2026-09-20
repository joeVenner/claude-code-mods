import type { ReactNode } from "react";
import { ExtensionCard } from "@/components/catalog/ExtensionCard";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Extension } from "@/lib/types";
import { FeaturedLead } from "./FeaturedLead";

export interface FeaturedSectionProps {
  /** Already ordered and capped by `pickFeatured`; the first entry becomes the large tile. */
  readonly extensions: readonly Extension[];
}

const SUPPORTING_REVEAL_STEP_SECONDS = 0.08;

/** One large tile and a stack of smaller cards, 7/5 on lg and a single column below md. */
export function FeaturedSection({ extensions }: FeaturedSectionProps): ReactNode {
  const [lead, ...supporting] = extensions;
  if (lead === undefined) return null;

  return (
    <section aria-label="Featured entries" className="border-t border-border">
      <Container className="flex flex-col gap-10 py-16 md:py-20">
        <SectionHeading
          title="Featured entries"
          body="Hand-picked from the catalog. Featured is an editorial choice, not a security review."
        />
        <div className="grid gap-4 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <FeaturedLead extension={lead} />
          </Reveal>
          {supporting.length > 0 ? (
            <ul className="grid grid-cols-1 content-stretch gap-4 lg:col-span-5">
              {supporting.map((extension, index) => (
                <li key={extension.slug} className="flex">
                  <Reveal delay={(index + 1) * SUPPORTING_REVEAL_STEP_SECONDS} className="h-full w-full">
                    <ExtensionCard extension={extension} />
                  </Reveal>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
