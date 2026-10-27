/* Тесты решателя: выводы должны следовать из журнала пеленгов,
   а не из знания расстановки. Каждый тест ловит конкретный способ смошенничать. */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { Game, LEVELS, levelById } = require('../assets/engine.js');
const Solver = require('../assets/solver.js');

function gameWith(field, opts) {
  opts = opts || {};
  return new Game({
    field: field, size: opts.size || 10, foxes: opts.foxes || 8, mode: opts.mode || 'sum'
  });
}

/* Поле 10×10: восемь лис, пара стопок — как в примере из журнала. */
function sampleField() {
  const f = new Array(100).fill(0);
  for (let i = 0; i < 8; i++) f[i] = 0;
  /* 2.1 и 4.6 по две лисы, остальные по одной */
  const spots = [[2, 1], [2, 1], [4, 6], [4, 6], [1, 9], [7, 3], [9, 10], [10, 5]];
  spots.forEach(([r, c]) => { f[(r - 1) * 10 + (c - 1)] += 1; });
  return f;
}

test('пеленг 0 исключает ровно свой набор клеток', () => {
  const g = gameWith(sampleField());
  /* ищем пустую клетку с нулевым пеленгом */
  let spot = null;
  for (let r = 1; r <= 10 && !spot; r++) {
    for (let c = 1; c <= 10 && !spot; c++) {
      if (g.field[g.idx(r, c)] === 0 && g.bearing(r, c) === 0) spot = { r, c };
    }
  }
  assert.ok(spot, 'на этом поле должна найтись клетка с нулевым пеленгом');

  const before = Solver.analyze(g, 0).countExcluded();
  g.probe(spot.r, spot.c);
  const model = Solver.analyze(g);

  const lines = g.lineCells(spot.r, spot.c);
  assert.strictEqual(model.countExcluded(), before + lines.length);
  lines.forEach(([r, c]) => assert.ok(model.excluded(r, c), `клетка ${r}.${c} должна быть исключена`));
});

test('старый пеленг уменьшается на лис, пойманных позже', () => {
  const g = gameWith(sampleField());
  g.probe(4, 3);          /* пеленг 5: строка 2, столбец 1, диагональ 2 */
  g.probe(4, 6);          /* поимка */
  g.probe(4, 6);          /* поимка */
  g.probe(4, 6);          /* пеленг 2 */

  const model = Solver.analyze(g);
  /* два пеленга + две отметки «в этой клетке лисы нет» */
  assert.strictEqual(model.cons.length, 4, 'каждый пеленг даёт ограничение на набор и на свою клетку');
  const lineTargets = model.cons.filter(c => c.cells.length > 1).map(c => c.target);
  assert.deepStrictEqual(lineTargets, [3, 2],
    'пеленг 5 из 4.3 уменьшается на двух пойманных в 4.6, второй пеленг уже равен 2');

  let checked = 0;
  model.cons.forEach(cons => {
    if (cons.kind !== 'exact') return;
    let actual = 0;
    cons.cells.forEach(i => { actual += g.field[i]; });
    assert.strictEqual(actual, cons.target, 'ограничение должно совпадать с нынешним полем');
    checked++;
  });
  assert.strictEqual(checked, 4);
});

test('границы не противоречат настоящей расстановке', () => {
  for (const seed of [1, 7, 42, 1234, 99999]) {
    for (const lv of LEVELS) {
      const g = new Game({ seed: seed, size: lv.size, foxes: lv.foxes, mode: lv.mode });
      const coords = [[1, 1], [3, 4], [6, 6], [8, 2], [5, 9], [2, 7], [9, 1]];
      coords.forEach(([r, c]) => {
        if (r <= lv.size && c <= lv.size) g.probe(r, c);
      });

      const model = Solver.analyze(g);
      for (let r = 1; r <= lv.size; r++) {
        for (let c = 1; c <= lv.size; c++) {
          const cell = model.at(r, c);
          const real = g.field[g.idx(r, c)];
          assert.ok(cell.lb <= real, `${lv.id}: нижняя граница ${r}.${c} больше настоящего числа лис`);
          assert.ok(real <= cell.ub, `${lv.id}: верхняя граница ${r}.${c} меньше настоящего числа лис`);
        }
      }
    }
  }
});

