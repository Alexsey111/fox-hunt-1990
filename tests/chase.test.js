/* Тесты варианта «Гон»: перебежки должны быть воспроизводимы, не терять лис
   и обесценивать старые пеленги ровно настолько, насколько это строго. */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { Game } = require('../assets/engine.js');
const Solver = require('../assets/solver.js');

function foxTotal(g) {
  return g.field.reduce((a, b) => a + b, 0) + g.foundTotal;
}

function hashField(g) {
  return g.field.join('');
}

test('без гона лисы стоят на месте', () => {
  const g = new Game({ seed: 11, size: 10, foxes: 8 });
  const empties = [];
  for (let r = 1; r <= 10 && empties.length < 6; r++) {
    for (let c = 1; c <= 10 && empties.length < 6; c++) {
      if (g.field[g.idx(r, c)] === 0) empties.push([r, c]);
    }
  }
  const before = hashField(g);
  empties.forEach(([r, c]) => g.probe(r, c));
  assert.strictEqual(hashField(g), before, 'без гона расстановка не меняется');
  assert.ok(!g.log.some(e => e.type === 'move'));
});

test('гон: первые N-1 ходов расстановка стоит, на N-м лиса уходит', () => {
  const g = new Game({ seed: 21, size: 10, foxes: 8, chase: { every: 5, count: 1 } });

  /* берём заведомо пустые клетки, чтобы поимка не меняла поле */
  const empties = [];
  for (let r = 1; r <= 10 && empties.length < 6; r++) {
    for (let c = 1; c <= 10 && empties.length < 6; c++) {
      if (g.field[g.idx(r, c)] === 0) empties.push([r, c]);
    }
  }
  const start = hashField(g);

  for (let i = 1; i <= 4; i++) {
    const res = g.probe(empties[i][0], empties[i][1]);
    assert.ok(!res.moved, `на ходе ${i} перебежки быть не должно`);
    assert.strictEqual(hashField(g), start, `ход ${i}: поле не должно меняться`);
  }

  const fifth = g.probe(empties[5][0], empties[5][1]);
  assert.ok(fifth.moved, 'на пятом ходу лиса должна перебежать');
  assert.strictEqual(fifth.moved.count, 1, 'по умолчанию перебегает одна лиса');
  assert.strictEqual(foxTotal(g), 8, 'число лис не меняется');
  assert.notStrictEqual(hashField(g), start, 'расстановка должна измениться');
});

test('гон: «все» перебегают всем составом', () => {
  const g = new Game({ seed: 33, size: 8, foxes: 6, chase: { every: 2, count: 'all' } });
  g.probe(1, 1);
  assert.ok(!g.log.some(e => e.type === 'move'), 'после первого хода ещё тихо');

  const res = g.probe(4, 4);
  assert.ok(res.moved && res.moved.all, 'после второго хода перебегают все');
  assert.ok(res.moved.count >= 1);
  assert.strictEqual(foxTotal(g), 6);
});

test('гон: перебегает ровно столько лис, сколько выбрано', () => {
  [1, 2, 3, 5, 8].forEach(count => {
    const g = new Game({ seed: 1200 + count, size: 10, foxes: 8, chase: { every: 1, count } });
    const res = g.probe(4, 4);
    assert.ok(res.moved, `count=${count}: перебежка должна случиться`);
    assert.strictEqual(res.moved.count, count, `count=${count}: сдвинулось не столько лис`);
    const src = res.moved.from.map(m => `${m.r}:${m.c}`);
    assert.strictEqual(new Set(src).size, src.length, `count=${count}: одна лиса посчитана дважды`);
    assert.strictEqual(foxTotal(g), 8);
  });
});

