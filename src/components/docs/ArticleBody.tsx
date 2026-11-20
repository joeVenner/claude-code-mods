import type { ReactNode } from "react";
import { Callout } from "@/components/docs/Callout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocSection, Prose } from "@/components/docs/DocSection";
import { InlineCode } from "@/components/docs/InlineCode";
import { SourceLine } from "@/components/docs/SourceLine";
import { TextLink } from "@/components/docs/TextLink";
import { parseInline, type ArticleBlock, type ArticleSection, type ArticleText } from "@/lib/articles";

export interface RichTextProps {
  readonly text: ArticleText;
}

/** Article text with its `code` and [label](href) parts rendered; everything else stays plain text. */
export function RichText({ text }: RichTextProps): ReactNode {
  return parseInline(text).map((part, index) => {
    // Parts never reorder, so the index is a stable key within one string.
    const key = `${part.kind}-${index}`;
    switch (part.kind) {
      case "text":
        return <span key={key}>{part.text}</span>;
      case "code":
        return <InlineCode key={key}>{part.code}</InlineCode>;
      case "link":
        return (
          <TextLink key={key} href={part.href}>
            {part.label}
          </TextLink>
        );
    }
  });
}

function Block({ block }: { readonly block: ArticleBlock }): ReactNode {
  switch (block.kind) {
    case "paragraph":
      return (
        <Prose>
          <p>
            <RichText text={block.text} />
          </p>
        </Prose>
      );
    case "list":
      return (
        <Prose>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            {block.items.map((item, index) => (
              // Items are static content that never reorders; the index keeps two equal items apart.
              <li key={`${index}-${item}`}>
                <RichText text={item} />
              </li>
            ))}
          </ul>
        </Prose>
      );
    case "code":
      return <CodeBlock code={block.code} filename={block.filename} label={block.label} />;
    case "callout":
      return (
        <Callout tone={block.tone}>
          <p>
            <RichText text={block.text} />
          </p>
        </Callout>
      );
  }
}

export interface ArticleBodyProps {
  readonly sections: readonly ArticleSection[];
}

/** An article's sections, each a titled section with its blocks and a "Source:" line at the end. */
export function ArticleBody({ sections }: ArticleBodyProps): ReactNode {
  return sections.map((section) => (
    <DocSection key={section.id} id={section.id} title={section.title}>
      {section.blocks.map((block, index) => (
        // Blocks are static content that never reorders, so the position is a stable key.
        <Block key={`${section.id}-${index}`} block={block} />
      ))}
      <SourceLine sources={section.sources} />
    </DocSection>
  ));
}
