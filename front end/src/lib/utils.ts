/** Join class names; add `clsx` + `tailwind-merge` later if you need conflict resolution. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
