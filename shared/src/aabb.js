/**
 * Axis-aligned bounding box helpers. All combat hitbox/hurtbox checks use
 * these functions; Phaser physics is never involved.
 *
 * @module shared/aabb
 */

/** @typedef {{x: number, y: number, w: number, h: number}} Rect */

/**
 * Create a rectangle.
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @returns {Rect}
 */
export function rect(x, y, w, h) {
  return { x, y, w, h };
}

/**
 * Strict AABB overlap test (touching edges do not count as a hit).
 * @param {Rect} a
 * @param {Rect} b
 * @returns {boolean}
 */
export function intersects(a, b) {
  if (a.w <= 0 || a.h <= 0 || b.w <= 0 || b.h <= 0) return false;
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * True when a is fully inside b.
 * @param {Rect} a
 * @param {Rect} b
 * @returns {boolean}
 */
export function contains(a, b) {
  return (
    a.x >= b.x &&
    a.y >= b.y &&
    a.x + a.w <= b.x + b.w &&
    a.y + a.h <= b.y + b.h
  );
}

/**
 * Overlap area in squared units (0 when disjoint). Used for hit priority.
 * @param {Rect} a
 * @param {Rect} b
 * @returns {number}
 */
export function overlapArea(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  if (w <= 0 || h <= 0) return 0;
  return w * h;
}

/**
 * Translate a rectangle by dx, dy.
 * @param {Rect} r
 * @param {number} dx
 * @param {number} dy
 * @returns {Rect}
 */
export function offset(r, dx, dy) {
  return { x: r.x + dx, y: r.y + dy, w: r.w, h: r.h };
}

/**
 * Mirror a rectangle horizontally around a pivot X (for facing left).
 * @param {Rect} r
 * @param {number} pivotX
 * @returns {Rect}
 */
export function mirrorX(r, pivotX) {
  return { x: 2 * pivotX - r.x - r.w, y: r.y, w: r.w, h: r.h };
}
