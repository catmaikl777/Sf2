/**
 * Tiny behaviour-tree combinators. A node is a pure function of the decision
 * context that returns an Action or null; `selector` returns the first non-null
 * child action, which makes the tree a deterministic priority ladder.
 *
 * @module shared/ai/behaviortree
 */

/**
 * @typedef {(ctx: import('./types.js').BotContext) => import('./types.js').Action | null} BtNode
 */

/**
 * Run children in order, returning the first non-null action.
 * @param {BtNode[]} children
 * @returns {BtNode}
 */
export function selector(...children) {
  return (ctx) => {
    for (const child of children) {
      const result = child(ctx);
      if (result !== null) return result;
    }
    return null;
  };
}

/**
 * Run children in order; succeed only if all return an action, yielding the last.
 * @param {BtNode[]} children
 * @returns {BtNode}
 */
export function sequence(...children) {
  return (ctx) => {
    /** @type {import('./types.js').Action | null} */
    let last = null;
    for (const child of children) {
      last = child(ctx);
      if (last === null) return null;
    }
    return last;
  };
}

/**
 * Gate a child behind a predicate.
 * @param {(ctx: import('./types.js').BotContext) => boolean} predicate
 * @param {BtNode} child
 * @returns {BtNode}
 */
export function guard(predicate, child) {
  return (ctx) => (predicate(ctx) ? child(ctx) : null);
}

/**
 * A leaf that always produces the same action.
 * @param {import('./types.js').Action} action
 * @returns {BtNode}
 */
export function constant(action) {
  return () => action;
}

/**
 * A leaf computed from context.
 * @param {(ctx: import('./types.js').BotContext) => import('./types.js').Action} fn
 * @returns {BtNode}
 */
export function action(fn) {
  return (ctx) => fn(ctx);
}

/** @param {(ctx: import('./types.js').BotContext) => boolean} predicate */
export function not(predicate) {
  return (/** @type {import('./types.js').BotContext} */ ctx) => !predicate(ctx);
}
