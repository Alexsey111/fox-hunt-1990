'use strict';
/* Тесты ядра: игра 1990 года должна вести себя ровно как в журнале. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { Game, parseCoord, SIZE, FOXES, LEVELS, MODES, levelById } = require('../assets/engine.js');

function emptyField() { return new Array(SIZE * SIZE).fill(0); }
function place(field, spots) {
  for (const [r, c, n] of spots) field[(r - 1) * SIZE + (c - 1)] += (n || 1);
  return field;
}
function withField(spots) {
  return new Game({ seed: 1, field: place(emptyField(), spots) });
}

test('поле 10×10 и восемь лис по умолчанию', () => {
  const g = new Game({ seed: 42 });
  assert.equal(g.size, 10);
  assert.equal(g.field.length, 100);
  assert.equal(g.field.reduce((a, b) => a + b, 0), 8);
  assert.equal(g.totalFoxes, FOXES);
});

test('партия воспроизводится по номеру', () => {
  const a = new Game({ seed: 123456 });
  const b = new Game({ seed: 123456 });
  assert.deepEqual(a.field, b.field);
  const c = new Game({ seed: 123457 });
  assert.notDeepEqual(a.field, c.field);
});

test('лисы могут стоять по нескольку в одной клетке', () => {
  let stacked = 0;
  for (let seed = 0; seed < 200; seed++) {
    const g = new Game({ seed });
    if (g.field.some(n => n > 1)) { stacked++; }
  }
  assert.ok(stacked > 0, 'за 200 партий ни одной стопки — распределение неверное');
});

test('пеленг считает строку, столбец и обе диагонали', () => {
  const g = withField([[5, 5, 1], [5, 9, 1], [9, 5, 1], [8, 8, 1], [2, 2, 1], [1, 2, 1]]);
  // из 5.5: строка 5, столбец 5, диагональ r-c=0, антидиагональ r+c=10
  assert.equal(g.bearing(5, 5), 5); // 5.9, 9.5, 8.8, 2.2 и своя клетка
  assert.equal(g.bearing(1, 2), 2); // своя клетка и 2.2 по столбцу
  assert.equal(g.bearing(5, 1), 3); // 5.5 и 5.9 по строке, 9.5 по диагонали
});

test('пример из статьи: 4.3 → 4, 4.6 → ЛИС-7, ЛИС-6, затем 2', () => {
  // Расстановка из примера в журнале: по две лисы в 2.1 и 4.6, всего восемь.
  const g = withField([[2, 1, 2], [4, 6, 2], [8, 6, 1], [10, 6, 1], [8, 8, 1], [9, 2, 1]]);

  assert.equal(g.bearing(4, 3), 4, 'из 4.3 пеленгуются четыре лисы');

  let r1 = g.probe(4, 6);
  assert.equal(r1.type, 'fox');
  assert.equal(r1.remaining, 7, 'первый сигнал ЛИС-7');

  let r2 = g.probe(4, 6);
  assert.equal(r2.type, 'fox');
  assert.equal(r2.remaining, 6, 'второй сигнал ЛИС-6');

  let r3 = g.probe(4, 6);
  assert.equal(r3.type, 'bearing');
  assert.equal(r3.bearing, 2, 'после поимки обеих лис из 4.6 пеленгуются две');

  assert.equal(g.moves, 3);
});

test('пойманные лисы исчезают из пеленга', () => {
  const g = withField([[3, 3, 1], [7, 7, 1]]);
  assert.equal(g.bearing(1, 1), 2); // 3.3 и 7.7 на главной диагонали
  g.probe(3, 3);
  assert.equal(g.bearing(1, 1), 1, 'пойманная лиса больше не пеленгуется');
});

test('в клетке со стопкой ловится по одной лисе за заход', () => {
  const g = withField([[4, 4, 3], [10, 1, 1]]);
  assert.equal(g.probe(4, 4).remaining, 3);
  assert.equal(g.probe(4, 4).remaining, 2);
  assert.equal(g.probe(4, 4).type, 'fox');
  const after = g.probe(4, 4);
  assert.equal(after.type, 'bearing');
  assert.equal(after.bearing, 0);
  assert.equal(g.found[g.idx(4, 4)], 3);
});

test('ходы считаются на каждый заход, включая поимку', () => {
  const g = withField([[1, 1, 1], [10, 10, 1]]);
  g.probe(5, 5);
  g.probe(5, 5);
  g.probe(1, 1);
  assert.equal(g.moves, 3);
  assert.equal(g.log.length, 3);
});

test('победа после восьми поимок, дальше поле не принимает ходы', () => {
  const spots = [[1, 1], [1, 3], [1, 5], [1, 7], [1, 9], [3, 1], [3, 3], [3, 5]];
  const g = withField(spots);
  let last;
  for (const [r, c] of spots) last = g.probe(r, c);
  assert.equal(last.win, true);
  assert.equal(g.remaining(), 0);
  assert.equal(g.over, true);
  assert.equal(g.won, true);
  const after = g.probe(5, 5);
  assert.equal(after.type, 'over');
  assert.equal(g.moves, 8);
});

test('сдача раскрывает оставшихся лис и не даёт победы', () => {
  const g = withField([[2, 2, 2], [7, 1, 1]]);
  g.probe(5, 5);
  const left = g.forfeit();
  assert.equal(left.length, 2);
  assert.equal(left[0].foxes + left[1].foxes, 3);
  assert.equal(g.over, true);
  assert.equal(g.won, false);
});

test('разбор координат «4.3», «4,3», «04 03»', () => {
  assert.deepEqual(parseCoord('4.3'), { r: 4, c: 3 });
  assert.deepEqual(parseCoord('4,3'), { r: 4, c: 3 });
  assert.deepEqual(parseCoord('04 03'), { r: 4, c: 3 });
  assert.deepEqual(parseCoord('10.10'), { r: 10, c: 10 });
  assert.equal(parseCoord('0.3'), null);
  assert.equal(parseCoord('11.3'), null);
  assert.equal(parseCoord('4'), null);
  assert.equal(parseCoord('4.3.2'), null);
  assert.equal(parseCoord(''), null);
  assert.equal(parseCoord(null), null);
});

test('лучи пеленга не выходят за поле и не дублируются', () => {
  const g = new Game({ seed: 7 });
  const cells = g.lineCells(1, 1);
  assert.equal(cells.length, 28); // 10 + 10 + 10 - 2 пересечения в (1,1)
  const uniq = new Set(cells.map(([r, c]) => r + ':' + c));
  assert.equal(uniq.size, cells.length);
  for (const [r, c] of cells) {
    assert.ok(r >= 1 && r <= 10 && c >= 1 && c <= 10);
  }
});

/* ---------- уровни сложности и режимы пеленга ---------- */

