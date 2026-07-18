export function chooseMenuPlacement({ spaceAbove, spaceBelow, menuHeight }) {
  return spaceBelow < menuHeight && spaceAbove > spaceBelow ? "top" : "bottom";
}

export function getMenuLayout({ spaceAbove, spaceBelow, menuHeight, gap = 8 }) {
  const placement = chooseMenuPlacement({ spaceAbove, spaceBelow, menuHeight });
  const availableSpace = placement === "top" ? spaceAbove : spaceBelow;
  return { placement, maxHeight: Math.max(44, Math.min(menuHeight, availableSpace - gap)) };
}