test('решатель не читает расстановку', () => {
  const g = gameWith(sampleField());
  [[4, 3], [2, 1], [7, 3], [1, 9]].forEach(([r, c]) => g.probe(r, c));

  const honest = Solver.analyze(g);
  const honestHint = honest.hint();
  const honestExcluded = honest.countExcluded();

  /* подменяем поле; журнал остаётся тем же */
  g.field = new Array(100).fill(0);
  const blind = Solver.analyze(g);

  assert.strictEqual(blind.countExcluded(), honestExcluded, 'исключения не должны зависеть от поля');
  assert.deepStrictEqual(
    { r: blind.hint().r, c: blind.hint().c },
    { r: honestHint.r, c: honestHint.c },
    'подсказка не должна зависеть от поля'
  );
});

test('автопометки только растут с новыми наблюдениями', () => {
  const g = new Game({ seed: 2024, size: 10, foxes: 8, mode: 'sum' });
  let prev = 0, sawZero = false;

  for (let r = 1; r <= 10; r++) {
    for (let c = 1; c <= 10; c++) {
      const res = g.probe(r, c);
      if (res.type !== 'bearing') break;
      if (res.bearing === 0) sawZero = true;
      const now = Solver.analyze(g).countExcluded();
      assert.ok(now >= prev, 'исключённых клеток не может стать меньше');
      prev = now;
      if (now > 0 && r > 3) { r = 11; break; }
    }
  }
  assert.ok(sawZero, 'на пути должна встретиться пустая клетка с нулевым пеленгом');
  assert.ok(prev > 0, 'после нулевого пеленга что-то должно исключиться');
});

test('подсказка не указывает в исключённую клетку и лежит в поле', () => {
  for (const lv of LEVELS) {
    const g = new Game({ seed: 55, size: lv.size, foxes: lv.foxes, mode: lv.mode });
    [[2, 2], [4, 5], [6, 3], [8, 8]].forEach(([r, c]) => {
      if (r <= lv.size && c <= lv.size) g.probe(r, c);
    });
    const model = Solver.analyze(g);
    const hint = model.hint();
    assert.ok(hint, `${lv.id}: подсказка должна быть`);
    assert.ok(hint.r >= 1 && hint.r <= lv.size && hint.c >= 1 && hint.c <= lv.size);
    assert.ok(!model.excluded(hint.r, hint.c), `${lv.id}: подсказка в исключённой клетке`);
    assert.ok(hint.bits >= 0);
  }
});

test('подсказка на пустой истории осмысленна', () => {
  const g = new Game({ seed: 8, size: 10, foxes: 8, mode: 'sum' });
  const hint = Solver.analyze(g).hint();
  assert.ok(hint && hint.r >= 1 && hint.c <= 10);
  assert.ok(hint.bits > 0, 'без наблюдений пеленг должен что-то давать');
});

test('повторный пеленг по той же клетке новых бит не даёт', () => {
  const g = new Game({ seed: 31415, size: 10, foxes: 8, mode: 'sum' });
  g.probe(5, 5);
  const model = Solver.analyze(g);
  const again = model.score(5, 5);
  const fresh = model.score(5, 6);
  assert.ok(again.bits < fresh.bits, 'повтор должен быть не выгоднее новой клетки');
});

test('разбор партии: по строке на каждый ход, сумма исключений согласована', () => {
  const g = new Game({ seed: 777, size: 10, foxes: 8, mode: 'sum' });
  [[3, 3], [3, 4], [5, 5], [5, 6], [7, 7]].forEach(([r, c]) => g.probe(r, c));

  const rows = Solver.review(g);
  assert.strictEqual(rows.length, g.log.length);
  rows.forEach((row, i) => {
    assert.strictEqual(row.moves, i + 1);
    assert.ok(row.eliminated >= 0);
    assert.ok(typeof row.note === 'string' && row.note.length > 0);
  });
  /* исключения накопительны: итог разбора равен итоговой модели */
  const total = rows.reduce((a, b) => a + b.eliminated, 0);
  assert.strictEqual(total, Solver.analyze(g).countExcluded());
});

