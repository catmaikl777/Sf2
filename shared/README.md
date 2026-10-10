# @sf/shared — deterministic combat core

Пакет содержит всё, что не зависит от Phaser: конфиг данных боя, Q16.16
fixed-point арифметику, детерминированный PRNG, AABB, схему профиля и саму
детерминированную боевую симуляцию. Дальше здесь появятся AI-бот (BT +
utility + FSM) и реплеи.

## Структура

```
src/
  constants.js          фиксированные константы симуляции (60 Hz, Q16.16, кнопки)
  fp.js                 fixed-point арифметика (целочисленная)
  rng.js                mulberry32 — сидированный детерминированный PRNG
  aabb.js               AABB-пересечения
  config/
    types.js            все JSDoc-типы конфига
    fighters.js         статы бойцов
    weapons.js          оружие + мувсеты
    armor.js            броня
    moves.js            65 приёмов: таймлайны, хитбоксы, окна отмены
    combos.js           таблица комбо (данные для матчеров)
    rounds.js           мета раунда
    ai.js               параметры EASY/NORMAL/HARD (только перцепция/решения)
    progression.js      экономика
    stages.js           геометрия сцен
    strings.js          i18n (ru/en)
    index.js            сборка + валидация конфига
  profile/
    profileSchema.js    форма профиля и миграции
  sim/
    types.js            FighterState, MoveState, StageBounds, MoveTiming
    timing.js           ms->тики (единственное место конвертации времени)
    movetiming.js       кэш таймлайнов по moveId
    input.js            семантические направления относительно facing, edge-детект
    matcher.js          распознавание комбо (направление:действие, окна/шаги)
    fighter.js          создание бойца, состояния, старт приёма, разделение тел
    collision.js        покадровые хитбокс/хартбокс AABB
    combat.js           damage pipeline, block/хит/knockdown, отталкивание
    round.js            state machine раунда (intro/fight/outro/match)
    sim.js              createSim: оркестрация тика, движение, бой, события
    index.js            баррель симуляции
  ai/
    types.js            JSDoc-типы AI (FighterView/WorldView/Action/BotContext)
    observe.js          observe(sim, side): публичное состояние -> WorldView
    perception.js       задержка реакции + шум прицела/чтения состояния
    utility.js          скоринг интентов (approach/retreat/block/attack/super)
    behaviortree.js     селектор/последовательность/guard/leaf
    fsm.js              фазы neutral/approach/engage/defend/punish/recover
    bot.js              createBot: decision cadence + input-latency delay line
    index.js            баррель AI
  replay/
    types.js            Replay/ReplayHeader/ReplayFrame + REPLAY_VERSION
    record.js           recorder + buildReplay(cfg, setup, controllers)
    playback.js         playReplay + replaySignature (fingerprint)
    codec.js            encode/decode/sanitize JSON (версия + валидация)
    index.js            баррель replay
test/                   unit-тесты (Vitest)
```

## Правила инвариантов

- Вся боевая математика — целые числа Q16.16 (`fp.js`). Ни одной IEEE float в
  переходе состояний симуляции.
- Вертикаль внутри симуляции положительна **вверх**: `y` — высота над землёй,
  `vy > 0` значит «вверх». В конфиге прыжка `jumpVelocity` задаётся как
  «вверх», гравитация тянет вниз.
- Движение применяется единым проходом в `sim.js` (после комбо-пула, до
  `separate()`); `fighter.js` не двигает `x` инлайн.
- `MoveState.consumed` — per-fighter массив: попадание по хитбоксу гасится в
  состоянии конкретного бойца, а не в общем кэше таймлайнов. Это сохраняет
  бит-в-бит детерминизм двух симуляций, делящих один конфиг.
- Урон/статы/веса собраны только в `config/`. Правки чисел там меняют бой
  без изменения кода.
- Сложность бота меняет только `reactionDelayMs`, `decisionsPerSecond`,
  агрессию/оборону и шумы восприятия. Никогда не статы урона.
- `createGameConfig()` возвращает **deep clone**; тесты и клиент не могут
  случайно испортить общий конфиг.

## Запуск и проверка

```bash
npm install                       # в корне монорепо
npm run test                      # vitest run (unit)
npm run test:watch                # watch
npm run test:coverage             # порог 80% в shared/src
npm run lint                      # eslint
npm run typecheck                 # tsc --checkJs (strict)
```

Локально в Termux бинарники вызываются напрямую через `node node_modules/...`
(см. `scripts` в корневом `package.json`), поэтому не зависят от `#!/usr/bin/env`.

## Публичный API симуляции

```js
import { createGameConfig, createSim, BTN } from '@sf/shared';

const sim = createSim(createGameConfig(), {
  p0: { fighterId: 'shadow', weaponId: 'w_unarmed', armorId: 'a_cloth' },
  p1: { fighterId: 'hermit', weaponId: 'w_unarmed', armorId: 'a_cloth' },
});
const events = sim.step({ buttons: BTN.HAND }, { buttons: BTN.NONE });
```

`sim.step(p0In, p1In)` фиксирован на 60 Hz и возвращает массив событий
(`state`/`move`/`hit`/`round`) с номером тика. Один и тот же поток входов и
сид дают бит-идентичный результат.

## AI-бот

Бот читает только задержанный, зашумлённый снимок видимого мира — ровно ту
информацию, что доступна человеку — и выдаёт входы с человекоподобной
задержкой; внутреннее состояние игрока он не видит и не читает
`Math.random`/`Date`.

```js
import { createGameConfig, createSim, createBot, observe } from '@sf/shared';

const cfg = createGameConfig();
const sim = createSim(cfg, setup);
const bot = createBot(cfg, { difficulty: 'HARD', side: 1, seed: 12345, weaponId: 'w_unarmed' });

const { buttons } = bot.step(observe(sim, 1)); // ровно то, что жмёт игрок
sim.step({ buttons: playerButtons }, { buttons });
```

Конвейер тика: `observe` -> `perception` (задержка `reactionDelayMs` + шум) ->
`fsm` (фаза) -> `behaviortree`/`utility` (интент) -> delay line
(`inputLatencyMs` ± `inputJitterMs`) -> маска кнопок. Решения принимаются с
частотой `decisionsPerSecond`. Сложность меняет **только** параметры
восприятия/решений из `config/ai.js` (`getAiConfig`), никогда статы.

## Реплеи

Бой полностью описывается header'ом (сетап + метаданные) и потоком входных
кадров; детерминизм симуляции гарантирует бит-идентичное воспроизведение.

```js
import { buildReplay, playReplay, encodeReplay, decodeReplay } from '@sf/shared';

const { replay } = buildReplay(cfg, setup, {
  p0: (view) => bot0.step(view).buttons,
  p1: (view) => bot1.step(view).buttons,
  maxTicks: 20000,
  p0Control: 'bot', p1Control: 'bot', p0Difficulty: 'HARD', p1Difficulty: 'EASY',
});
const saved = encodeReplay(replay);          // строка для storage
const { signature } = playReplay(decodeReplay(saved), cfg);
```

`decodeReplay` защищённый: проверяет версию, сетап и кадры, коэрсит маски
кнопок — повреждённый сейв не уронит игру. `replaySignature(sim)` — короткий
детерминированный отпечаток финального состояния для тестов интеграции.

## Ближайший спринт

Клиент на Phaser: сцены (menu/select/battle/result), ввод (клавиатура + тач),
HUD, сохранение профиля и реплеев, звук, i18n.
