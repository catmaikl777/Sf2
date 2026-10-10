/**
 * Localized strings. Key -> text per language. Settings store the language id.
 *
 * @module shared/config/strings
 */

/** @type {Record<string, Record<string, string>>} */
export const STRINGS = {
  ru: {
    'game.title': 'Теневой Боец',
    'menu.play': 'Играть',
    'menu.settings': 'Настройки',
    'menu.replays': 'Реплеи',
    'menu.quit': 'Выход',
    'select.fighter': 'Выбор бойца',
    'select.weapon': 'Выбор оружия',
    'select.armor': 'Выбор брони',
    'select.start': 'Начать бой',
    'select.back': 'Назад',
    'select.locked': 'Заблокировано',
    'select.buy': 'Купить за {price}',
    'settings.difficulty': 'Сложность',
    'settings.language': 'Язык',
    'settings.masterVolume': 'Общая громкость',
    'settings.musicVolume': 'Громкость музыки',
    'settings.sfxVolume': 'Громкость эффектов',
    'settings.stickSensitivity': 'Чувствительность стика',
    'settings.debugMode': 'Режим отладки',
    'settings.reset': 'Сбросить настройки',
    'settings.back': 'Назад',
    'difficulty.EASY': 'Лёгкий',
    'difficulty.NORMAL': 'Обычный',
    'difficulty.HARD': 'Сложный',
    'round.fight': 'БОЙ!',
    'round.win': 'ПОБЕДА',
    'round.lose': 'ПОРАЖЕНИЕ',
    'round.draw': 'НИЧЬЯ',
    'round.time': 'ВРЕМЯ',
    'round.best': 'Лучший боец',
    'replay.empty': 'Реплеев пока нет',
    'replay.watch': 'Смотреть',
    'replay.delete': 'Удалить',
    'replay.saved': 'Реплей сохранён',
    'result.reward': 'Награда: {amount}',
    'result.rematch': 'Реванш',
    'result.menu': 'В меню',
    'hud.energy': 'Энергия',
    'debug.state': 'Состояние',
    'debug.frame': 'Кадр',
    'debug.hits': 'Попадания',
    'fighter.shadow': 'Тень',
    'fighter.hermit': 'Отшельник',
    'fighter.butcher': 'Мясник',
    'fighter.lynx': 'Рысь',
    'weapon.unarmed': 'Руки',
    'weapon.dagger': 'Кинжал',
    'weapon.sword': 'Меч',
    'weapon.axe': 'Топор',
    'weapon.spear': 'Копьё',
    'weapon.nunchaku': 'Нунчаку',
    'armor.cloth': 'Ткань',
    'armor.leather': 'Кожа',
    'armor.plate': 'Латы',
    'stage.dojang': 'Додзё',
    'stage.bamboo': 'Бамбуковая роща',
    'stage.shrine': 'Святилище',
    'profile.coins': 'Монеты',
    'profile.wins': 'Победы',
    'profile.losses': 'Поражения',
    'profile.winrate': 'Винрейт',
  },
  en: {
    'game.title': 'Shadow Fighter',
    'menu.play': 'Play',
    'menu.settings': 'Settings',
    'menu.replays': 'Replays',
    'menu.quit': 'Quit',
    'select.fighter': 'Choose fighter',
    'select.weapon': 'Choose weapon',
    'select.armor': 'Choose armor',
    'select.start': 'Start fight',
    'select.back': 'Back',
    'select.locked': 'Locked',
    'select.buy': 'Buy for {price}',
    'settings.difficulty': 'Difficulty',
    'settings.language': 'Language',
    'settings.masterVolume': 'Master volume',
    'settings.musicVolume': 'Music volume',
    'settings.sfxVolume': 'SFX volume',
    'settings.stickSensitivity': 'Stick sensitivity',
    'settings.debugMode': 'Debug mode',
    'settings.reset': 'Reset settings',
    'settings.back': 'Back',
    'difficulty.EASY': 'Easy',
    'difficulty.NORMAL': 'Normal',
    'difficulty.HARD': 'Hard',
    'round.fight': 'FIGHT!',
    'round.win': 'VICTORY',
    'round.lose': 'DEFEAT',
    'round.draw': 'DRAW',
    'round.time': 'TIME',
    'round.best': 'Best fighter',
    'replay.empty': 'No replays yet',
    'replay.watch': 'Watch',
    'replay.delete': 'Delete',
    'replay.saved': 'Replay saved',
    'result.reward': 'Reward: {amount}',
    'result.rematch': 'Rematch',
    'result.menu': 'Menu',
    'hud.energy': 'Energy',
    'debug.state': 'State',
    'debug.frame': 'Frame',
    'debug.hits': 'Hits',
    'fighter.shadow': 'Shadow',
    'fighter.hermit': 'Hermit',
    'fighter.butcher': 'Butcher',
    'fighter.lynx': 'Lynx',
    'weapon.unarmed': 'Fists',
    'weapon.dagger': 'Dagger',
    'weapon.sword': 'Sword',
    'weapon.axe': 'Axe',
    'weapon.spear': 'Spear',
    'weapon.nunchaku': 'Nunchaku',
    'armor.cloth': 'Cloth',
    'armor.leather': 'Leather',
    'armor.plate': 'Plate',
    'stage.dojang': 'Dojang',
    'stage.bamboo': 'Bamboo Grove',
    'stage.shrine': 'Shrine',
    'profile.coins': 'Coins',
    'profile.wins': 'Wins',
    'profile.losses': 'Losses',
    'profile.winrate': 'Winrate',
  },
};

export const DEFAULT_LANGUAGE = 'ru';

/**
 * Translate a key with {arg} substitution.
 * Looks up the requested language, then English, then the raw key so the UI
 * never renders blank.
 * @param {string} lang
 * @param {string} key
 * @param {Record<string, string|number>} [params]
 * @returns {string}
 */
export function t(lang, key, params = {}) {
  const table = (STRINGS[lang] ?? STRINGS.en) ?? {};
  let s = table[key] ?? (STRINGS.en ? STRINGS.en[key] : undefined) ?? key;
  for (const [k, v] of Object.entries(params)) {
    s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}
