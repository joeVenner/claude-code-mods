const TEXT_ENTRY_INPUT_TYPES: ReadonlySet<string> = new Set([
  "text",
  "search",
  "email",
  "url",
  "tel",
  "password",
  "number",
]);

/**
 * True when a keystroke is going into something the person is typing in, so a global shortcut
 * must stay out of the way. Radios, checkboxes and buttons do not count: `/` is not text there.
 */
export function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) return TEXT_ENTRY_INPUT_TYPES.has(target.type);
  // jsdom does not implement isContentEditable, so read the attribute instead.
  return target.closest('[contenteditable=""], [contenteditable="true"]') !== null;
}