test('уровни: шесть штук, ключи уникальны, пороги звёзд по возрастанию', () => {
  assert.equal(LEVELS.length, 6);
  const ids = new Set(LEVELS.map(l => l.id));
  assert.equal(ids.size, LEVELS.length);
  for (const lv of LEVELS) {
    assert.ok(lv.size >= 6 && lv.size <= 16, lv.id + ': странное поле');
    assert.ok(lv.foxes >= 3 && lv.foxes < lv.size * lv.size, lv.id + ': странное число лис');
    assert.ok(MODES.includes(lv.mode), lv.id + ': неизвестный режим пеленга');
    assert.ok(lv.stars[0] > lv.foxes, lv.id + ': пару нельзя взять меньше, чем поимок');
    assert.ok(lv.stars[1] > lv.stars[0], lv.id + ': пороги звёзд должны возрастать');
    assert.ok(['hover', 'after', 'none'].includes(lv.hints), lv.id + ': режим подсказок');
    assert.equal(levelById(lv.id), lv);
    assert.equal(levelById('нет-такого'), null);
  }
  assert.equal(levelById('hunter').size, 10, 'классика остаётся 10×10');
  assert.equal(levelById('hunter').foxes, FOXES, 'классика остаётся на восемь лис');
  assert.equal(levelById('hunter').mode, 'sum', 'классика остаётся на одном числе');
});

test('партия по уровню: поле и число лис берутся из конфигурации', () => {
  const lv = levelById('veteran');
  const g = new Game({ seed: 5, size: lv.size, foxes: lv.foxes, mode: lv.mode });
  assert.equal(g.size, 12);
  assert.equal(g.field.length, 144);
  assert.equal(g.field.reduce((a, b) => a + b, 0), 10);
  assert.equal(g.totalFoxes, 10);
  assert.equal(g.mode, 'sum');
});