test('режим rays: каждое число пеленга — отдельное ограничение', () => {
  const g = gameWith(sampleField(), { mode: 'rays' });
  g.probe(4, 3);
  const model = Solver.analyze(g);
  const exact = model.cons.filter(c => c.kind === 'exact');
  assert.strictEqual(exact.length, 5, 'четыре луча плюс отметка о пустой клетке');

  /* строка 4 на этом поле: лиса только в 4.6 (две) */
  const row = exact.find(c => c.cells.length === 10 && c.cells.every(i => Math.floor(i / 10) === 3));
  assert.ok(row);
  assert.strictEqual(row.target, 2);
});

test('режим binary: ноль исключает лучи, единица ничего не исключает', () => {
  const g = gameWith(sampleField(), { mode: 'binary' });
  let zero = null;
  for (let r = 1; r <= 10 && !zero; r++) {
    for (let c = 1; c <= 10 && !zero; c++) {
      if (g.field[g.idx(r, c)] === 0 && g.bearing(r, c) === 0) zero = { r, c };
    }
  }
  assert.ok(zero, 'нужен пустой участок поля');

  g.probe(zero.r, zero.c);

  const model = Solver.analyze(g);
  assert.strictEqual(model.countExcluded(), g.lineCells(zero.r, zero.c).length);
  assert.ok(model.cons.some(c => c.kind === 'exact' && c.target === 0));

  const g2 = gameWith(sampleField(), { mode: 'binary' });
  g2.probe(4, 3); /* на лучах есть лиса */
  const m2 = Solver.analyze(g2);
  assert.ok(m2.cons.some(c => c.kind === 'nonempty'));
});

test('на решённом поле подсказка указывает на лису', () => {
  /* маленькое поле: две лисы, обе известны после одного пеленга */
  const f = new Array(16).fill(0);
  f[(1 - 1) * 4 + (1 - 1)] = 1; /* 1.1 */
  f[(4 - 1) * 4 + (4 - 1)] = 1; /* 4.4 */
  const g = gameWith(f, { size: 4, foxes: 2, mode: 'rays' });

  /* исключаем всё, кроме двух клеток */
  for (let r = 1; r <= 4; r++) for (let c = 1; c <= 4; c++) {
    if ((r === 1 && c === 1) || (r === 4 && c === 4)) continue;
    if (g.bearing(r, c) === 0 && g.field[g.idx(r, c)] === 0) g.probe(r, c);
  }
  const model = Solver.analyze(g);
  const hint = model.hint();
  assert.ok(hint.kind === 'catch' || model.countExcluded() > 0);
  if (model.countCertain() > 0) assert.strictEqual(hint.kind, 'catch');
});

test('биты: свежий пеленг информативнее повтора', () => {
  const g = new Game({ seed: 4242, size: 10, foxes: 8, mode: 'sum' });

  const empty = Solver.analyze(g);
  g.probe(5, 5);
  const first = g.log[g.log.length - 1];

  const before = empty.bitsOf(first);
  assert.ok(before > 0.5, 'первый пеленг должен нести информацию');

  /* повтор по той же клетке: ответ уже известен */
  const after = Solver.analyze(g);
  g.probe(5, 5);
  const second = g.log[g.log.length - 1];
  const repeatBits = after.bitsOf(second);
  assert.ok(repeatBits < before, 'повтор не может быть информативнее первого захода');
  assert.ok(repeatBits < 1.2, 'у повтора почти нет информации');
});