test('гон: стопка лис — считаем зверей, а не клетки', () => {
  const size = 4;
  const field = new Array(size * size).fill(0);
  const idx = (r, c) => (r - 1) * size + (c - 1);
  field[idx(2, 2)] = 2;   /* две лисы в одной клетке */
  field[idx(4, 4)] = 1;

  const all = new Game({ seed: 11, size, field, chase: { every: 1, count: 'all' } });
  assert.strictEqual(all.field[all.idx(2, 2)], 2, 'стопка должна сохраниться');
  const evAll = all.probe(1, 1).moved;
  assert.strictEqual(evAll.count, 3, '«все» — это три лисы, хотя клеток две');

  const one = new Game({ seed: 11, size, field, chase: { every: 1, count: 1 } });
  assert.strictEqual(one.probe(1, 1).moved.count, 1, 'одна лиса — один зверь');

  const two = new Game({ seed: 11, size, field, chase: { every: 1, count: 2 } });
  assert.strictEqual(two.probe(1, 1).moved.count, 2, 'две лисы — два зверя');
});

test('гон: «сколько лис» не выходит за состав и за поле', () => {
  const g = new Game({ seed: 5, size: 8, foxes: 4, chase: { every: 1, count: 9 } });
  assert.strictEqual(g.chase.count, 4, 'больше лис, чем есть, перебегать не может');
  const res = g.probe(2, 2);
  assert.strictEqual(res.moved.count, 4);
  assert.ok(res.moved.all, 'сдвинулись все — флаг all');

  const zero = new Game({ seed: 6, size: 8, foxes: 4, chase: { every: 1, count: 0 } });
  assert.strictEqual(zero.chase.count, 1, 'ноль лис — это одна');
});

test('перебежка — только в соседнюю клетку и в пределах поля', () => {
  const g = new Game({ seed: 44, size: 8, foxes: 5, chase: { every: 1, count: 'all' } });
  for (let i = 0; i < 12; i++) g.probe(1 + (i % 8), 1 + ((i * 3) % 8));

  const moves = g.log.filter(e => e.type === 'move');
  assert.ok(moves.length >= 8);
  moves.forEach(ev => {
    ev.moved.forEach(m => {
      assert.ok(Math.abs(m.tr - m.fr) <= 1 && Math.abs(m.tc - m.fc) <= 1, 'шаг больше одной клетки');
      assert.ok(m.tr >= 1 && m.tr <= 8 && m.tc >= 1 && m.tc <= 8, 'вышли за поле');
      assert.ok(m.tr !== m.fr || m.tc !== m.fc, 'лиса должна сдвинуться');
    });
  });
});

test('гон воспроизводится по сиду', () => {
  const mk = () => new Game({ seed: 555, size: 10, foxes: 8, chase: { every: 3, count: 1 } });
  const a = mk(), b = mk();
  const coords = [[1, 1], [2, 7], [4, 4], [6, 9], [8, 2], [3, 5], [9, 9]];
  coords.forEach(([r, c]) => { a.probe(r, c); b.probe(r, c); });

  assert.strictEqual(hashField(a), hashField(b), 'одна партия — одна расстановка');
  const evA = a.log.filter(e => e.type === 'move');
  const evB = b.log.filter(e => e.type === 'move');
  assert.strictEqual(evA.length, evB.length);
  assert.deepStrictEqual(evA.map(e => e.moved), evB.map(e => e.moved));
});

test('разные сиды — разные перебежки', () => {
  const run = seed => {
    const g = new Game({ seed: seed, size: 10, foxes: 8, chase: { every: 2, count: 1 } });
    for (let i = 0; i < 6; i++) g.probe(1 + i, 1 + i);
    return JSON.stringify(g.log.filter(e => e.type === 'move'));
  };
  assert.notStrictEqual(run(100), run(101));
});

test('пеленги до перебежки либо выброшены, либо совпадают с полем', () => {
  for (const count of [1, 'all']) {
    for (const every of [1, 2, 5]) {
      const g = new Game({ seed: 707, size: 10, foxes: 8, chase: { every, count } });
      [[1, 1], [2, 6], [4, 4], [5, 9], [7, 3], [8, 8], [3, 2], [9, 5], [6, 7]].forEach(([r, c]) => g.probe(r, c));

      const model = Solver.analyze(g);
      model.cons.forEach(cons => {
        if (cons.kind !== 'exact') return;
        let actual = 0;
        cons.cells.forEach(i => { actual += g.field[i]; });
        assert.strictEqual(actual, cons.target,
          `every=${every} count=${count}: устаревшее ограничение осталось в модели`);
      });
    }
  }
});

