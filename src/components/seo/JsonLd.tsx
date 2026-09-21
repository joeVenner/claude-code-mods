import type { ReactNode } from "react";
import { serializeJsonLd, type JsonLdGraph } from "@/lib/seo/jsonLd";

export interface JsonLdProps {
  readonly data: JsonLdGraph;
}

/**
 * Renders structured data as `<script type="application/ld+json">`. This is the only place
 * `dangerouslySetInnerHTML` receives data, and the data always goes through `serializeJsonLd`,
 * which escapes `<`, `>`, `&`, U+2028 and U+2029 so catalog text cannot close the element.
 */
export function JsonLd({ data }: JsonLdProps): ReactNode {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
