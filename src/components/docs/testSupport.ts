import { vi } from "vitest";

class NoopIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: readonly number[] = [];
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

/**
 * jsdom has no IntersectionObserver, which Motion's `whileInView` (used by `Reveal`) needs.
 * A no-op stub is enough: these tests assert rendered content, not scroll animation.
 */
export function stubIntersectionObserver(): void {
  vi.stubGlobal("IntersectionObserver", NoopIntersectionObserver);
}

const EN_DASH = String.fromCharCode(0x2013);
const EM_DASH = String.fromCharCode(0x2014);

/** Matches the en and em dash characters that the copy rules forbid in visible text. */
export const DASH_PATTERN = new RegExp(`[${EN_DASH}${EM_DASH}]`);