test('режим rays: четыре числа по лучам, в сумме — тот же пеленг', () => {
  // лиса на каждом из четырёх лучей из 4.3: строка, столбец, две диагонали
  const f = emptyField();
  f[(4 - 1) * SIZE + (7 - 1)] = 1; // 4.7 — строка
  f[(8 - 1) * SIZE + (3 - 1)] = 1; // 8.3 — столбец
  f[(2 - 1) * SIZE + (1 - 1)] = 1; // 2.1 — диагональ r-c = 1
  f[(1 - 1) * SIZE + (6 - 1)] = 1; // 1.6 — антидиагональ r+c = 7
  const g = new Game({ field: f, mode: 'rays' });
  assert.deepEqual(g.bearingParts(4, 3), { row: 1, col: 1, d1: 1, d2: 1 });
  assert.equal(g.bearing(4, 3), 4);
  const res = g.probe(4, 3);
  assert.equal(res.type, 'bearing');
  assert.equal(res.mode, 'rays');
  assert.equal(res.bearing, 4);
  assert.equal(res.parts.row + res.parts.col + res.parts.d1 + res.parts.d2, 4);
});

test('режим rowcol: два числа, диагонали не входят ни в ответ, ни в разбивку', () => {
  const f = emptyField();
  f[(4 - 1) * SIZE + (7 - 1)] = 1; // 4.7 — только строка
  f[(2 - 1) * SIZE + (1 - 1)] = 1; // 2.1 — только диагональ
  const g = new Game({ field: f, mode: 'rowcol' });
  const res = g.probe(4, 3);
  assert.equal(res.type, 'bearing');
  assert.deepEqual(res.parts, { row: 1, col: 0, d1: 1, d2: 0 });
  /* Число на индикаторе — это строка + столбец, а не сумма четырёх лучей:
     иначе клетка с диагональной лисой печатала бы «2», хотя подпись и подсветка
     говорят «строка 0 · столбец 0». */
  assert.equal(res.bearing, 1, 'диагональная лиса в ответ не входит');
  assert.equal(res.parts.d1, 1, 'но в разбивке диагональ всё же видна решателю');
});

test('подсветка показывает ровно те клетки, которые слышит пеленгатор уровня', () => {
  // Разведчик: в числе только строка и столбец — диагонали не подсвечиваются
  const scout = new Game({ seed: 7, mode: 'rowcol' });
  const cells = scout.heardCells(5, 5);
  assert.equal(cells.length, 19, 'строка 10 + столбец 9, диагоналей нет');
  for (const [r, c] of cells) assert.ok(r === 5 || c === 5, `клетка ${r}.${c} лежит только на диагонали`);

  // классика и остальные режимы — все четыре луча, клетка считается один раз
  const hunter = new Game({ seed: 7, mode: 'sum' });
  assert.deepEqual(hunter.heardCells(5, 5), hunter.lineCells(5, 5));
  assert.equal(hunter.heardCells(5, 5).length, 36);

  // у «Ветерана» поле 12×12 — проверяем, что и там счёт совпадает с лучами
  const veteran = new Game({ seed: 7, size: 12, foxes: 10, mode: 'sum' });
  assert.equal(veteran.heardCells(6, 6).length, veteran.lineCells(6, 6).length);
});

test('число на индикаторе равно сумме лис на подсвеченных клетках', () => {
  // Именно этого теста не хватало: числа проверялись отдельно от подсветки,
  // и «Разведчик» подсвечивал диагонали, которых пеленг не слышит.
  let checked = 0;
  for (const lv of LEVELS) {
    const g = new Game({ seed: 11, size: lv.size, foxes: lv.foxes, mode: lv.mode });
    for (let r = 1; r <= g.size; r++) {
      for (let c = 1; c <= g.size; c++) {
        if (g.field[g.idx(r, c)] > 0) continue; // в занятой клетке лиса ловится, пеленга нет
        const heard = g.heardCells(r, c);
        const sum = heard.reduce((a, p) => a + g.field[g.idx(p[0], p[1])], 0);
        const p = g.bearingParts(r, c);
        const shown = lv.mode === 'rowcol' ? p.row + p.col : p.row + p.col + p.d1 + p.d2;
        assert.equal(sum, shown, `${lv.id}: клетка ${r}.${c}`);
        /* И то же число обязан вернуть сам заход: именно его печатают клетка,
           панель и журнал. */
        const probe = new Game({ field: g.field.slice(), size: g.size, mode: lv.mode, foxes: lv.foxes });
        const answer = probe.probe(r, c).bearing;
        if (lv.mode === 'binary') assert.equal(answer, sum > 0 ? 1 : 0, `${lv.id}: ответ захода ${r}.${c}`);
        else assert.equal(answer, shown, `${lv.id}: ответ захода ${r}.${c}`);
        checked++;
      }
    }
  }
  assert.ok(checked > 500, `проверено клеток: ${checked}`);
});

