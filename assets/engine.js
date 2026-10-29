/* Охота на лис — игровое ядро.
   Логика восстановлена по описанию Ю. Иванова и П. Иртюги
   («Наука и жизнь», № 10, 1990): поле 10×10, восемь лис,
   пеленг — число не пойманных лис на строке, столбце и двух диагоналях.
   Никакого DOM: модуль годится и для браузера, и для тестов. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FoxEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SIZE = 10;
  var FOXES = 8;

  /* Режимы пеленгатора.
     sum    — одно число: сколько лис на четырёх лучах (оригинал);
     rowcol — два числа: строка и столбец, диагоналей нет;
     rays   — четыре числа по лучам;
     binary — «на лучах есть лиса» да/нет, без количества. */
  var MODES = ['sum', 'rowcol', 'rays', 'binary'];

  /* Уровни. stars: [три звезды от скольких ходов, две звезды от скольких].
     Пороги посчитаны перебором партий эталонной политики решателя
     (tools/thresholds.js): 3★ = 10-й процентиль, 2★ = 75-й плюс поправка
     на человеческий счёт в голове; у «Ветерана», «Слепого» и «Экстрима» ещё +2 к 3★,
     потому что нет заметок, поля или счёта. Разбор — в docs/пороги-звёзд.md.
     hints: hover | after | none. */
  var LEVELS = [
    {
      id: 'novice', title: 'Новичок', size: 8, foxes: 4, mode: 'rays',
      hints: 'hover', marks: true, board: true, stars: [8, 13],
      note: 'четыре числа по лучам'
    },
    {
      id: 'scout', title: 'Разведчик', size: 10, foxes: 8, mode: 'rowcol',
      hints: 'hover', marks: true, board: true, stars: [20, 28],
      note: 'строка и столбец, без диагоналей'
    },
    {
      id: 'hunter', title: 'Охотник', size: 10, foxes: 8, mode: 'sum',
      hints: 'hover', marks: true, board: true, stars: [19, 25],
      note: 'классика 1990 года'
    },
    {
      id: 'veteran', title: 'Ветеран', size: 12, foxes: 10, mode: 'sum',
      hints: 'after', marks: false, board: true, stars: [26, 31],
      note: '12×12, подсветка только после хода'
    },
    {
      id: 'blind', title: 'Слепой', size: 10, foxes: 8, mode: 'sum',
      hints: 'none', marks: true, board: true, stars: [20, 25],
      note: 'поле без подсветки лучей'
    },
    {
      id: 'extreme', title: 'Экстрим', size: 8, foxes: 4, mode: 'binary',
      hints: 'after', marks: true, board: true, stars: [17, 25],
      note: 'радар: есть лиса на лучах или нет'
    }
  ];

  function levelById(id) {
    for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i];
    return null;
  }

  /* Детерминированный ГПСЧ: одна и та же «партия» воспроизводима по номеру. */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* «4.3», «4,3», «04 03» → {r:4,c:3}. Первое число — строка, второе — столбец. */
  function parseCoord(text, size) {
    size = size || SIZE;
    if (typeof text !== 'string') return null;
    var m = text.trim().replace(/[.,;:\s]+/g, ' ').match(/^(\d{1,2})\s+(\d{1,2})$/);
    if (!m) return null;
    var r = parseInt(m[1], 10);
    var c = parseInt(m[2], 10);
    if (r < 1 || r > size || c < 1 || c > size) return null;
    return { r: r, c: c };
  }

  function Game(opts) {
    opts = opts || {};
    this.size = opts.size || SIZE;
    this.totalFoxes = opts.foxes || FOXES;
    this.mode = MODES.indexOf(opts.mode) >= 0 ? opts.mode : 'sum';
    this.seed = (opts.seed == null) ? (Math.random() * 1000000) | 0 : (opts.seed >>> 0);

    /* Гон: лисы перебегают. every — через сколько ходов, count — сколько лис
       (1 или 'all'). Пока ходов меньше every, расстановка стоит на месте. */
    var chaseCount = 1;
    if (opts.chase) {
      var wanted = opts.chase.count;
      chaseCount = wanted === 'all'
        ? 'all'
        : Math.max(1, Math.min(this.totalFoxes, Math.round(wanted) || 1));
    }
    this.chase = opts.chase
      ? {
        every: Math.max(1, Math.min(9, opts.chase.every | 0 || 5)),
        count: chaseCount
      }
      : null;

    this.field = new Array(this.size * this.size).fill(0);
    this.found = new Array(this.size * this.size).fill(0);
    this.foundTotal = 0;
    this.moves = 0;
    this.over = false;
    this.won = false;
    this.log = [];
    this._rnd = mulberry32((this.seed ^ 0x9E3779B9) >>> 0);

    if (opts.field) {
      if (opts.field.length !== this.field.length) throw new Error('field: неверный размер поля');
      this.field = opts.field.slice();
      var sum = 0;
      for (var i = 0; i < this.field.length; i++) sum += this.field[i];
      this.totalFoxes = sum;
    } else {
      this.place(this.seed);
    }
  }

  /* Восемь независимых бросков по 100 клеткам, как в оригинале:
     несколько лис вполне могут оказаться в одной клетке. */
  Game.prototype.place = function (seed) {
    var rnd = mulberry32(seed);
    for (var i = 0; i < this.totalFoxes; i++) {
      var r = Math.floor(rnd() * this.size);
      var c = Math.floor(rnd() * this.size);
      this.field[r * this.size + c] += 1;
    }
  };

  Game.prototype.idx = function (r, c) { return (r - 1) * this.size + (c - 1); };

  Game.prototype.inBounds = function (r, c) {
    return Number.isInteger(r) && Number.isInteger(c) &&
      r >= 1 && r <= this.size && c >= 1 && c <= this.size;
  };

  /* Клетки четырёх «лучей» пеленгатора — строка, столбец, две диагонали. */
  Game.prototype.lineCells = function (r, c) {
    var out = [];
    var seen = {};
    var n = this.size;
    for (var i = 1; i <= n; i++) {
      var pairs = [
        [r, i], [i, c],
        [r + (i - r), c + (i - r)],
        [r + (i - r), c - (i - r)]
      ];
      for (var k = 0; k < pairs.length; k++) {
        var pr = pairs[k][0], pc = pairs[k][1];
        if (pr < 1 || pr > n || pc < 1 || pc > n) continue;
        var key = pr + ':' + pc;
        if (seen[key]) continue;
        seen[key] = 1;
        out.push([pr, pc]);
      }
    }
    return out;
  };

  /* Клетки, которые пеленгатор этого уровня действительно слышит.
     sum/rays/binary — все четыре луча, как в оригинале;
     rowcol — только строка и столбец: диагонали в число не входят,
     поэтому и подсвечивать их на экране нельзя (иначе витрина обещает
     клетку, из которой ответа не будет). */
  Game.prototype.heardCells = function (r, c) {
    var cells = this.lineCells(r, c);
    if (this.mode !== 'rowcol') return cells;
    var out = [];
    for (var i = 0; i < cells.length; i++) {
      if (cells[i][0] === r || cells[i][1] === c) out.push(cells[i]);
    }
    return out;
  };

  /* Пеленг по каждому лучу отдельно — для режимов rays/rowcol и подсказок. */
  Game.prototype.bearingParts = function (r, c) {
    var n = this.size, row = 0, col = 0, d1 = 0, d2 = 0, i;
    for (i = 1; i <= n; i++) row += this.field[this.idx(r, i)];
    for (i = 1; i <= n; i++) col += this.field[this.idx(i, c)];
    for (i = 1 - n; i < n; i++) {
      var rr = r + i, cc = c + i;
      if (rr >= 1 && rr <= n && cc >= 1 && cc <= n) d1 += this.field[this.idx(rr, cc)];
      var rr2 = r + i, cc2 = c - i;
      if (rr2 >= 1 && rr2 <= n && cc2 >= 1 && cc2 <= n) d2 += this.field[this.idx(rr2, cc2)];
    }
    return { row: row, col: col, d1: d1, d2: d2 };
  };

  /* Классический пеленг: каждая клетка считается один раз, даже если лежит
     сразу на строке, столбце и двух диагоналях (как в оригинале). */
  Game.prototype.bearing = function (r, c) {
    var cells = this.lineCells(r, c);
    var sum = 0;
    for (var i = 0; i < cells.length; i++) {
      sum += this.field[this.idx(cells[i][0], cells[i][1])];
    }
    return sum;
  };

  Game.prototype.remaining = function () { return this.totalFoxes - this.foundTotal; };

  /* Значение на индикаторе: число, а в режиме binary — 1/0. */
  Game.prototype.bearingValue = function (r, c) {
    var sum = this.bearing(r, c);
    if (this.mode === 'binary') return sum > 0 ? 1 : 0;
    return sum;
  };

  /* Соседние клетки: восемь направлений, как ходит король. */
  Game.prototype.neighbors = function (r, c) {
    var out = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        var rr = r + dr, cc = c + dc;
        if (rr >= 1 && rr <= this.size && cc >= 1 && cc <= this.size) out.push([rr, cc]);
      }
    }
    return out;
  };

  /* Клетка последнего захода охотника (пеленг или поимка). Нужна для правила
     «не перебегать прямо под свежий пеленг»: подглядывать в ответ нельзя. */
  Game.prototype.lastProbeCell = function () {
    for (var i = this.log.length - 1; i >= 0; i--) {
      var e = this.log[i];
      if (e.type === 'bearing' || e.type === 'fox') return [e.r, e.c];
    }
    return null;
  };

  /* Перебежка: сколько-то лис (по умолчанию одна, можно любую долю — вплоть до всех),
     каждая — в случайную соседнюю клетку.
     Стопки разрешены: две лисы могут оказаться в одной клетке.
     Клетка последнего пеленга из вариантов исключается: иначе лиса встаёт
     ровно туда, куда игрок сию секунду смотрел, и перебежка награждает за
     слепой тык. Если идти больше некуда — правило уступает (не застревать). */
  Game.prototype.relocate = function () {
    /* Список — по одной записи на каждую лису, а не на клетку: в клетке может
       стоять стопка, и «3 лисы» должны означать трёх зверей, а не три клетки. */
    var spots = [], r, c, i, k;
    for (r = 1; r <= this.size; r++) {
      for (c = 1; c <= this.size; c++) {
        var here = this.field[this.idx(r, c)];
        for (k = 0; k < here; k++) spots.push([r, c]);
      }
    }
    if (!spots.length) return null;

    var want = (this.chase && this.chase.count != null) ? this.chase.count : 1;
    var n = want === 'all'
      ? spots.length
      : Math.max(1, Math.min(Math.round(want) || 1, spots.length));

    /* n разных записей: перемешиваем Фишером—Йетсом на сиде, иначе «3 лисы»
       могли бы три раза указать на одного и того же зверя. */
    var pool = spots.slice();
    for (i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(this._rnd() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    var chosen = pool.slice(0, n);

    var moved = [];
    var forbid = this.lastProbeCell();
    for (i = 0; i < chosen.length; i++) {
      var from = chosen[i];
      var opts = this.neighbors(from[0], from[1]);
      if (!opts.length) continue;
      if (forbid) {
        var free = [];
        for (var j = 0; j < opts.length; j++) {
          if (opts[j][0] !== forbid[0] || opts[j][1] !== forbid[1]) free.push(opts[j]);
        }
        if (free.length) opts = free;
      }
      var to = opts[Math.floor(this._rnd() * opts.length)];
      this.field[this.idx(from[0], from[1])] -= 1;
      this.field[this.idx(to[0], to[1])] += 1;
      moved.push({ fr: from[0], fc: from[1], tr: to[0], tc: to[1] });
    }
    if (!moved.length) return null;

    var ev = { type: 'move', moves: this.moves, all: n === spots.length, count: n, moved: moved };
    this.log.push(ev);
    return ev;
  };

  /* Один заход охотника.
     Есть лиса в клетке → ловится ровно одна, ответ «ЛИС—N».
     Иначе → число лис на четырёх лучах. */
  Game.prototype.probe = function (r, c) {
    if (this.over) return { type: 'over', moves: this.moves };
    if (!this.inBounds(r, c)) return { type: 'invalid' };

    var i = this.idx(r, c);
    var res;
    this.moves++;

    if (this.field[i] > 0) {
      this.field[i] -= 1;
      this.found[i] += 1;
      this.foundTotal += 1;
      res = {
        type: 'fox', r: r, c: c,
        remaining: this.remaining(),
        inCell: this.field[i],
        foundHere: this.found[i],
        moves: this.moves
      };
      if (this.foundTotal >= this.totalFoxes) {
        this.over = true;
        this.won = true;
        res.win = true;
      }
    } else {
      var parts = this.bearingParts(r, c);
      var sum = parts.row + parts.col + parts.d1 + parts.d2;
      /* Что печатается как ответ. На «Разведчике» диагонали не слышны: и число,
         и разбивка — только строка и столбец. Раньше здесь всегда была сумма
         четырёх лучей, и цифра в клетке противоречила подсветке и подписи. */
      var shown = this.mode === 'rowcol' ? parts.row + parts.col
        : (this.mode === 'binary' ? (sum > 0 ? 1 : 0) : sum);
      res = {
        type: 'bearing', r: r, c: c,
        bearing: shown,
        parts: parts,
        mode: this.mode,
        moves: this.moves
      };
    }

    this.log.push(res);

    /* Гон: после каждого N-го хода лисы перебегают. */
    if (!this.over && this.chase && this.moves % this.chase.every === 0) {
      var ev = this.relocate();
      if (ev) {
        res.moved = {
          all: ev.all,
          count: ev.moved.length,
          from: ev.moved.map(function (m) { return { r: m.fr, c: m.fc }; })
        };
      }
    }

    return res;
  };

  /* Сдаться: поле раскрывается, партия прекращается без победы. */
  Game.prototype.forfeit = function () {
    this.over = true;
    this.won = false;
    return this.remainingCells();
  };

  Game.prototype.remainingCells = function () {
    var out = [];
    for (var r = 1; r <= this.size; r++) {
      for (var c = 1; c <= this.size; c++) {
        var n = this.field[this.idx(r, c)];
        if (n > 0) out.push({ r: r, c: c, foxes: n });
      }
    }
    return out;
  };

  return {
    Game: Game,
    SIZE: SIZE,
    FOXES: FOXES,
    MODES: MODES,
    LEVELS: LEVELS,
    levelById: levelById,
    mulberry32: mulberry32,
    parseCoord: parseCoord
  };
});