test('после перебежки всех старые пеленги не используются', () => {
  const g = new Game({ seed: 909, size: 10, foxes: 8, chase: { every: 2, count: 'all' } });
  g.probe(2, 2);
  g.probe(6, 6);
  const model = Solver.analyze(g);
  const first = model.cons.filter(c => c.cells.length > 1);
  /* единственный пеленг после перебежки — тот, что сделан на втором ходу,
     и он тоже сделан ДО неё: значит, точных ограничений на лучи быть не должно */
  assert.strictEqual(first.length, 0, 'оба пеленга устарели');
  assert.ok(model.countExcluded() >= 0);
});

test('гон: подсказка работает и не читает поле', () => {
  const g = new Game({ seed: 313, size: 10, foxes: 8, chase: { every: 3, count: 1 } });
  [[3, 3], [3, 4], [6, 6], [8, 1]].forEach(([r, c]) => g.probe(r, c));

  const honest = Solver.analyze(g).hint();
  const snapshot = g.field;
  g.field = new Array(100).fill(0);
  const blind = Solver.analyze(g).hint();
  g.field = snapshot;

  assert.ok(honest && honest.r >= 1 && honest.c <= 10);
  assert.strictEqual(blind.r, honest.r);
  assert.strictEqual(blind.c, honest.c);
});

test('лиса не перебегает на клетку свежего пеленга', () => {
  for (const count of [1, 'all']) {
    for (const seed of [17, 404, 1234]) {
      const g = new Game({ seed, size: 8, foxes: 5, chase: { every: 1, count } });
      for (let i = 0; i < 40 && !g.over; i++) {
        const r = 1 + (i * 3) % 8;
        const c = 1 + (i * 5) % 8;
        const logBefore = g.log.length;
        g.probe(r, c);
        const ev = g.log[g.log.length - 1];
        if (g.log.length === logBefore || !ev || ev.type !== 'move') continue;
        ev.moved.forEach(m => {
          assert.ok(m.tr !== r || m.tc !== c,
            `seed=${seed} count=${count}: лиса встала в клетку ${r}.${c}, куда только что смотрел игрок`);
        });
      }
    }
  }
});

test('лиса перебегает на соседнюю клетку, но не под последний пеленг', () => {
  /* Единственный доступный вариант — сама клетка пеленга: правило уступает,
     иначе лиса застревает. На обычном поле у клетки 3–8 соседей, запрещён один,
     значит перебежка обязана состояться. */
  const g = new Game({ seed: 5, size: 4, foxes: 3, chase: { every: 1, count: 1 } });
  const res = g.probe(2, 2);
  assert.ok(res.type === 'bearing' || res.type === 'fox');
  const ev = g.log[g.log.length - 1];
  assert.strictEqual(ev.type, 'move');
  assert.strictEqual(ev.moved.length, 1);
  const m = ev.moved[0];
  assert.notStrictEqual(`${m.tr}:${m.tc}`, '2:2', 'перебежка не под свежий пеленг');
  assert.ok(Math.abs(m.tr - m.fr) <= 1 && Math.abs(m.tc - m.fc) <= 1, 'шаг больше одной клетки');
  assert.strictEqual(foxTotal(g), 3);
});

test('гон не мешает поймать всех лис', () => {
  const g = new Game({ seed: 2026, size: 8, foxes: 4, chase: { every: 2, count: 1 } });
  let guard = 0;
  while (!g.over && guard++ < 400) {
    for (let r = 1; r <= 8 && !g.over; r++) {
      for (let c = 1; c <= 8 && !g.over; c++) g.probe(r, c);
    }
  }
  assert.ok(g.won, 'партия должна завершаться победой');
  assert.strictEqual(g.remaining(), 0);
  assert.strictEqual(foxTotal(g), 4);
});
