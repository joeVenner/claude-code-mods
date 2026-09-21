import { vi } from "vitest";

/**
 * jsdom has no IntersectionObserver, which Motion's `whileInView` needs. Reveal-wrapped
 * content is not under test for its animation, so an inert observer is enough.
 */
class InertIntersectionObserver implements IntersectionObserver {
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

export function stubIntersectionObserver(): void {
  vi.stubGlobal("IntersectionObserver", InertIntersectionObserver);
}
