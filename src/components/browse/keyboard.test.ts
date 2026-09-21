import { afterEach, describe, expect, it } from "vitest";
import { isTextEntryTarget } from "./keyboard";

function mount<Element extends HTMLElement>(element: Element): Element {
  document.body.appendChild(element);
  return element;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("isTextEntryTarget", () => {
  it("is true for text-like inputs, textareas and selects", () => {
    for (const type of ["text", "search", "email", "url", "password", "number"]) {
      const input = mount(document.createElement("input"));
      input.type = type;
      expect(isTextEntryTarget(input)).toBe(true);
    }
    expect(isTextEntryTarget(mount(document.createElement("textarea")))).toBe(true);
    expect(isTextEntryTarget(mount(document.createElement("select")))).toBe(true);
  });

  it("is true inside a contenteditable element", () => {
    const editable = mount(document.createElement("div"));
    editable.setAttribute("contenteditable", "true");
    const child = document.createElement("span");
    editable.appendChild(child);
    expect(isTextEntryTarget(child)).toBe(true);
  });

  it("is false for radios, checkboxes, buttons and plain elements", () => {
    for (const type of ["radio", "checkbox", "button"]) {
      const input = mount(document.createElement("input"));
      input.type = type;
      expect(isTextEntryTarget(input)).toBe(false);
    }
    expect(isTextEntryTarget(mount(document.createElement("button")))).toBe(false);
    expect(isTextEntryTarget(document.body)).toBe(false);
  });

  it("is false for null and non-element targets", () => {
    expect(isTextEntryTarget(null)).toBe(false);
    expect(isTextEntryTarget(document)).toBe(false);
  });
});
