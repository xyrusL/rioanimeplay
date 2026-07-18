export type MenuPlacement = "top" | "bottom";

export function chooseMenuPlacement(input: {
  spaceAbove: number;
  spaceBelow: number;
  menuHeight: number;
}): MenuPlacement;
