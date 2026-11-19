export const RATE_BW = 2;
export const RATE_COLOR = 5;
export const MAX_MB = 20;
export const MAX_PAGES = 100;
export const MAX_COPIES = 50;

export function calcAmount(pages, copies, color) {
  return pages * copies * (color ? RATE_COLOR : RATE_BW);
}
