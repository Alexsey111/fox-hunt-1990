/* Охота на лис — решатель.
   Работает ТОЛЬКО по журналу пеленгов: ни field, ни found не читает,
   иначе подсказка станет оракулом. Годится и в браузере, и в Node.

   Что умеет:
     analyze(game, upto)  — модель текущих знаний (границы по каждой клетке);
     model.excluded()     — клетки, где лис точно нет (это и есть автопометки «×»);
     model.certain()      — клетки, где лиса точно есть;
     model.hint()         — рекомендация хода: поймать или запеленговать;
     review(game)         — разбор партии: что дал каждый ход.

   Модель: для каждой клетки нижняя и верхняя границы числа не пойманных лис.
   Ограничения берутся из пеленгов (точное число лис на наборе клеток) и
   распространяются до неподвижной точки — это классическая граничная
   согласованность, выводы из неё строгие, без «на глаз». */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FoxSolver = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function clamp(x, lo, hi) { return x < lo ? lo : (x > hi ? hi : x); }

  /* Наборы клеток для одного пеленга. */
  function setsFor(game, res) {
    var n = game.size, out = [];
    var row = [], col = [], d1 = [], d2 = [], i, rr, cc;

    for (i = 1; i <= n; i++) row.push((res.r - 1) * n + (i - 1));
    for (i = 1; i <= n; i++) col.push((i - 1) * n + (res.c - 1));
    for (i = 1 - n; i < n; i++) {
      rr = res.r + i; cc = res.c + i;
      if (rr >= 1 && rr <= n && cc >= 1 && cc <= n) d1.push((rr - 1) * n + (cc - 1));
      rr = res.r + i; cc = res.c - i;
      if (rr >= 1 && rr <= n && cc >= 1 && cc <= n) d2.push((rr - 1) * n + (cc - 1));
    }

    if (res.mode === 'rays') {
      out.push({ cells: row, target: res.parts.row });
      out.push({ cells: col, target: res.parts.col });
      out.push({ cells: d1, target: res.parts.d1 });
      out.push({ cells: d2, target: res.parts.d2 });
    } else if (res.mode === 'rowcol') {
      out.push({ cells: row, target: res.parts.row });
      out.push({ cells: col, target: res.parts.col });
    } else {
      /* sum и binary: союз четырёх лучей, каждая клетка один раз */
      var seen = {}, union = [];
      var all = [[res.r, res.c]];
      for (i = 0; i < row.length; i++) all.push([Math.floor(row[i] / n) + 1, row[i] % n + 1]);
      for (i = 0; i < col.length; i++) all.push([Math.floor(col[i] / n) + 1, col[i] % n + 1]);
      for (i = 0; i < d1.length; i++) all.push([Math.floor(d1[i] / n) + 1, d1[i] % n + 1]);
      for (i = 0; i < d2.length; i++) all.push([Math.floor(d2[i] / n) + 1, d2[i] % n + 1]);
      for (i = 0; i < all.length; i++) {
        var k = (all[i][0] - 1) * n + (all[i][1] - 1);
        if (seen[k]) continue;
        seen[k] = 1;
        union.push(k);
      }
      out.push({ cells: union, target: res.bearing });
    }
    return out;
  }

  /* Поимки после хода i уменьшают старый пеленг: их надо вычесть,
     иначе ограничение будет противоречить нынешнему полю. */
  function caughtBetween(game, from, to, cellSet) {
    var n = game.size, log = game.log, seen = {}, k, i, cut = 0;
    for (i = 0; i < cellSet.length; i++) seen[cellSet[i]] = 1;
    for (i = from + 1; i < to; i++) {
      if (log[i].type !== 'fox') continue;
      k = (log[i].r - 1) * n + (log[i].c - 1);
      if (seen[k]) cut++;
    }
    return cut;
  }

  /* Перебежки ломают старые пеленги. Правила выбрасывания строгие:
     — событие «перебежали все» обнуляет всё, что было до него;
     — если известна клетка, откуда ушла лиса, то уцелевают только пеленги,
       чьи лучи её не содержали (лиса не могла попасть в счёт);
     — отметка «здесь пусто» уцелевает, если оттуда нельзя дойти за один шаг. */
  function moveEvents(game, upto) {
    var n = game.size, log = game.log, out = [], i, k;
    for (i = 0; i < upto; i++) {
      if (log[i].type !== 'move') continue;
      var origins = [];
      for (k = 0; k < log[i].moved.length; k++) {
        origins.push((log[i].moved[k].fr - 1) * n + (log[i].moved[k].fc - 1));
      }
      out.push({ idx: i, all: !!log[i].all, origins: origins });
    }
    return out;
  }

  function buildConstraints(game, upto, U) {
    var n = game.size, log = game.log, out = [], i, j, q;
    var events = moveEvents(game, upto);
    /* Радиус, на который лиса может уйти за одну перебежку. Сейчас в игре
       шаг всегда 1, но формула обязана следовать за настройкой: при шаге N
       умирает не только соседняя клетка, а вся окрестность радиуса N. */
    var step = (game.chase && (game.chase.step | 0)) || 1;

    function firstEventAfter(idx) {
      for (var e = 0; e < events.length; e++) if (events[e].idx > idx) return e;
      return -1;
    }

    function survives(idx, cellSet, isCellProbe, cellIdx) {
      var e0 = firstEventAfter(idx);
      if (e0 < 0) return true;

      for (var e = e0; e < events.length; e++) {
        var ev = events[e];
        if (ev.all) return false;

        for (var o = 0; o < ev.origins.length; o++) {
          var oc = ev.origins[o];
          var orow = Math.floor(oc / n), ocol = oc % n;

          if (isCellProbe) {
            var crow = Math.floor(cellIdx / n), ccol = cellIdx % n;
            if (Math.abs(orow - crow) <= step && Math.abs(ocol - ccol) <= step) return false;
            continue;
          }

          /* Лиса ушла из своей клетки и встала в любую в пределах шага. Счёт по набору
             не изменится, только если набор не задевает ни исходную клетку,
             ни её окрестность радиуса шага: иначе лиса могла из набора уйти или в него войти. */
          for (q = 0; q < cellSet.length; q++) {
            var srow = Math.floor(cellSet[q] / n), scol = cellSet[q] % n;
            if (Math.abs(srow - orow) <= step && Math.abs(scol - ocol) <= step) return false;
          }
        }
      }
      return true;
    }

    /* сколько поимок учитывать: только до первой перебежки */
    function catchWindow(idx, cellSet) {
      var e0 = firstEventAfter(idx);
      var to = e0 < 0 ? log.length : events[e0].idx;
      if (to > upto) to = upto;
      return caughtBetween(game, idx, to, cellSet);
    }

    for (i = 0; i < upto; i++) {
      var res = log[i];
      if (res.type !== 'bearing') continue;

      var cellIdx = (res.r - 1) * n + (res.c - 1);

      /* Пеленг пришёл числом — значит, в самой клетке лисы нет. Это строго. */
      if (survives(i, [cellIdx], true, cellIdx)) {
        out.push({ cells: [cellIdx], kind: 'exact', target: 0 });
      }

      var parts = setsFor(game, res);
      for (j = 0; j < parts.length; j++) {
        var set = parts[j].cells;
        if (!survives(i, set, false, cellIdx)) continue;
        var target = parts[j].target - catchWindow(i, set);
        if (res.mode === 'binary') {
          if (res.bearing > 0) out.push({ cells: set, kind: 'nonempty', target: 1 });
          else out.push({ cells: set, kind: 'exact', target: 0 });
        } else {
          out.push({ cells: set, kind: 'exact', target: clamp(target, 0, U) });
        }
      }
    }
    return out;
  }

  /* Граничная согласованность: пока что-то меняется — сужаем интервалы. */
  function propagate(cells, cons, U) {
    var changed = true, pass = 0, i, k, c, sumLb, sumUb, cell;

    while (changed && pass < 80) {
      changed = false;
      pass++;

      sumLb = 0; sumUb = 0;
      for (i = 0; i < cells.length; i++) { sumLb += cells[i].lb; sumUb += cells[i].ub; }

      /* всего не пойманных лис ровно U */
      if (sumUb > U) {
        for (i = 0; i < cells.length; i++) {
          cell = cells[i];
          var cap = U - (sumLb - cell.lb);
          if (cell.ub > cap) { cell.ub = cap; changed = true; }
        }
      }

      for (k = 0; k < cons.length; k++) {
        c = cons[k];
        if (c.kind !== 'exact') continue;

        sumLb = 0; sumUb = 0;
        for (i = 0; i < c.cells.length; i++) {
          sumLb += cells[c.cells[i]].lb;
          sumUb += cells[c.cells[i]].ub;
        }
        if (sumLb > c.target || sumUb < c.target) continue; /* несогласованно — не трогаем */

        for (i = 0; i < c.cells.length; i++) {
          cell = cells[c.cells[i]];
          var ub = c.target - (sumLb - cell.lb);
          var lb = c.target - (sumUb - cell.ub);
          if (ub < cell.ub) { cell.ub = ub; changed = true; }
          if (lb > cell.lb) { cell.lb = lb; changed = true; }
        }
      }
    }
    return cells;
  }

  /* Мягкая оценка: итеративное выравнивание весов под те же ограничения.
     Строгие выводы даёт propagate, а веса нужны только для выбора хода. */
  function raking(cells, cons, U, passes) {
    var w = new Float64Array(cells.length), i, k, c, s;
    for (i = 0; i < cells.length; i++) w[i] = cells[i].ub > 0 ? 1 : 0;

    for (var p = 0; p < (passes || 60); p++) {
      for (k = 0; k < cons.length; k++) {
        c = cons[k];
        if (c.kind !== 'exact' || !c.target) continue;
        s = 0;
        for (i = 0; i < c.cells.length; i++) s += w[c.cells[i]];
        if (s < 1e-9) continue;
        var f = c.target / s;
        if (!isFinite(f) || f <= 0) continue;
        for (i = 0; i < c.cells.length; i++) w[c.cells[i]] *= Math.pow(f, 0.5);
      }
      s = 0;
      for (i = 0; i < w.length; i++) s += w[i];
      if (s > 1e-9) {
        var g = Math.pow(U / s, 0.5);
        for (i = 0; i < w.length; i++) w[i] *= g;
      }
    }

    s = 0;
    for (i = 0; i < w.length; i++) s += w[i];
    if (s > 1e-9) {
      var h = U / s;
      for (i = 0; i < w.length; i++) w[i] *= h;
    }
    for (i = 0; i < w.length; i++) {
      if (cells[i].lb >= 1) w[i] = Math.max(w[i], cells[i].lb);
      if (cells[i].ub === 0) w[i] = 0;
      if (w[i] > U) w[i] = U;
    }
    return w;
  }

  /* Энтропия ответа пеленгатора: пуассоновская модель со средним mu. */
  function poissonPmf(mu, U) {
    var pmf = [], p = Math.exp(-mu), sum = 0, k;
    for (k = 0; k <= U; k++) { pmf.push(p); sum += p; p *= mu / (k + 1); }
    if (sum < 1e-12) return [1].concat(new Array(U).fill(0));
    for (k = 0; k <= U; k++) pmf[k] /= sum;
    return pmf;
  }

  function countEntropy(mu, U) {
    if (mu <= 1e-9) return 0;
    var pmf = poissonPmf(mu, U), h = 0;
    for (var k = 0; k <= U; k++) if (pmf[k] > 1e-12) h -= pmf[k] * Math.log2(pmf[k]);
    return h;
  }

  function binaryEntropy(p) {
    if (p <= 0 || p >= 1) return 0;
    return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
  }

  /* ---------- модель ---------- */

  function analyze(game, upto) {
    var n = game.size;
    if (upto == null) upto = game.log.length;

    var caught = 0, i;
    for (i = 0; i < upto; i++) if (game.log[i].type === 'fox') caught++;
    var U = Math.max(0, game.totalFoxes - caught);

    var cells = new Array(n * n);
    for (i = 0; i < cells.length; i++) cells[i] = { r: Math.floor(i / n) + 1, c: i % n + 1, lb: 0, ub: U };

    var cons = buildConstraints(game, upto, U);
    propagate(cells, cons, U);

    /* подписи уже известных наборов: повторный пеленг по тому же набору новых бит не даёт */
    function sig(set) {
      var a = set.slice().sort(function (x, y) { return x - y; });
      return a.join(',');
    }
    var known = {};
    for (i = 0; i < cons.length; i++) {
      if (cons[i].kind === 'exact' || cons[i].kind === 'nonempty') known[sig(cons[i].cells)] = 1;
    }

    var model = {
      n: n, mode: game.mode, U: U, cells: cells, cons: cons, weightsArr: null, known: known,
      sig: sig,

      at: function (r, c) { return cells[(r - 1) * n + (c - 1)]; },

      excluded: function (r, c) { return this.at(r, c).ub === 0; },

      /* Нестрогая оценка: вероятность лисы ниже порога. Это НЕ доказательство —
         так и подписано в интерфейсе, чтобы «×» не выдавал себя за теорему. */
      unlikely: function (r, c, threshold) {
        var cell = this.at(r, c);
        if (cell.ub === 0) return true;
        var w = this.weights()[(r - 1) * n + (c - 1)];
        return (1 - Math.exp(-w)) < (threshold == null ? 0.02 : threshold);
      },

      /* Сколько бит принёс уже случившийся ответ — по модели ДО этого хода. */
      bitsOf: function (res) {
        var w = this.weights();
        var r = res.r, c = res.c;
        var k = (r - 1) * n + (c - 1);

        if (res.type === 'fox') {
          var pc = clamp(1 - Math.exp(-w[k]), 1e-6, 1);
          return clamp(-Math.log2(pc), 0, Math.log2(U + 1) + 1);
        }

        var sets = setsFor(game, { r: r, c: c, mode: this.mode, bearing: 0, parts: { row: 0, col: 0, d1: 0, d2: 0 } });
        var observed = this.mode === 'rays'
          ? [res.parts.row, res.parts.col, res.parts.d1, res.parts.d2]
          : (this.mode === 'rowcol' ? [res.parts.row, res.parts.col] : [res.bearing]);
        var bits = 0, j, q;

        if (this.mode === 'binary' && sets.length === 1) {
          if (known[sig(sets[0].cells)]) return 0;
          var mu = 0;
          for (q = 0; q < sets[0].cells.length; q++) mu += w[sets[0].cells[q]];
          var pYes = clamp(1 - Math.exp(-mu), 1e-6, 1 - 1e-6);
          var p = res.bearing ? pYes : 1 - pYes;
          return clamp(-Math.log2(p), 0, 4);
        }

        for (j = 0; j < sets.length; j++) {
          if (known[sig(sets[j].cells)]) continue; /* набор уже запеленгован — ответ был предсказуем */
          var m2 = 0;
          for (q = 0; q < sets[j].cells.length; q++) m2 += w[sets[j].cells[q]];
          var pmf = poissonPmf(clamp(m2, 0, U + 0.5), U);
          var obs = clamp(observed[j] || 0, 0, U);
          bits += clamp(-Math.log2(Math.max(pmf[obs], 1e-6)), 0, 4);
        }
        return bits;
      },

      certain: function (r, c) { var x = this.at(r, c); return x.lb >= 1; },

      countExcluded: function () {
        var m = 0;
        for (var j = 0; j < cells.length; j++) if (cells[j].ub === 0) m++;
        return m;
      },

      countCertain: function () {
        var m = 0;
        for (var j = 0; j < cells.length; j++) if (cells[j].lb >= 1) m++;
        return m;
      },

      weights: function () {
        if (!this.weightsArr) this.weightsArr = raking(cells, cons, U, 60);
        return this.weightsArr;
      },

      /* Сколько бит ожидается от захода в клетку и насколько вероятна поимка. */
      score: function (r, c) {
        var w = this.weights();
        var k = (r - 1) * n + (c - 1);
        var cell = cells[k];
        if (cell.ub === 0) return { bits: 0, prob: 0, open: false };

        var pCatch = cell.lb >= 1 ? 1 : 1 - Math.exp(-w[k]);
        pCatch = clamp(pCatch, 0, 1);

        var res = { r: r, c: c, prob: pCatch, bits: 0, open: true };
        if (pCatch >= 0.999) {
          res.bits = 0;
          res.certain = true;
          return res;
        }

        var sets = setsFor(game, { r: r, c: c, mode: this.mode, bearing: 0, parts: { row: 0, col: 0, d1: 0, d2: 0 } });
        var bits = 0, j, q, s;

        for (j = 0; j < sets.length; j++) {
          s = sets[j].cells;
          /* этот набор уже запеленгован — ответ известен, новых бит не будет */
          if (known[sig(s)]) continue;
          var mu = 0;
          for (q = 0; q < s.length; q++) mu += w[s[q]];
          if (this.mode === 'binary') bits += binaryEntropy(clamp(1 - Math.exp(-mu), 0, 1));
          else if (this.mode === 'rays' || this.mode === 'rowcol') bits += countEntropy(clamp(mu, 0, U + 0.5), U);
          else bits += countEntropy(clamp(mu, 0, U + 0.5), U);
        }

        var iCatch = pCatch > 0 ? clamp(Math.log2(1 / pCatch), 0, Math.log2(U + 1)) : 0;
        res.bits = (1 - pCatch) * bits + pCatch * iCatch;
        return res;
      },

      hint: function () {
        var best = null, j, s;
        var w = this.weights();

        /* 1. Строгий вывод: клетка, где лиса обязана быть */
        for (j = 0; j < cells.length; j++) {
          if (cells[j].lb >= 1 && w[j] > 0) {
            s = { r: cells[j].r, c: cells[j].c, prob: 1, bits: 0, certain: true };
            if (!best || w[j] > w[(best.r - 1) * n + (best.c - 1)]) best = s;
          }
        }
        if (best) {
          best.kind = 'catch';
          best.text = 'лиса здесь точно: остальные клетки на лучах уже исключены.';
          best.textKey = 'hint.text.certain';
          best.textVars = {};
          return best;
        }

        /* 2. Иначе — максимум ожидаемой информации */
        for (var r = 1; r <= n; r++) {
          for (var c = 1; c <= n; c++) {
            s = this.score(r, c);
            if (!s.open) continue;
            if (!best || s.bits > best.bits + 1e-9 ||
                (Math.abs(s.bits - best.bits) < 1e-9 && s.prob > best.prob)) best = s;
          }
        }

        if (!best) return null;
        best.kind = best.prob > 0.5 ? 'catch' : 'probe';
        best.text = best.kind === 'catch'
          ? 'похоже, лиса здесь: шанс ' + Math.round(best.prob * 100) + ' %.'
          : 'ожидаем ' + best.bits.toFixed(1) + ' бита, шанс поимки ' +
            Math.round(best.prob * 100) + ' %.';
        /* Язык интерфейса выбирает оболочка: здесь только ключ и числа. */
        best.textKey = best.kind === 'catch' ? 'hint.text.chance' : 'hint.text.bits';
        best.textVars = { bits: best.bits.toFixed(1), p: Math.round(best.prob * 100) };
        return best;
      }
    };

    return model;
  }

  /* ---------- разбор партии ---------- */

  function review(game) {
    var log = game.log, out = [], i, prev = null, m;

    for (i = 0; i < log.length; i++) {
      var res = log[i];
      if (res.type === 'move') continue;
      m = analyze(game, i + 1);

      var before = i === 0 ? analyze(game, 0) : prev;
      var excludedBefore = before.countExcluded();
      var excludedAfter = m.countExcluded();

      var repeat = false;
      for (var j = 0; j < i; j++) {
        if (log[j].r === res.r && log[j].c === res.c) { repeat = true; break; }
      }

      var row = {
        moves: res.moves,
        index: i,
        r: res.r, c: res.c,
        type: res.type,
        bits: before.bitsOf(res),
        remaining: res.remaining,
        bearing: res.bearing,
        answerKey: res.type === 'fox' ? 'lcd.fox'
          : (res.mode === 'binary' ? (res.bearing ? 'log.yes' : 'log.clear')
            : (res.mode === 'rays' || res.mode === 'rowcol' ? null : 'log.bearing')),
        answer: res.type === 'fox'
          ? 'ЛИС·' + res.remaining
          : (res.mode === 'binary' ? (res.bearing ? 'есть' : 'чисто')
            : (res.mode === 'rays'
              ? res.parts.row + '·' + res.parts.col + '·' + res.parts.d1 + '·' + res.parts.d2
              : (res.mode === 'rowcol' ? res.parts.row + '·' + res.parts.col : String(res.bearing)))),
        eliminated: Math.max(0, excludedAfter - excludedBefore),
        repeat: repeat,
        useful: before.bitsOf(res) >= 0.7 || res.type === 'fox'
      };

      if (res.type === 'fox') row.note = 'поимка';
      else if (row.bits >= 2.5) row.note = 'сильный ход';
      else if (row.bits >= 0.8) row.note = 'обычный';
      else if (repeat) row.note = 'повтор: клетка уже была';
      else row.note = 'почти ничего';
      row.noteKey = res.type === 'fox' ? 'note.catch'
        : (row.bits >= 2.5 ? 'note.strong' : (row.bits >= 0.8 ? 'note.normal'
          : (repeat ? 'note.repeat' : 'note.nothing')));

      out.push(row);
      prev = m;
    }
    return out;
  }

  return {
    analyze: analyze,
    review: review,
    countEntropy: countEntropy,
    binaryEntropy: binaryEntropy
  };
});
