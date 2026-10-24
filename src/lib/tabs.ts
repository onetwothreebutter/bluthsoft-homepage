/**
 * Tabs as the ARIA Authoring Practices describe them: the selected tab is the
 * only one in the tab order, the arrow keys (and Home and End) move between
 * tabs and select them, and each tab shows the panel named by its
 * `aria-controls`. The markup arrives with the first tab selected, so without
 * JavaScript the first panel still shows.
 */
export function bindTabs(tablist: HTMLElement): void {
  const tabs = [...tablist.querySelectorAll<HTMLElement>('[role="tab"]')];
  const document = tablist.ownerDocument;

  function select(tab: HTMLElement, focus: boolean) {
    for (const each of tabs) {
      const selected = each === tab;
      each.setAttribute("aria-selected", String(selected));
      each.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(
        each.getAttribute("aria-controls") ?? "",
      );
      if (panel) panel.hidden = !selected;
    }
    if (focus) tab.focus();
  }

  tablist.addEventListener("click", (event) => {
    const tab = (event.target as Element).closest<HTMLElement>('[role="tab"]');
    if (tab) select(tab, false);
  });

  tablist.addEventListener("keydown", (event) => {
    const index = tabs.indexOf(event.target as HTMLElement);
    if (index < 0) return;
    const next = (
      {
        ArrowRight: index + 1,
        ArrowLeft: index - 1,
        Home: 0,
        End: tabs.length - 1,
      } as Record<string, number>
    )[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(tabs[(next + tabs.length) % tabs.length], true);
  });
}
