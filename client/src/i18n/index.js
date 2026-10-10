/**
 * Thin i18n wrapper around the shared string tables. The active language is
 * client state only; the tables themselves live in @sf/shared.
 *
 * @module client/i18n
 */

import { t, DEFAULT_LANGUAGE } from '@sf/shared';

/** @type {string} */
let current = DEFAULT_LANGUAGE;

/** @param {string} lang */
export function setLanguage(lang) {
  current = lang;
}

/** @returns {string} */
export function getLanguage() {
  return current;
}

/**
 * Translate a key for the active language.
 * @param {string} key
 * @param {Record<string, string|number>} [params]
 * @returns {string}
 */
export function tr(key, params) {
  return t(current, key, params);
}
