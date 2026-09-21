import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export interface DocPageProps {
  /** Rendered as the page's only h1. */
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
}

/**
 * Shared frame for informational pages: container, single h1, then vertically spaced sections.
 * Sections own their measure (65ch) so wide elements such as timelines can still use the container.
 */
export function DocPage({ title, description, children }: DocPageProps): ReactNode {
  return (
    <Container className="py-12 md:py-16">
      <SectionHeading as="h1" title={title} body={description} />
      <div className="mt-12 flex flex-col gap-16 md:mt-14 md:gap-20">{children}</div>
    </Container>
  );
}
