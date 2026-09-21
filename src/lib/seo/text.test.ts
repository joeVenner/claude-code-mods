import { describe, expect, it } from "vitest";
import { DASH_PATTERN } from "@/components/docs/testSupport";
import {
  clampText,
  indefiniteArticle,
  lowerCaseLabel,
  toInertLine,
  toPlainText,
  toSingleLine,
  toStrictInertLine,
  withFinalPeriod,
} from "./text";

const EM_DASH = String.fromCharCode(0x2014);
const EN_DASH = String.fromCharCode(0x2013);

describe("toPlainText", () => {
  it("replaces em and en dashes with a spaced hyphen", () => {
    const result = toPlainText(`fast${EM_DASH}and${EN_DASH}small`);
    expect(result).toBe("fast - and - small");
    expect(DASH_PATTERN.test(result)).toBe(false);
  });

  it("removes control characters but keeps newlines and tabs", () => {
    const withControls = `a${String.fromCharCode(0)}b${String.fromCharCode(0x1b)}\n\tc${String.fromCharCode(0x7f)}`;
    expect(toPlainText(withControls)).toBe("ab\n\tc");
  });

  it("returns an empty string unchanged", () => {
    expect(toPlainText("")).toBe("");
  });

  it("applies the dash replacement per line and never swallows a newline", () => {
    expect(toPlainText(`one ${EM_DASH}\n${EN_DASH} two`)).toBe("one - \n - two");
    expect(toPlainText(`a\n\n${EM_DASH}\nb`)).toBe("a\n\n - \nb");
  });
});

describe("toPlainText and XML validity", () => {
  it("removes noncharacters that XML forbids", () => {
    const noncharacters = [0xfffe, 0xffff, 0xfdd0, 0xfdef, 0x1fffe, 0x10ffff].map((code) => String.fromCodePoint(code));
    expect(toPlainText(`a${noncharacters.join("b")}c`)).toBe("abbbbbc");
    expect(toPlainText(`x${String.fromCodePoint(0xfdd0)}${String.fromCodePoint(0xfdef)}y`)).toBe("xy");
  });

  it("does not leave a lone surrogate behind", () => {
    const result = toPlainText(`a${String.fromCharCode(0xd800)}b${String.fromCharCode(0xdc00)}c`);
    expect(result.isWellFormed()).toBe(true);
    expect(result).toBe(`a${String.fromCharCode(0xfffd)}b${String.fromCharCode(0xfffd)}c`);
  });

  it("keeps a valid surrogate pair (an emoji) intact", () => {
    expect(toPlainText(`rocket ${String.fromCodePoint(0x1f680)}`)).toBe(`rocket ${String.fromCodePoint(0x1f680)}`);
  });
});

describe("toSingleLine", () => {
  it("collapses whitespace and newlines", () => {
    expect(toSingleLine("  one\n\n two\t three  ")).toBe("one two three");
  });
});

describe("clampText", () => {
  it("returns text that already fits", () => {
    expect(clampText("short text", 50)).toBe("short text");
  });

  it("cuts on a word boundary, stays within the limit and ends with an ellipsis", () => {
    const result = clampText("one two three four five six seven eight", 20);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result.endsWith(String.fromCharCode(0x2026))).toBe(true);
    expect(result).toBe(`one two three four${String.fromCharCode(0x2026)}`);
  });

  it("cuts inside one very long word when there is no boundary", () => {
    const result = clampText("x".repeat(100), 10);
    expect(result).toHaveLength(10);
  });

  it("handles a limit smaller than the ellipsis", () => {
    expect(clampText("abcdef", 1).length).toBeGreaterThan(0);
  });

  it("never splits a surrogate pair, whatever the cut position", () => {
    const rocket = String.fromCodePoint(0x1f680);
    for (let limit = 1; limit <= 12; limit++) {
      const clamped = clampText(rocket.repeat(20), limit);
      expect(clamped.isWellFormed(), `limit ${limit}`).toBe(true);
      expect(Array.from(clamped).length).toBeLessThanOrEqual(limit);
    }
    expect(clampText(`${rocket}${rocket}${rocket}`, 3)).toBe(`${rocket}${rocket}${rocket}`);
  });

  it("counts code points, not UTF-16 units", () => {
    const rocket = String.fromCodePoint(0x1f680);
    expect(clampText(rocket.repeat(5), 5)).toBe(rocket.repeat(5));
  });

  it("does not leave a trailing comma before the ellipsis", () => {
    expect(clampText("alpha, beta, gamma, delta", 13)).toBe(`alpha, beta${String.fromCharCode(0x2026)}`);
  });
});

describe("labels", () => {
  it("lower-cases ordinary labels and keeps acronyms", () => {
    expect(lowerCaseLabel("Plugin")).toBe("plugin");
    expect(lowerCaseLabel("MCP server")).toBe("MCP server");
    expect(lowerCaseLabel("")).toBe("");
  });

  it("chooses a and an as the label is spoken", () => {
    expect(indefiniteArticle("mod")).toBe("a");
    expect(indefiniteArticle("agent")).toBe("an");
    expect(indefiniteArticle("MCP server")).toBe("an");
    expect(indefiniteArticle("hook")).toBe("a");
  });

  it("adds a period only when missing", () => {
    expect(withFinalPeriod("Done")).toBe("Done.");
    expect(withFinalPeriod("Done.")).toBe("Done.");
    expect(withFinalPeriod("Done?")).toBe("Done?");
  });
});

describe("toInertLine", () => {
  it("collapses newlines so a paragraph cannot forge a heading", () => {
    expect(toInertLine("text\n## Forged\n- item")).toBe("text ## Forged - item");
  });

  it.each([
    ["# heading", "\\# heading"],
    ["## heading", "\\## heading"],
    ["> quote", "\\> quote"],
    ["- item", "\\- item"],
    ["+ item", "\\+ item"],
    ["* item", "\\* item"],
    ["[link](x)", "\\[link](x)"],
    ["| a | b |", "\\| a | b |"],
    ["1. first", "1\\. first"],
    ["12) second", "12\\) second"],
    ["```code", "\\```code"],
    ["~~~code", "\\~~~code"],
    ["  # indented", "\\# indented"],
  ])("escapes the leading marker in %j", (input, expected) => {
    expect(toInertLine(input)).toBe(expected);
  });

  it("leaves ordinary text and inner markers alone", () => {
    expect(toInertLine("Plain text with # and - and 1. inside")).toBe("Plain text with # and - and 1. inside");
    expect(toInertLine("2026 was a year")).toBe("2026 was a year");
  });
});

describe("toStrictInertLine", () => {
  it("escapes brackets, angle brackets, backticks and backslashes", () => {
    expect(toStrictInertLine("[x](javascript:alert(1)) <b>hi</b> `code` a\\b")).toBe(
      "\\[x\\](javascript:alert(1)) \\<b\\>hi\\</b\\> \\`code\\` a\\\\b",
    );
  });

  it("also neutralises a leading marker and newlines", () => {
    expect(toStrictInertLine("# a\n## b")).toBe("\\# a ## b");
  });
});