test('режим binary: только «есть/нет», без количества', () => {
  const f = new Array(8 * 8).fill(0);
  f[(1 - 1) * 8 + (1 - 1)] = 1;
  f[(1 - 1) * 8 + (2 - 1)] = 1;
  const g = new Game({ field: f, size: 8, foxes: 2, mode: 'binary' });
  const hit = g.probe(1, 4);
  assert.equal(hit.type, 'bearing');
  assert.equal(hit.bearing, 1, 'две лисы на строке, но радар говорит только «есть»');
  const clear = g.probe(5, 7); // ни строка 5, ни столбец 7, ни диагонали не задевают 1.1 и 1.2
  assert.equal(clear.bearing, 0);
  assert.equal(g.bearingValue(1, 4), 1);
});

test('пеленг на маленьком поле не выходит за границы', () => {
  const g = new Game({ seed: 3, size: 8, foxes: 4 });
  for (const [r, c] of [[1, 1], [1, 8], [8, 1], [8, 8]]) {
    const cells = g.lineCells(r, c);
    for (const [rr, cc] of cells) assert.ok(rr >= 1 && rr <= 8 && cc >= 1 && cc <= 8);
    if (g.field[g.idx(r, c)] > 0) continue; // в занятой клетке лиса считается по всем лучам
    const p = g.bearingParts(r, c);
    assert.equal(p.row + p.col + p.d1 + p.d2, g.bearing(r, c),
      'на пустой клетке разбивка по лучам совпадает с общим пеленгом');
  }
});

test('разбивка по лучам совпадает с общим пеленгом на всех пустых клетках', () => {
  for (let seed = 0; seed < 12; seed++) {
    const g = new Game({ seed });
    for (let r = 1; r <= SIZE; r++) {
      for (let c = 1; c <= SIZE; c++) {
        if (g.field[g.idx(r, c)] > 0) continue;
        const p = g.bearingParts(r, c);
        assert.equal(p.row + p.col + p.d1 + p.d2, g.bearing(r, c), `seed ${seed}, ${r}.${c}`);
      }
    }
  }
});

test('уровень воспроизводится по сиду, как и классика', () => {
  const lv = levelById('extreme');
  const a = new Game({ seed: 999, size: lv.size, foxes: lv.foxes, mode: lv.mode });
  const b = new Game({ seed: 999, size: lv.size, foxes: lv.foxes, mode: lv.mode });
  assert.deepEqual(a.field, b.field);
  assert.equal(a.mode, 'binary');
});

test('уровни заданы целиком: поле, лисы, пороги, режим', () => {
  const ids = new Set();
  for (const lv of LEVELS) {
    assert.ok(!ids.has(lv.id), `повтор id: ${lv.id}`);
    ids.add(lv.id);
    assert.ok(lv.size >= 6 && lv.size <= 16, `${lv.id}: поле ${lv.size}`);
    assert.ok(lv.foxes >= 1 && lv.foxes <= lv.size * lv.size / 4, `${lv.id}: лис ${lv.foxes}`);
    assert.ok(MODES.includes(lv.mode), `${lv.id}: режим ${lv.mode}`);
    assert.ok(['hover', 'after', 'none'].includes(lv.hints), `${lv.id}: подсказки ${lv.hints}`);
    assert.equal(typeof lv.board, 'boolean', `${lv.id}: board`);
    assert.equal(typeof lv.marks, 'boolean', `${lv.id}: marks`);
    assert.ok(lv.stars[0] < lv.stars[1], `${lv.id}: пороги ${lv.stars}`);
    assert.ok(lv.note && lv.note.length > 0, `${lv.id}: пустое пояснение`);
  }
  // «Слепой» — поле видно, лучей нет: игрок не чертит поле на бумаге
  const blind = levelById('blind');
  assert.equal(blind.board, true, 'поле должно быть видимым');
  assert.equal(blind.hints, 'none', 'подсветки лучей быть не должно');
  // «МК-61» — единственное место, где поля нет вовсе (это вариант, а не уровень)
  assert.equal(LEVELS.filter((lv) => !lv.board).length, 0);
});
