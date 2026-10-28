/* Опыт: стоит ли делать «шаг перебежки» настройкой гона.
   Играем эталонной политикой решателя (шанс поимки × 2 + информация / 6) на одной
   и той же конфигурации, меняя только максимальное расстояние, на которое лиса
   уходит за перебежку (1 — как сейчас в игре, 2, 3, 5). Смотрим, сколько ходов
   нужно, чтобы поймать всех лис, и сколько бит приносит средний заход.

   Здесь ничего не меняется в игре: перебежка на расстояние N подменяется в этом
   скрипте, а решатель берёт радиус из game.chase.step (по умолчанию 1).
   Запуск: node tools/step-probe.js [игр на клетку таблицы] [--steps 1,2,3]
   */
'use strict';

const E = require('../assets/engine.js');
const S = require('../assets/solver.js');

const GAMES = Number(process.argv[2]) || 200;
const stepsArg = process.argv.indexOf('--steps');
const STEPS = stepsArg > 0
  ? String(process.argv[stepsArg + 1] || '1,2,3').split(',').map(Number)
  : [1, 2, 3];

/* Перебежка на расстояние 1..step («до N»). Правила те же, что в engine.js:
   отбор по зверям (стопка даёт две записи), перемешивание Фишером—Йетсом на сиде,
   клетка последнего захода исключается, если есть куда ещё идти. */
E.Game.prototype.relocate = function () {
  const step = (this.chase && this.chase.step) || 1;
  const spots = [];
  for (let r = 1; r <= this.size; r++) {
    for (let c = 1; c <= this.size; c++) {
      const here = this.field[this.idx(r, c)];
      for (let k = 0; k < here; k++) spots.push([r, c]);
    }
  }
  if (!spots.length) return null;

  const want = this.chase && this.chase.count != null ? this.chase.count : 1;
  const n = want === 'all'
    ? spots.length
    : Math.max(1, Math.min(Math.round(want) || 1, spots.length));

  const pool = spots.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(this._rnd() * (i + 1));
    const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  const chosen = pool.slice(0, n);

  const forbid = this.lastProbeCell();
  const moved = [];
  for (const from of chosen) {
    const opts = [];
    for (let dr = -step; dr <= step; dr++) {
      for (let dc = -step; dc <= step; dc++) {
        if (!dr && !dc) continue;
        const rr = from[0] + dr, cc = from[1] + dc;
        if (rr < 1 || rr > this.size || cc < 1 || cc > this.size) continue;
        opts.push([rr, cc]);
      }
    }
    if (!opts.length) continue;
    let free = opts;
    if (forbid) {
      const f = opts.filter(o => o[0] !== forbid[0] || o[1] !== forbid[1]);
      if (f.length) free = f;
    }
    const to = free[Math.floor(this._rnd() * free.length)];
    this.field[this.idx(from[0], from[1])] -= 1;
    this.field[this.idx(to[0], to[1])] += 1;
    moved.push({ fr: from[0], fc: from[1], tr: to[0], tc: to[1] });
  }
  if (!moved.length) return null;

  const ev = { type: 'move', moves: this.moves, all: n === spots.length, count: n, moved };
  this.log.push(ev);
  return ev;
};

function pickCell(model, n) {
  let best = null;
  for (let r = 1; r <= n; r++) {
    for (let c = 1; c <= n; c++) {
      const s = model.score(r, c);
      if (!s.open) continue;
      const v = s.prob * 2 + s.bits / 6;
      if (!best || v > best.v) best = { r, c, v, bits: s.bits };
    }
  }
  return best;
}

function playOne(cfg, step, seed) {
  const opts = { seed, size: cfg.size, foxes: cfg.foxes };
  if (!cfg.noChase) opts.chase = { every: cfg.every, count: cfg.count };
  const g = new E.Game(opts);
  if (g.chase) g.chase.step = step;

  let guard = 0, bits = 0, bearings = 0, catches = 0;
  while (!g.over && guard++ < 900) {
    const cell = pickCell(S.analyze(g), g.size);
    if (!cell) break;
    bits += cell.bits;
    const res = g.probe(cell.r, cell.c);
    if (res.type === 'fox') catches++; else bearings++;
  }
  return {
    won: g.won, moves: bearings + catches, guard: guard >= 900,
    bitsPerBearing: bearings ? bits / bearings : 0,
    catches, bearings
  };
}

