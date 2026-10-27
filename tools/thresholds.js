/* Пороги звёзд по выборке партий, а не по информационной ёмкости пеленга.
   Играем эталонной политикой (решатель: шанс поимки × 2 + информация / 6)
   и смотрим, за сколько ходов получается поймать всех лис.

   Запуск:  node tools/thresholds.js [игр на уровень]
   Печатает таблицу процентилей и предлагаемые пороги [3★, 2★]. */
'use strict';

const E = require('../assets/engine.js');
const S = require('../assets/solver.js');

const N = Number(process.argv[2]) || 400;
const LEVELS = ['novice', 'scout', 'hunter', 'veteran', 'blind', 'extreme'];

function pickCell(model, n) {
  let best = null;
  for (let r = 1; r <= n; r++) {
    for (let c = 1; c <= n; c++) {
      const s = model.score(r, c);
      if (!s.open) continue;
      const v = s.prob * 2 + s.bits / 6;
      if (!best || v > best.v) best = { r, c, v };
    }
  }
  return best;
}

function playOne(lv, seed) {
  const g = new E.Game({ seed, size: lv.size, foxes: lv.foxes, mode: lv.mode });
  let guard = 0;
  while (!g.over && guard++ < 600) {
    const cell = pickCell(S.analyze(g), g.size);
    if (!cell) break;
    g.probe(cell.r, cell.c);
  }
  return g.won ? g.moves : null;
}

function pct(sorted, q) {
  if (!sorted.length) return null;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[i];
}

const rows = [];
for (const id of LEVELS) {
  const lv = E.levelById(id);
  const runs = [];
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const m = playOne(lv, 1_000_000 + i * 7);
    if (m) runs.push(m);
  }
  runs.sort((a, b) => a - b);
  const avg = Math.round(runs.reduce((a, b) => a + b, 0) / runs.length);
  rows.push({
    id: id,
    n: runs.length,
    min: runs[0],
    p05: pct(runs, 0.05),
    p10: pct(runs, 0.10),
    p15: pct(runs, 0.15),
    p25: pct(runs, 0.25),
    p50: pct(runs, 0.50),
    p75: pct(runs, 0.75),
    max: runs[runs.length - 1],
    avg: avg,
    now: lv.stars.slice(),
    foxes: lv.foxes,
    ms: Date.now() - t0
  });
}

const head = ['уровень', 'игр', 'min', 'p05', 'p10', 'p15', 'p25', 'p50', 'p75', 'max', 'сред', 'сейчас'];
const widths = [8, 5, 4, 4, 4, 4, 4, 4, 4, 4, 5, 8];
console.log(head.map((h, i) => h.padEnd(widths[i])).join(''));
rows.forEach(r => {
  const cells = [r.id, r.n, r.min, r.p05, r.p10, r.p15, r.p25, r.p50, r.p75, r.max, r.avg, r.now.join('/')];
  console.log(cells.map((v, i) => String(v).padEnd(widths[i])).join(''));
});

console.log('');
console.log('Пороги, которые стоят в engine.js: 3★ = p10, 2★ = p75 + 3 (поправка на счёт в голове),');
console.log('у «Ветерана», «Слепого» и «Экстрима» к 3★ ещё +2: нет заметок, поля или счёта. «Новичок» — 2★ как было.');
/* +2 к 3★ там, где человеку тяжелее: у «Ветерана» нет заметок, у «Слепого» нет поля,
   у «Экстрима» ответ только «есть/нет». */
const HANDICAP3 = { veteran: 2, blind: 2, extreme: 2 };
const KEEP = { novice: [8, 13] };
rows.forEach(r => {
  const three = (r.p10 || 0) + (HANDICAP3[r.id] || 0);
  const two = (r.p75 || 0) + 3;
  const shown = KEEP[r.id] || [three, two];
  const now = E.levelById(r.id).stars;
  const changed = (shown[0] !== now[0] || shown[1] !== now[1]) ? '  РАСХОЖДЕНИЕ с engine.js' : '';
  console.log('  ' + r.id.padEnd(8) + ' [' + shown[0] + ', ' + shown[1] + ']   в игре: [' +
    now[0] + ', ' + now[1] + ']' + changed);
});
