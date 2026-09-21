import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buildNotFoundMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildNotFoundMetadata();

export default function NotFound(): ReactNode {
  return (
    <Container className="py-16 md:py-24">
      <div className="flex flex-col items-start gap-8">
        <SectionHeading
          as="h1"
          title="Page not found"
          body="That address does not match a page or an extension in this directory. It may have been renamed, or the link may be mistyped."
        />
        <div className="flex flex-wrap gap-3">
          <Button href="/browse/" size="lg">
            Browse the directory
          </Button>
          <Button href="/" variant="secondary" size="lg">
            Back to home
          </Button>
        </div>
      </div>
    </Container>
  );
}