function pct(sorted, q) {
  if (!sorted.length) return null;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[i];
}

const CFGS = [
  { id: '10x10 · 8 лис · через 3 · по 1', size: 10, foxes: 8, every: 3, count: 1 },
  { id: '10x10 · 8 лис · через 5 · по 1', size: 10, foxes: 8, every: 5, count: 1 },
  { id: '12x12 · 10 лис · через 4 · по 1', size: 12, foxes: 10, every: 4, count: 1 },
  { id: '12x12 · 10 лис · через 3 · все', size: 12, foxes: 10, every: 3, count: 'all' }
];

const rows = [];

function measure(cfg, step, label) {
  const t0 = Date.now();
  const runs = [];
  let guards = 0, bits = 0, catches = 0, bearings = 0;
  for (let i = 0; i < GAMES; i++) {
    const r = playOne(cfg, step, 900_000 + i * 13);
    if (r.won) runs.push(r.moves);
    if (r.guard) guards++;
    bits += r.bitsPerBearing;
    catches += r.catches;
    bearings += r.bearings;
  }
  runs.sort((a, b) => a - b);
  const row = {
    cfg: cfg.id, label, step, n: runs.length,
    p10: pct(runs, 0.10), p50: pct(runs, 0.50), p90: pct(runs, 0.90),
    avg: runs.length ? +(runs.reduce((a, b) => a + b, 0) / runs.length).toFixed(1) : null,
    bits: +(bits / GAMES).toFixed(2),
    share: Math.round(catches / Math.max(1, catches + bearings) * 100),
    cells: cfg.size * cfg.size,
    guards, ms: Date.now() - t0
  };
  rows.push(row);
  console.log(`${cfg.id.padEnd(31)} ${label.padEnd(13)} p50 ${String(row.p50).padStart(4)}  ` +
    `avg ${String(row.avg).padStart(6)}  p10 ${String(row.p10).padStart(3)}  p90 ${String(row.p90).padStart(3)}  ` +
    `бит/пеленг ${String(row.bits).padStart(5)}  поимок ${String(row.share).padStart(2)}%  ` +
    `от перебора ${String(Math.round(100 * row.p50 / row.cells)).padStart(3)}%  ` +
    `не закончил ${guards}  ${(row.ms / 1000).toFixed(1)} с`);
  return row;
}

for (const cfg of CFGS) {
  /* два ориентира: классика без гона и самый редкий гон (движок не даёт реже, чем через 9) */
  measure({ id: cfg.id, size: cfg.size, foxes: cfg.foxes, noChase: true }, 1, 'без гона');
  measure(Object.assign({}, cfg, { every: 9 }), 1, 'через 9');
  for (const step of STEPS) measure(cfg, step, 'шаг ' + step);
}

/* Сводка: во сколько раз медиана выросла относительно шага 1. */
console.log('');
const base = {};
rows.filter(r => r.step === 1 && r.label.startsWith('шаг'))
  .forEach(r => { base[r.cfg] = r.p50; });
rows.filter(r => r.step !== 1 && r.label.startsWith('шаг')).forEach(r => {
  const b = base[r.cfg];
  if (!b || !r.p50) return;
  console.log(`${r.cfg.padEnd(31)} ${r.label}: медиана ×${(r.p50 / b).toFixed(2)} к шагу 1`);
});

/* Насколько сильна сама ручка «интервал» по сравнению с шагом. */
console.log('');
for (const cfg of CFGS) {
  const rare = rows.find(r => r.cfg === cfg.id && r.label === 'через 9');
  const step1 = rows.find(r => r.cfg === cfg.id && r.label === 'шаг 1');
  if (rare && step1 && rare.p50) {
    console.log(`${cfg.id.padEnd(31)} интервал 9 → ${cfg.every}: медиана ×${(step1.p50 / rare.p50).toFixed(2)}`);
  }
}
