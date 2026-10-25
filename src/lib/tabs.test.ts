// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { bindTabs, tabSelectEvent } from "./tabs";

function render() {
  document.body.innerHTML = `
    <div role="tablist">
      <button role="tab" aria-controls="p0" aria-selected="true" tabindex="0">Inventory</button>
      <button role="tab" aria-controls="p1" aria-selected="false" tabindex="-1">Sales</button>
      <button role="tab" aria-controls="p2" aria-selected="false" tabindex="-1">Bluth AI</button>
    </div>
    <div role="tabpanel" id="p0"></div>
    <div role="tabpanel" id="p1" hidden></div>
    <div role="tabpanel" id="p2" hidden></div>`;
  bindTabs(document.querySelector<HTMLElement>('[role="tablist"]')!);
  return [...document.querySelectorAll<HTMLElement>('[role="tab"]')];
}

const visiblePanel = () =>
  [...document.querySelectorAll<HTMLElement>('[role="tabpanel"]')].find(
    (panel) => !panel.hidden,
  )?.id;

const press = (key: string) =>
  document.activeElement!.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true }),
  );

afterEach(() => {
  document.body.innerHTML = "";
});

describe("bindTabs", () => {
  it("shows a tab's panel when it's clicked", () => {
    const [, sales] = render();
    sales.click();
    expect(sales.getAttribute("aria-selected")).toBe("true");
    expect(visiblePanel()).toBe("p1");
  });

  it("moves with the arrow keys, wrapping at the ends, and keeps one tab stop", () => {
    const [inventory, , ai] = render();
    inventory.focus();

    press("ArrowLeft");
    expect(document.activeElement).toBe(ai);
    expect(visiblePanel()).toBe("p2");

    press("ArrowRight");
    expect(document.activeElement).toBe(inventory);
    expect(
      [...document.querySelectorAll('[role="tab"]')].map(
        (tab) => (tab as HTMLElement).tabIndex,
      ),
    ).toEqual([0, -1, -1]);
  });

  it("jumps to the first and last tab with Home and End", () => {
    const [inventory, , ai] = render();
    inventory.focus();
    press("End");
    expect(document.activeElement).toBe(ai);
    press("Home");
    expect(document.activeElement).toBe(inventory);
  });

  it("announces a change of tab, by click or by key, but not a click on the selected one", () => {
    const [inventory, sales, ai] = render();
    const announced: EventTarget[] = [];
    const record = (event: Event) => announced.push(event.target!);
    document.addEventListener(tabSelectEvent, record);

    inventory.click();
    sales.click();
    sales.click();
    sales.focus();
    press("ArrowRight");

    document.removeEventListener(tabSelectEvent, record);
    expect(announced).toEqual([sales, ai]);
  });
});