test('автопометки по оценке появляются и не занимают всё поле', () => {
  const g = new Game({ seed: 914004, size: 10, foxes: 8, mode: 'sum' });
  [[1, 1], [2, 4], [6, 2], [9, 4], [5, 1], [10, 10], [4, 8], [8, 6]].forEach(([r, c]) => g.probe(r, c));

  const m = Solver.analyze(g);
  let marked = 0;
  for (let r = 1; r <= 10; r++) for (let c = 1; c <= 10; c++) if (m.unlikely(r, c)) marked++;

  assert.ok(marked > 0, 'после восьми пеленгов что-то должно попасть под «×»');
  assert.ok(marked < 90, 'нельзя помечать почти всё поле');
});

test('разбор: у строки есть индекс, дифф моделей до/после совпадает с «вычеркнуто»', () => {
  const g = new Game({ seed: 909, size: 10, foxes: 8, mode: 'sum' });
  [[4, 4], [4, 5], [7, 7], [2, 8], [6, 3]].forEach(([r, c]) => g.probe(r, c));

  const rows = Solver.review(g);
  assert.strictEqual(rows.length, 5);

  rows.forEach(row => {
    assert.strictEqual(typeof row.index, 'number', 'строке нужен индекс в журнале');
    const before = Solver.analyze(g, row.index);
    const after = Solver.analyze(g, row.index + 1);

    let cut = 0;
    for (let r = 1; r <= 10; r++) {
      for (let c = 1; c <= 10; c++) {
        if (before.at(r, c).ub > 0 && after.at(r, c).ub === 0) cut++;
      }
    }
    assert.strictEqual(cut, row.eliminated, 'разбор должен считать те же вычеркнутые клетки');
    assert.ok(after.countExcluded() >= before.countExcluded(), 'знание не может отменяться');

    if (row.type !== 'fox') {
      assert.strictEqual(after.at(row.r, row.c).ub, 0,
        'клетка пеленга без лисы должна быть вычеркнута');
    }
  });
});

test('разбор: вычеркнутые клетки не противоречат настоящей расстановке', () => {
  for (const seed of [11, 2024, 777]) {
    const g = new Game({ seed, size: 10, foxes: 8, mode: 'sum' });
    const empties = [];
    for (let r = 1; r <= 10 && empties.length < 6; r++) {
      for (let c = 1; c <= 10 && empties.length < 6; c++) {
        if (g.field[g.idx(r, c)] === 0) empties.push([r, c]);
      }
    }
    empties.forEach(([r, c]) => g.probe(r, c));

    Solver.review(g).forEach(row => {
      const after = Solver.analyze(g, row.index + 1);
      for (let r = 1; r <= 10; r++) {
        for (let c = 1; c <= 10; c++) {
          if (after.at(r, c).ub === 0) {
            assert.strictEqual(g.field[g.idx(r, c)], 0,
              `seed=${seed}: вычеркнута клетка с лисой — ${r}.${c}`);
          }
        }
      }
    });
  }
});

test('разбор партии возвращает биты для каждого хода', () => {
  const g = new Game({ seed: 555, size: 10, foxes: 8, mode: 'sum' });
  [[2, 2], [2, 3], [7, 7], [7, 8]].forEach(([r, c]) => g.probe(r, c));

  const rows = Solver.review(g);
  assert.strictEqual(rows.length, 4);
  rows.forEach(row => {
    assert.ok(typeof row.bits === 'number' && row.bits >= 0 && row.bits < 8);
    assert.ok(typeof row.note === 'string' && row.note.length > 0);
  });
  assert.ok(rows.some(r => r.bits > 0.5), 'хотя бы один ход должен быть информативным');
});

test('пороги звёзд и уровни не задеты решателем', () => {
  const lv = levelById('hunter');
  assert.deepStrictEqual(lv.stars, [19, 25]);
  assert.strictEqual(LEVELS.length, 6);
  LEVELS.forEach(l => {
    assert.ok(l.stars[0] > l.foxes, l.id + ': три звезды не могут быть меньше числа поимок');
    assert.ok(l.stars[1] > l.stars[0], l.id + ': пороги должны возрастать');
  });
});
