/* Охота на лис — интерфейс.
   Ядро (assets/engine.js) отвечает за правила 1990 года, здесь только оболочка. */
(function () {
  'use strict';

  var E = window.FoxEngine;
  var Solver = window.FoxSolver;
  var I18N = window.I18N;
  var T = function (key, vars) { return I18N.t(key, vars); };
  var STORE_KEY = 'fox1990.v2';
  var OLD_KEY = 'fox1990.v1';

  /* Внешние адреса — в одном месте: подвал и правила «Где взять» берут их отсюда.
     Пустая строка означает «такого адреса пока нет» — пункт просто не показывается,
     битых ссылок в интерфейсе не бывает. */
  /* Внимание: у установщика есть «постоянное» имя без версии (oxota-na-lis-setup.exe) —
     оно перезаливается в каждый релиз, поэтому ссылка не ломается при смене версии.
     Адреса с номером версии (…-1.0.7.exe) годятся только для конкретного релиза. */
  var LINKS = {
    web: 'https://alexsey111.github.io/fox-hunt-1990/',        /* своя страница веб-версии */
    win: 'https://github.com/Alexsey111/fox-hunt-1990/releases/latest/download/oxota-na-lis-setup.exe',
    rustore: '',  /* https://www.rustore.ru/catalog/app/ru.foxhunt.game — после публикации */
    donate: 'https://yoomoney.ru/to/4100119669666956'          /* визитка ЮMoney для переводов */
  };

  function paintLinks() {
    var keys = ['web', 'win', 'rustore', 'donate'];
    for (var i = 0; i < keys.length; i++) {
      var url = LINKS[keys[i]];
      var els = document.querySelectorAll('[data-' + keys[i] + ']');
      for (var j = 0; j < els.length; j++) {
        var li = els[j].closest ? els[j].closest('li[data-i18n-html]') : null;
        if (url) {
          els[j].setAttribute('href', url);
          els[j].hidden = false;
        } else {
          els[j].removeAttribute('href');
          els[j].hidden = true;
        }
        /* пункт правил без адреса бессмыслен — прячем строку целиком */
        if (li) li.hidden = !url;
      }
    }
  }

  var el = function (id) { return document.getElementById(id); };

  var boardEl = el('board');
  var boardWrap = document.querySelector('.board-wrap');
  var panelEl = document.querySelector('.panel');
  var lcdBox = el('lcd');
  var lcdLabel = el('lcd-label');
  var lcdValue = el('lcd-value');
  var lcdNote = el('lcd-note');
  var statFound = el('stat-found');
  var statTotal = el('stat-total');
  var statMoves = el('stat-moves');
  var boardEcho = el('board-echo');
  var statTime = el('stat-time');
  var statSeed = el('stat-seed');
  var coordForm = el('coord-form');
  var coordInput = el('coord-input');
  var logEl = el('log');
  var logCount = el('log-count');
  var duelLine = el('duel-line');
  var btnShare = el('btn-share');
  var shareModal = el('share-modal');
  var shareLink = el('share-link');
  var shareNote = el('share-note');
  var recMoves = el('rec-moves');
  var recPar = el('rec-par');
  var recAssist = el('rec-assist');
  var statLine = el('stat-line');
  var levelBar = el('level-bar');
  var variantBar = el('variant-bar');
  var chaseBar = el('chase-bar');
  var chaseSize = el('chase-size');
  var chaseFoxes = el('chase-foxes');
  var chaseEvery = el('chase-every');
  var chaseCount = el('chase-count');
  var calcPanel = el('calc');
  var calcScreen = el('calc-screen');
  var calcDigits = el('calc-digits');
  var calcAnswerEl = el('calc-answer');
  var calcNoteEl = el('calc-note');
  var calcLamp = el('calc-lamp');
  var calcKeys = el('calc-keys');
  var toolsBox = el('tools');
  var dailyLine = el('daily-line');
  var notesLegend = el('notes-legend');
  var radarLegend = el('radar-legend');
  var footLevel = el('foot-level');
  var btnSound = el('btn-sound');
  var btnGiveUp = el('btn-giveup');
  var btnUndo = el('btn-undo');
  var dailyModal = el('daily-modal');
  var dailyTable = el('daily-table');
  var statsModal = el('stats-modal');
  var statsTable = el('stats-table');
  var optLines = el('opt-lines');
  var optNotes = el('opt-notes');
  var optAuto = el('opt-auto');
  var hintLine = el('hint-line');
  var reviewModal = el('review-modal');
  var reviewTable = el('review-table');
  var reviewSummary = el('review-summary');
  var printSheet = el('print-sheet');
  var printGrid = el('print-grid');
  var printKeyGrid = el('print-key-grid');
  var printLog = el('print-log');
  var printMeta = el('print-meta');
  var printBlank = el('print-blank');
  var printBlankGrid = el('print-blank-grid');
  var printBlankMeta = el('print-blank-meta');
  var printBlankLog = el('print-blank-log');
  var rulesModal = el('rules-modal');
  var winModal = el('win-modal');
  var toastEl = el('toast');

  var AUTHOR_MOVES = 19;   /* рекорд Ю. Иванова и П. Иртюги */

  var FOX_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M3.2 2.4 9.4 6.1h5.2l6.2-3.7-.6 12.2L12 22 3.8 14.6Z" fill="currentColor"/>' +
    '<path d="M12 9.6 7.6 15.4 12 19.4l4.4-4z" fill="#1b0e05" opacity=".5"/>' +
    '<circle cx="8.7" cy="10.4" r="1" fill="#1b0e05"/>' +
    '<circle cx="15.3" cy="10.4" r="1" fill="#1b0e05"/>' +
    '</svg>';

  /* ---------- перебежки ---------- */

  function afterMove(res) {
    /* все числа на доске теперь про прежнюю расстановку */
    state.results.forEach(function (v, k) { state.stale.add(k); });

    var n = res.moved.count || 0;
    var from = res.moved.from || [];
    var origins = from.map(function (m) { return m.r + '.' + m.c; }).join(', ');

    var who = n === 1
      ? T('move.one')
      : (res.moved.all ? T('move.all') : T('move.some', { foxes: foxWord(n) }));
    /* источники называем, пока их не больше трёх: иначе поле выдаёт состав */
    var where = origins && n <= 3 ? T('move.from', { cells: origins }) : '';
    var tail = T('move.tail');

    /* след: подсвечиваем источник на один ход. Когда сдвинулась не одна лиса,
       не показываем ничего — иначе поле выдаёт больше, чем нужно. */
    state.trail = (n === 1 && from[0]) ? key(from[0].r, from[0].c) : null;

    lcdNote.textContent = (lcdNote.textContent ? lcdNote.textContent.replace(/\s+$/, '') + ' · ' : '') + who + where + '.';
    addMoveLog(who + where + tail);
    toast(who + where);
    sfx.probe();
    renderAll();
  }

  function addMoveLog(text) {
    var li = document.createElement('li');
    li.className = 'is-move';
    var c = document.createElement('span');
    c.className = 'c';
    c.textContent = T('move.log.tag');
    var r = document.createElement('span');
    r.className = 'r';
    r.textContent = text;
    li.appendChild(c);
    li.appendChild(r);
    logEl.prepend(li);
    while (logEl.children.length > 400) logEl.lastElementChild.remove();
  }

  /* ---------- настройки, рекорды, статистика ---------- */

  var prefs = loadPrefs();

  function loadPrefs() {
    var base = {
      theme: 'modern', sound: false, lines: true, notes: true, auto: false,
      level: 'hunter',
      variant: 'classic',
      lang: 'ru',
      chase: { size: 10, foxes: 8, every: 5, count: 1 },
      best: {},    // id уровня → { moves, time, seed, date }
      stats: {},   // id уровня → { plays, wins, forfeits }
      daily: null, // { date, moves, seed }
      dailyHistory: {}, // 'YYYY-MM-DD' → { moves, seed }
      seen: {},         // ключ уровня → номера партий, которые уже играли
      session: null // незаконченная партия: { opts, probes, … }
    };
    var k;
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        for (k in saved) if (Object.prototype.hasOwnProperty.call(saved, k)) base[k] = saved[k];
      } else {
        /* перенос из первой версии: там был один общий рекорд и общий счёт партий */
        var oldRaw = localStorage.getItem(OLD_KEY);
        if (oldRaw) {
          var prev = JSON.parse(oldRaw);
          for (k in prev) {
            if (!Object.prototype.hasOwnProperty.call(prev, k) || k === 'best') continue;
            base[k] = prev[k];
          }
          if (prev.best && prev.best.moves) {
            base.best.hunter = {
              moves: prev.best.moves, time: prev.best.time || 0,
              seed: prev.best.seed, date: prev.best.date || ''
            };
          }
          if (prev.plays || prev.wins) {
            base.stats.hunter = {
              plays: prev.plays || 0, wins: prev.wins || 0, forfeits: 0
            };
          }
        }
      }
    } catch (err) { /* приватный режим — играем без сохранений */ }
    return base;
  }

  function savePrefs() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(prefs)); } catch (err) { /* ignore */ }
  }

  /* ---------- состояние ---------- */

  var state = {
    game: null,
    level: null,
    variant: 'classic',   // classic | chase
    chase: { size: 10, foxes: 8, every: 5, count: 1 },
    stale: new Set(),     // клетки, чьи числа устарели после перебежки
    trail: null,          // "r:c" — откуда ушла лиса; гаснет на следующем заходе
    calcInput: '',        // строка на индикаторе МК-61: «4.3»
    duel: null,           // { seed, vs } — партия по ссылке: соперник прошёл за vs ходов
    mode: 'free',         // free | daily | training
    dailyDate: null,      // 'YYYY-MM-DD', если играем задачу дня не сегодняшнюю
    results: new Map(),   // "r:c" → последний ответ по клетке
    marks: new Map(),     // "r:c" → 'q' (может быть) | 'x' (точно нет)
    autoMarks: new Set(), // «×» от решателя: здесь лисы быть не может
    hint: null,           // {r, c, kind, bits, prob, text}
    assist: { hint: 0, undo: 0 }, // помощь в партии: подсказка, отмена хода → вне рекорда
    replay: false,        // эта расстановка уже игралась → партия вне рекорда
    seedSeen: false,      // номер партии уже учтён в списке знакомых
    opts: null,           // опции, из которых собрана партия (нужны для отмены и продолжения)
    probes: [],           // [r, c] всех заходов: по ним партия восстанавливается
    baseMoves: 0,         // ходы, сделанные до игрока в тренировке
    cells: new Map(),     // "r:c" → DOM-кнопка
    lastKey: null,
    startedAt: 0,
    elapsed: 0,
    timeBase: 0,          // секунды, сыгранные до перезапуска страницы
    timer: null,
    giveUpArmed: 0,
    winTimer: null,
    toastTimer: null
  };

  function key(r, c) { return r + ':' + c; }
  function coords(r, c) { return r + '.' + c; }

  function plural(n, forms) {
    var n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return forms[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
    return forms[2];
  }

  function fmtTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function movesWord(n) { return I18N.num(n, 'unit.move'); }

  function foxWord(n) { return I18N.num(n, 'unit.fox'); }

  function dayWord(n) { return I18N.num(n, 'unit.day'); }

  /* Название и пояснение уровня — из словаря: ядро держит только id. */
  function levelTitle(lv) {
    if (lv.id === 'chase') return T('mode.chase');
    if (lv.id === 'mk61') return T('mode.mk61');
    return T('level.' + lv.id + '.title');
  }

  function levelNote(lv) {
    if (lv.id === 'chase') return lv.note || T('chase.note.none');
    if (lv.id === 'mk61') return T('mk61.note');
    return T('level.' + lv.id + '.note');
  }

  function levelOf(id) { return E.levelById(id) || E.levelById('hunter'); }

  function starsFor(level, moves) {
    if (!level || !level.stars) return null;
    if (moves <= level.stars[0]) return 3;
    if (moves <= level.stars[1]) return 2;
    return 1;
  }

  /* Ключ рекорда: у классики это id уровня, у гона — конфигурация. */
  function recKey(lv) { return lv.rec || lv.id; }

  function chaseConfig() {
    var c = state.chase;
    return { size: c.size, foxes: c.foxes, every: c.every, count: c.count };
  }

  function chaseLevel() {
    var c = state.chase;
    var rec = 'chase:' + c.size + 'x' + c.foxes + ':' + (c.every || 0) + ':' + (c.every ? c.count : 1);
    var note = c.every
      ? (c.count === 'all'
        ? T('chase.note.all', { foxes: foxWord(c.foxes), every: movesWord(c.every) })
        : T('chase.note.count', { foxes: foxWord(c.count), every: movesWord(c.every) }))
      : T('chase.note.none');
    return {
      id: 'chase', rec: rec, title: T('mode.chase'),
      size: c.size, foxes: c.foxes, mode: 'sum',
      hints: 'hover', marks: true, board: true, stars: null,
      chase: c.every ? { every: c.every, count: c.count } : null,
      note: note
    };
  }

  /* МК-61: та же классика 10×10 на восемь лис, но без поля — индикатор и клавиши.
     Рекорд отдельный: на калькуляторе играть тяжелее, чем кликать по клеткам. */
  function mkLevel() {
    return {
      id: 'mk61', rec: 'mk61', title: T('mode.mk61'),
      size: 10, foxes: 8, mode: 'sum',
      hints: 'none', marks: false, board: false, stars: null, calc: true,
      note: T('mk61.note')
    };
  }

  function starsText(n) {
    if (n == null) return '';
    var out = '';
    for (var i = 0; i < 3; i++) out += i < n ? '★' : '☆';
    return out;
  }

  function levelStats(id) {
    return prefs.stats[id] || { plays: 0, wins: 0, forfeits: 0 };
  }

  /* ---------- язык интерфейса ---------- */

  function syncLangChrome() {
    var lang = I18N.lang();
    document.documentElement.lang = lang;
    document.title = T('meta.title');
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', T('meta.desc'));
    var btn = el('btn-lang');
    if (btn) {
      btn.textContent = T('btn.lang');
      btn.title = T('btn.lang.title');
      btn.setAttribute('aria-label', T('btn.lang.title'));
    }
  }

  /* Переключение языка: статика перерисовывается из словаря, партия
     пересобирается из заходов — иначе журнал и индикатор остались бы
     на прежнем языке. */
  function setLang(lang) {
    if (lang === I18N.lang()) return;
    prefs.lang = lang;
    savePrefs();
    I18N.set(lang);
    I18N.apply();
    paintLinks();
    syncLangChrome();
    buildLevelBar();
    fillChaseCount();
    applyLevelChrome();

    if (state.game && state.probes.length) {
      var moving = !state.game.over;
      state.game = rebuildGame(state.opts, state.probes);
      syncFromLog();
      if (moving && !state.startedAt) { /* таймер продолжится со следующего хода */ }
    } else if (state.level && state.level.calc) {
      calcReset();
    } else if (state.level) {
      setLCD('—', T(state.level.mode === 'binary' ? 'lcd.first.hint.binary' : 'lcd.first.hint'));
    }

    var lv = state.level;
    if (lv) {
      statTotal.textContent = '/' + state.game.totalFoxes;
      el('calc-lamp').textContent = T('calc.lamp', {
        found: state.game.foundTotal || 0, total: state.game.totalFoxes
      });
    }
    renderAll();
    updateStats();
    updateRecordLine();
    updateDailyLine();
    updateDuelLine();
    updateUndoBtn();
    markLevelBar();

    /* Открытые окна пересобираем: их содержимое собирается из данных
       и на прежнем языке осталось бы как есть. */
    if (!reviewModal.hidden) {
      var picked = reviewRows.indexOf(reviewPick);
      openReview();
      if (picked >= 0 && reviewRows[picked]) reviewShow(reviewRows[picked]);
    }
    if (!statsModal.hidden) openStats();
    if (!dailyModal.hidden) openDailyHistory();
    if (!shareModal.hidden) shareDuel();
    if (!winModal.hidden && state.lastWin) showWin(state.lastWin.record, state.lastWin.stars);

    toast(T('toast.lang'));
  }

  /* ---------- звук ---------- */

  var audio = null;

  function ensureAudio() {
    if (!prefs.sound) return null;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audio) audio = new Ctx();
    if (audio.state === 'suspended' && audio.resume) audio.resume();
    return audio;
  }

  function tone(freq, dur, delay, gain, type) {
    var ctx = ensureAudio();
    if (!ctx) return;
    var t0 = ctx.currentTime + (delay || 0);
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.04, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  var sfx = {
    key: function () { tone(420, 0.03, 0, 0.015, 'square'); },
    probe: function () { tone(680, 0.05, 0, 0.02, 'square'); },
    fox: function () {
      tone(760, 0.07, 0, 0.05, 'triangle');
      tone(1140, 0.11, 0.08, 0.05, 'triangle');
    },
    win: function () {
      [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.16, i * 0.1, 0.05, 'triangle'); });
    },
    error: function () { tone(170, 0.13, 0, 0.03, 'sawtooth'); }
  };

  /* ---------- уровни ---------- */

  function buildLevelBar() {
    levelBar.innerHTML = '';
    E.LEVELS.forEach(function (lv) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lv-btn';
      b.dataset.level = lv.id;
      b.title = T('level.bar.title', { note: levelNote(lv), moves: movesWord(lv.stars[0]) });

      var t = document.createElement('b');
      t.textContent = levelTitle(lv);
      var s = document.createElement('span');
      s.textContent = lv.size + '×' + lv.size + ' · ' + foxWord(lv.foxes);
      b.appendChild(t);
      b.appendChild(s);

      b.addEventListener('click', function () {
        if (state.level && state.level.id === lv.id) return;
        setLevel(lv.id, null);
      });
      levelBar.appendChild(b);
    });
  }

  function markLevelBar() {
    var btns = levelBar.querySelectorAll('.lv-btn');
    for (var i = 0; i < btns.length; i++) {
      var on = !!(state.level && btns[i].dataset.level === state.level.id);
      btns[i].classList.toggle('is-on', on);
      btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function setLevel(id, seed) {
    state.level = levelOf(id);
    state.mode = 'free';
    prefs.level = state.level.id;
    savePrefs();
    markLevelBar();
    newGame(seed);
  }

  /* Подсказки и заметки зависят от уровня; у гона своя панель, у МК-61 — клавиши. */
  function applyLevelChrome() {
    var lv = state.level;
    var chase = state.variant === 'chase';
    var calc = state.variant === 'mk61';

    levelBar.hidden = chase || calc;
    chaseBar.hidden = !chase;
    boardWrap.classList.toggle('is-blind', !lv.board && !calc);
    boardWrap.classList.toggle('is-calc', calc);
    calcPanel.hidden = !calc;
    toolsBox.hidden = calc;
    panelEl.classList.toggle('is-calc', calc);
    notesLegend.hidden = calc || !lv.marks;
    radarLegend.hidden = calc || lv.mode !== 'binary';
    /* В режиме радара на панели не «пеленг», а «радар»: число лис он не называет. */
    lcdLabel.textContent = T(lv.mode === 'binary' ? 'lcd.radar' : 'lcd.bearing');
    coordForm.hidden = calc;

    var lines = lv.hints !== 'none' && !calc;
    optLines.disabled = !lines;
    optLines.checked = lines && prefs.lines !== false;

    optNotes.disabled = (!lv.marks && lv.board) || calc;
    optNotes.checked = lv.marks && prefs.notes !== false && !calc;
    /* На уровне без подсветки лучей («Слепой») подсказка и автопометки выключены:
       иначе решатель делает всю дедукцию за игрока, и уровень теряет смысл. */
    var noHelpers = lv.hints === 'none';
    optAuto.disabled = !lv.board || noHelpers || calc;
    el('btn-hint').disabled = !lv.board || noHelpers || calc;
    el('btn-train').disabled = chase || calc;
    el('btn-train').title = chase ? T('train.no.chase') : (calc ? T('train.no.calc') : '');

    var footVars = { size: lv.size, foxes: foxWord(lv.foxes), note: levelNote(lv) };
    footLevel.textContent = calc ? T('foot.calc', footVars)
      : (chase ? T('foot.chase', footVars) : T('foot.classic', footVars));

    var hint = el('board-hint');
    if (calc) {
      hint.innerHTML = T('hint.calc');
    } else if (!lv.board) {
      hint.innerHTML = T('hint.blind');
    } else if (chase) {
      hint.innerHTML = T('hint.chase');
    } else if (lv.mode === 'binary') {
      hint.innerHTML = T('hint.radar');
    } else if (lv.hints === 'after') {
      hint.innerHTML = T('hint.after');
    } else {
      hint.innerHTML = T('hint.default') +
        (lv.marks ? ' <span class="hint-extra">' + T('hint.default.marks') + '</span>' : '');
    }
  }

  /* «Сколько» — от одной лисы до всего состава: список строится по числу лис,
     поэтому «3 лисы» при четырёх лисах в настройках не появится. */
  function fillChaseCount() {
    var foxes = Number(chaseFoxes.value) || 8;
    var cur = state.chase.count;
    var html = '';
    for (var k = 1; k <= foxes; k++) {
      html += '<option value="' + k + '">' + foxWord(k) + '</option>';
    }
    html += '<option value="all">' + T('chase.count.allOption', { foxes: foxWord(foxes) }) + '</option>';
    chaseCount.innerHTML = html;
    chaseCount.value = cur === 'all'
      ? 'all'
      : String(Math.max(1, Math.min(Number(cur) || 1, foxes)));
  }

  function syncChaseInputs() {
    var c = state.chase;
    chaseSize.value = String(c.size);
    chaseFoxes.value = String(c.foxes);
    chaseEvery.value = String(c.every || 0);
    fillChaseCount();
    chaseCount.disabled = !c.every;
  }

  function readChaseInputs() {
    var foxes = Number(chaseFoxes.value) || 8;
    var raw = chaseCount.value;
    var count = raw === 'all' ? 'all' : Math.max(1, Math.min(Number(raw) || 1, foxes));
    state.chase = {
      size: Number(chaseSize.value) || 10,
      foxes: foxes,
      every: Number(chaseEvery.value) || 0,
      count: count
    };
    fillChaseCount();
    chaseCount.disabled = !state.chase.every;
    prefs.chase = chaseConfig();
    savePrefs();
  }

  function setVariant(name) {
    state.variant = (name === 'chase' || name === 'mk61') ? name : 'classic';
    prefs.variant = state.variant;
    savePrefs();

    markVariantBar();

    state.mode = 'free';
    if (state.variant === 'chase') state.level = chaseLevel();
    else if (state.variant === 'mk61') state.level = mkLevel();
    else state.level = levelOf(prefs.level);
    newGame(null);
  }

  function markVariantBar() {
    var btns = variantBar.querySelectorAll('.variant-btn');
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].dataset.variant === state.variant;
      btns[i].classList.toggle('is-on', on);
      btns[i].setAttribute('aria-selected', on ? 'true' : 'false');
    }
  }

  /* ---------- решатель: подсказка, автопометки, разбор, печать ---------- */

  function movesShown() {
    var g = state.game;
    return g ? Math.max(0, g.moves - state.baseMoves) : 0;
  }

  function solverModel() {
    if (!state.game || !Solver) return null;
    return Solver.analyze(state.game);
  }

  function updateAutoMarks() {
    state.autoMarks.clear();
    if (!prefs.auto || !state.game || state.game.over) return;
    if (!state.level || !state.level.board) return;
    var model = solverModel();
    if (!model) return;
    var n = state.game.size;
    for (var r = 1; r <= n; r++) {
      for (var c = 1; c <= n; c++) {
        if (model.excluded(r, c)) state.autoMarks.add(key(r, c));
      }
    }
  }

  function refreshAuto() {
    updateAutoMarks();
    renderAll();
  }

  function showHint() {
    var g = state.game;
    if (!g || g.over) { toast(T('toast.over.new')); return; }
    if (!state.level.board) { toast(T('toast.hint.blind')); return; }

    var model = solverModel();
    var hint = model.hint();
    if (!hint) { toast(T('toast.hint.none')); return; }

    state.hint = hint;
    noteAssist('hint');
    renderAll();

    var coord = '<b>' + hint.r + '.' + hint.c + '</b>';
    hintLine.innerHTML = T(hint.kind === 'catch' ? 'hint.catchLine' : 'hint.bearingLine',
      { cell: coord }) + ' — ' + (hint.textKey ? T(hint.textKey, hint.textVars) : hint.text);

    if (hint.kind === 'catch') {
      setLCD('ЛИС?', T('lcd.hint.fox.here', { cell: coords(hint.r, hint.c) }), true);
    }
    sfx.probe();
  }

  function clearHint() {
    state.hint = null;
    hintLine.textContent = '';
  }

  function countWords(n) { return I18N.num(n, 'unit.cell'); }

  /* Ответ и оценку хода решатель отдаёт ключами: язык выбирает оболочка. */
  function reviewAnswer(row) {
    if (row.answerKey === 'lcd.fox') return T('lcd.fox', { left: row.remaining });
    if (row.answerKey === 'log.bearing') return T('log.bearing', { n: row.bearing });
    if (row.answerKey) return T(row.answerKey);
    return row.answer;
  }

  function reviewNote(row) {
    return row.noteKey ? T(row.noteKey) : row.note;
  }

  /* ---------- обучающий разбор: какие клетки вычеркнул ход ---------- */

  var reviewRows = [];
  var reviewPick = null;

  function reviewBuildBoard(n) {
    var board = el('review-board');
    board.innerHTML = '';
    board.style.setProperty('--n', String(n));
    for (var r = 1; r <= n; r++) {
      for (var c = 1; c <= n; c++) {
        var s = document.createElement('span');
        s.className = 'mb';
        s.dataset.r = String(r);
        s.dataset.c = String(c);
        board.appendChild(s);
      }
    }
  }

  /* Модель «до хода» и «после»; разница — то, что ход доказал. */
  function reviewDiff(g, row) {
    var before = Solver.analyze(g, row.index);
    var after = Solver.analyze(g, row.index + 1);
    var n = g.size, out = [], on = 0, off = 0, open = 0;

    var lines = row.type === 'fox' ? null : linesOf(g, row.r, row.c);
    for (var r = 1; r <= n; r++) {
      for (var c = 1; c <= n; c++) {
        var was = before.at(r, c).ub;
        var now = after.at(r, c).ub;
        var cut = was > 0 && now === 0;
        if (now > 0) open++;
        if (cut) {
          out.push([r, c]);
          if (lines && lines[r + ':' + c]) on++; else off++;
        }
      }
    }
    return { before: before, after: after, cells: out, on: on, off: off, open: open };
  }

  function linesOf(g, r, c) {
    var map = {};
    g.heardCells(r, c).forEach(function (p) { map[p[0] + ':' + p[1]] = 1; });
    return map;
  }

  function reviewWhy(g, row, d) {
    var res = g.log[row.index];
    var n = g.size;
    var cutSet = {};
    d.cells.forEach(function (p) { cutSet[p[0] + ':' + p[1]] = 1; });
    var probeCut = !!cutSet[row.r + ':' + row.c];
    var lineCut = Math.max(0, d.on - (probeCut ? 1 : 0));
    var offCut = d.off;
    var head = T('review.head', { move: row.moves, cell: coords(row.r, row.c) });
    var body = [];
    var total = n * n;
    var possibleBefore = total - d.before.countExcluded();

    function list(parts) {
      body = body.concat(parts.filter(Boolean));
      body.push(T('review.spots', { before: possibleBefore, after: d.open }));
      return { head: head, body: body.join(' ') };
    }

    if (res.type === 'fox') {
      head += T('review.fox.head');
      return list([
        T('review.fox.b1'),
        T('review.fox.b2', { foxes: d.after.U })
      ]);
    }

    var mode = g.mode;
    if (mode === 'binary') {
      head += res.bearing ? T('review.binary.fox.head') : T('review.binary.clear.head');
      if (res.bearing) {
        return list([
          probeCut ? T('review.binary.probeCut') : '',
          T('review.binary.nothing')
        ]);
      }
      return list([
        T('review.binary.allcut', { cells: countWords(d.cells.length) })
      ]);
    }

    if (mode === 'rays') {
      head += T('review.rays', {
        row: res.parts.row, col: res.parts.col, d1: res.parts.d1, d2: res.parts.d2
      });
    } else if (mode === 'rowcol') {
      head += T('review.rowcol', { row: res.parts.row, col: res.parts.col });
    } else {
      head += T('review.sum', { foxes: foxWord(res.bearing) });
    }

    return list([
      probeCut ? T('review.probeCut') : '',
      lineCut
        ? (mode === 'rays' || mode === 'rowcol'
          ? T('review.lineCut', { cells: countWords(lineCut) })
          : T('review.lineCut.n', { cells: countWords(lineCut), n: res.bearing }))
        : '',
      offCut ? T('review.offCut', { cells: countWords(offCut) }) : '',
      !lineCut && !offCut && !probeCut ? T('review.noCut') : ''
    ]);
  }

  function reviewShow(row) {
    var g = state.game;
    if (!g || !row) return;
    reviewPick = row;

    var d = reviewDiff(g, row);
    var cut = {};
    d.cells.forEach(function (p) { cut[p[0] + ':' + p[1]] = 1; });
    var lines = row.type === 'fox' ? {} : linesOf(g, row.r, row.c);

    var board = el('review-board');
    Array.prototype.forEach.call(board.children, function (cell) {
      var r = Number(cell.dataset.r), c = Number(cell.dataset.c);
      var k = cell.dataset.r + ':' + cell.dataset.c;
      var isProbe = r === row.r && c === row.c;
      var gone = !cut[k] && d.after.at(r, c).ub === 0;
      cell.className = 'mb' + (cut[k] ? ' is-cut' : (gone ? ' is-gone' : '')) +
        (isProbe ? ' is-probe' : '') + (lines[k] ? ' is-line' : '');
      var base = T('cell.aria', { row: r, col: c });
      cell.title = cut[k] ? T('cell.cut.now', { base: base })
        : (gone ? T('cell.cut.before', { base: base }) : base);
    });

    var words = reviewWhy(g, row, d);
    el('review-move').textContent = words.head;
    el('review-why').textContent = words.body;

    var trs = reviewTable.querySelectorAll('tbody tr');
    for (var i = 0; i < trs.length; i++) {
      trs[i].classList.toggle('is-picked', reviewRows[i] === row);
      trs[i].setAttribute('aria-selected', reviewRows[i] === row ? 'true' : 'false');
    }
    reviewNavUpdate();
  }

  /* ---------- проигрыватель разбора ---------- */

  var reviewTimer = null;

  function reviewNavUpdate() {
    var i = reviewRows.indexOf(reviewPick);
    var prev = el('review-prev'), next = el('review-next');
    prev.disabled = i <= 0;
    next.disabled = i < 0 || i >= reviewRows.length - 1;
    el('review-step').textContent = i < 0
      ? '—'
      : T('review.step', { n: i + 1, total: reviewRows.length });
  }

  function reviewStep(delta) {
    if (!reviewRows.length) return;
    var i = reviewRows.indexOf(reviewPick);
    if (i < 0) i = 0;
    i = Math.max(0, Math.min(reviewRows.length - 1, i + delta));
    reviewShow(reviewRows[i]);
  }

  function stopReviewPlay() {
    if (reviewTimer) {
      window.clearInterval(reviewTimer);
      reviewTimer = null;
    }
    var b = el('review-play');
    if (b) b.textContent = T('review.play');
  }

  function reviewPlayToggle() {
    if (reviewTimer) { stopReviewPlay(); return; }
    if (reviewRows.length < 2) return;

    var i = reviewRows.indexOf(reviewPick);
    if (i < 0 || i >= reviewRows.length - 1) reviewShow(reviewRows[0]);

    el('review-play').textContent = T('review.stop');
    reviewTimer = window.setInterval(function () {
      var at = reviewRows.indexOf(reviewPick);
      if (at >= reviewRows.length - 1) { stopReviewPlay(); return; }
      reviewShow(reviewRows[at + 1]);
    }, 900);
  }

  /* ---------- экспорт разбора ---------- */

  /* Скачивание идёт через data: URL, а не blob:. Политика CSP (default-src 'self')
     считает переход по blob: запрещённой навигацией, и файл молча не сохраняется —
     проверено: тост есть, файла нет. data: при той же политике проходит. */
  function downloadBlob(blob, name) {
    var reader = new FileReader();
    reader.onload = function () {
      var a = document.createElement('a');
      a.href = reader.result;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    reader.readAsDataURL(blob);
  }

  function reviewText() {
    var g = state.game, lv = state.level;
    var out = [];
    out.push(T('export.title'));
    out.push('');
    out.push(T('export.mode', { title: levelTitle(lv), note: levelNote(lv) }));
    out.push(T('export.head', {
      seed: String(g.seed).padStart(6, '0'), moves: movesShown(), time: fmtTime(state.elapsed),
      size: g.size, foxes: foxWord(g.totalFoxes)
    }));
    var total = reviewRows.reduce(function (a, b) { return a + b.bits; }, 0);
    out.push(T('export.info', { bits: total.toFixed(1) }));
    out.push('');

    reviewRows.forEach(function (row, i) {
      var d = reviewDiff(g, row);
      var w = reviewWhy(g, row, d);
      out.push(w.head);
      out.push('  ' + w.body);
      out.push('  ' + T('export.row', { bits: row.bits.toFixed(1), cells: d.cells.length, open: d.open }));
      out.push('');
    });
    out.push(T('export.legend'));
    return out.join('\n');
  }

  function exportReviewText() {
    if (!reviewRows.length) { toast(T('toast.review.empty')); return; }
    downloadBlob(new Blob([reviewText()], { type: 'text/plain;charset=utf-8' }),
      'lis-razbor-' + state.game.seed + '.txt');
    toast(T('toast.review.txt'));
  }

  /* Картинка-лист: по мини-полю на каждый ход, как контактный лист. */
  function exportReviewPng() {
    if (!reviewRows.length) { toast(T('toast.review.empty')); return; }
    var g = state.game, n = g.size;
    var box = 11, pad = 26, labelH = 40, gapX = 18, gapY = 10;
    var block = n * box;
    var cols = reviewRows.length >= 4 ? 4 : reviewRows.length;
    if (cols > 3 && block * 4 + 200 > Math.max(1200, innerWidth * 0.9)) cols = 3;
    var rowsCount = Math.ceil(reviewRows.length / cols);
    var colW = block + gapX;
    var rowH = block + labelH + gapY;
    var W = pad * 2 + cols * colW;
    var H = pad * 2 + 84 + rowsCount * rowH;

    var cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    var ctx = cv.getContext('2d');

    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e8eef2';
    ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText(T('export.title'), pad, pad + 18);
    ctx.fillStyle = '#8b98a3';
    ctx.font = '13px "Segoe UI", Arial, sans-serif';
    var total = reviewRows.reduce(function (a, b) { return a + b.bits; }, 0);
    ctx.fillText(T('export.png.head', {
      seed: String(g.seed).padStart(6, '0'), size: g.size, foxes: foxWord(g.totalFoxes),
      moves: movesShown(), bits: total.toFixed(1)
    }), pad, pad + 40);

    reviewRows.forEach(function (row, i) {
      var d = reviewDiff(g, row);
      var cut = {};
      d.cells.forEach(function (p) { cut[p[0] + ':' + p[1]] = 1; });

      var cx = pad + (i % cols) * colW;
      var cy = pad + 84 + Math.floor(i / cols) * rowH;

      ctx.fillStyle = '#cfd8de';
      ctx.font = '600 12px "Segoe UI", Arial, sans-serif';
      var head = (i + 1) + '. ' + row.r + '.' + row.c + ' → ' + reviewAnswer(row);
      ctx.fillText(head, cx, cy + 12);
      ctx.fillStyle = '#7f8b96';
      ctx.font = '11px "Segoe UI", Arial, sans-serif';
      ctx.fillText(T('export.png.row', { bits: row.bits.toFixed(1), cells: d.cells.length }), cx, cy + 27);

      var top = cy + labelH - 6;
      for (var r = 1; r <= n; r++) {
        for (var c = 1; c <= n; c++) {
          var k = r + ':' + c;
          var x = cx + (c - 1) * box;
          var y = top + (r - 1) * box;
          var open = d.after.at(r, c).ub > 0;
          if (cut[k]) ctx.fillStyle = '#7a5f24';
          else if (!open) ctx.fillStyle = '#161c22';
          else ctx.fillStyle = '#28343d';
          ctx.fillRect(x, y, box - 1, box - 1);
        }
      }

      /* точка пеленга — рамка */
      ctx.strokeStyle = '#e8c06a';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(cx + (row.c - 1) * box - 0.5, top + (row.r - 1) * box - 0.5, box - 0.5, box - 0.5);
    });

    ctx.fillStyle = '#5d6873';
    ctx.font = '11px "Segoe UI", Arial, sans-serif';
    ctx.fillText(T('export.png.legend'), pad, H - pad + 6);

    cv.toBlob(function (blob) {
      downloadBlob(blob, 'lis-razbor-' + g.seed + '.png');
      toast(T('toast.review.png'));
    }, 'image/png');
  }

  function openReview() {
    var g = state.game;
    if (!g) return;
    if (!g.log.length) { toast(T('toast.review.none')); return; }
    stopReviewPlay();

    var rows = Solver.review(g);
    reviewRows = rows;
    reviewPick = null;
    var body = reviewTable.querySelector('tbody');
    body.innerHTML = '';

    var weak = 0, best = null, bestBearing = null;
    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      if (!row.useful) { tr.className = 'is-weak'; weak++; }
      if (row.type === 'fox') tr.classList.add('is-fox');
      if (!best || row.bits > best.bits) best = row;
      if (row.type !== 'fox' && (!bestBearing || row.bits > bestBearing.bits)) bestBearing = row;

      [String(row.moves), coords(row.r, row.c), reviewAnswer(row),
        row.bits.toFixed(1), reviewNote(row)].forEach(function (text, i) {
        var td = document.createElement('td');
        td.textContent = text;
        if (i === 0 || i === 3) td.className = 'mono';
        tr.appendChild(td);
      });

      tr.tabIndex = 0;
      tr.setAttribute('role', 'button');
      tr.title = T('review.row.title');
      var pick = function () { reviewShow(row); };
      tr.addEventListener('click', pick);
      tr.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      });

      body.appendChild(tr);
    });

    var total = rows.reduce(function (a, b) { return a + b.bits; }, 0);
    var txt = T('review.sum.moves', { n: rows.length, bits: total.toFixed(1) });
    if (weak) txt += T('review.sum.weak', { n: weak });
    var top = bestBearing || best;
    if (top) {
      txt += T(bestBearing ? 'review.sum.bestBearing' : 'review.sum.best', {
        moves: top.moves, cell: coords(top.r, top.c), bits: top.bits.toFixed(1)
      });
    }
    reviewSummary.textContent = txt;

    reviewBuildBoard(g.size);
    var start = bestBearing || best || rows[0];
    if (start) reviewShow(start);
    else {
      el('review-move').textContent = T('review.none');
      el('review-why').textContent = '';
    }

    openModal(reviewModal, reviewModal.querySelector('[data-close]'));
  }

  /* Печатный бланк: поле, журнал и ключ для ведущего. */
  function buildPrint() {
    var g = state.game;
    if (!g) return;
    var n = g.size;
    printMeta.textContent = T('print.meta', {
      size: n, foxes: foxWord(g.totalFoxes), seed: String(g.seed).padStart(6, '0')
    }) + (state.variant === 'chase' ? T('print.meta.chase', { note: levelNote(state.level) }) : '');

    printGrid.innerHTML = '';
    printGrid.style.setProperty('--n', String(n + 1));
    var corner = document.createElement('span');
    corner.className = 'axis';
    printGrid.appendChild(corner);
    for (var c = 1; c <= n; c++) {
      var top = document.createElement('span');
      top.className = 'axis';
      top.textContent = String(c);
      printGrid.appendChild(top);
    }
    for (var r = 1; r <= n; r++) {
      var left = document.createElement('span');
      left.className = 'axis';
      left.textContent = String(r);
      printGrid.appendChild(left);
      for (var cc = 1; cc <= n; cc++) printGrid.appendChild(document.createElement('span'));
    }

    printKeyGrid.innerHTML = '';
    printKeyGrid.style.setProperty('--n', String(n + 1));
    var kc = document.createElement('span');
    kc.className = 'axis';
    printKeyGrid.appendChild(kc);
    for (var c2 = 1; c2 <= n; c2++) {
      var t2 = document.createElement('span');
      t2.className = 'axis';
      t2.textContent = String(c2);
      printKeyGrid.appendChild(t2);
    }
    for (var r2 = 1; r2 <= n; r2++) {
      var l2 = document.createElement('span');
      l2.className = 'axis';
      l2.textContent = String(r2);
      printKeyGrid.appendChild(l2);
      for (var c3 = 1; c3 <= n; c3++) {
        var s = document.createElement('span');
        var foxes = g.field[g.idx(r2, c3)];
        if (foxes > 0) {
          s.className = 'fox';
          s.textContent = foxes > 1 ? String(foxes) : '';
        }
        printKeyGrid.appendChild(s);
      }
    }

    var tbody = printLog.querySelector('tbody');
    tbody.innerHTML = '';
    var entries = g.log.filter(function (e) { return e.type !== 'move'; });
    var perRow = 12;
    var rowsN = Math.ceil(perRow);
    for (var i = 0; i < rowsN; i++) {
      var tr = document.createElement('tr');
      [1, 2].forEach(function (col) {
        var idx = i + (col === 1 ? 0 : rowsN);
        var cell = entries[idx];
        var num = document.createElement('td');
        num.textContent = cell ? String(cell.moves) : '';
        var coord = document.createElement('td');
        coord.textContent = cell ? cell.r + '.' + cell.c : '';
        var answer = document.createElement('td');
        if (cell) {
          answer.textContent = cell.type === 'fox' ? T('lcd.fox', { left: cell.remaining })
            : (cell.mode === 'binary' ? T(cell.bearing ? 'log.yes' : 'log.clear') : String(cell.bearing));
        }
        tr.appendChild(num); tr.appendChild(coord); tr.appendChild(answer);
      });
      tbody.appendChild(tr);
    }
  }

  /* Ровно один бланк за печать: классы взаимоисключающие, чтобы отменённый
     или не отработавший afterprint не оставил оба листа скрытыми. */
  function setPrintMode(mode) {
    document.body.classList.remove('print-mode-key');
    document.body.classList.remove('print-mode-blank');
    document.body.classList.add(mode);
  }

  function printSheetNow() {
    buildPrint();
    setPrintMode('print-mode-key');
    doPrint();
  }

  /* В Android-оболочке страница живёт во внутреннем WebView, и window.print()
     там молчит: печать идёт через мост AndroidApp.printPage(), который
     показывает системный диалог печати. В браузере — обычный window.print(). */
  function doPrint() {
    try {
      if (window.AndroidApp && typeof window.AndroidApp.printPage === 'function') {
        window.AndroidApp.printPage(document.title);
        return;
      }
    } catch (err) { /* моста нет — печатаем как в браузере */ }
    window.print();
  }

  /* Пустой бланк: поле без расстановки и пустой журнал. Нужен, когда поле
     на экране скрыто («Слепой») или когда играют в паре — охотник отмечает
     на листке, ведущий держит ключ (он печатается кнопкой «Печать»). */
  function buildBlank() {
    var g = state.game;
    var lv = state.level;
    var n = g ? g.size : (lv ? lv.size : 10);
    var foxes = g ? g.totalFoxes : (lv ? lv.foxes : 8);
    printBlankMeta.textContent = T('print.blank.meta', {
      size: n, foxes: foxWord(foxes), seed: g ? String(g.seed).padStart(6, '0') : '—'
    }) + ' · ' + T(lv && lv.calc ? 'print.blank.mk61' : 'print.blank.blank');

    printBlankGrid.innerHTML = '';
    printBlankGrid.style.setProperty('--n', String(n + 1));
    /* на 12×12 клетки мельче, иначе бланк не влезает в A4 по ширине */
    printBlankGrid.style.setProperty('--cell', n >= 12 ? '11mm' : '14mm');

    var corner = document.createElement('span');
    corner.className = 'axis';
    printBlankGrid.appendChild(corner);
    for (var c = 1; c <= n; c++) {
      var top = document.createElement('span');
      top.className = 'axis';
      top.textContent = String(c);
      printBlankGrid.appendChild(top);
    }
    for (var r = 1; r <= n; r++) {
      var left = document.createElement('span');
      left.className = 'axis';
      left.textContent = String(r);
      printBlankGrid.appendChild(left);
      for (var cc = 1; cc <= n; cc++) printBlankGrid.appendChild(document.createElement('span'));
    }

    var tbody = printBlankLog.querySelector('tbody');
    tbody.innerHTML = '';
    var rows = 24;
    for (var i = 1; i <= rows; i++) {
      var tr = document.createElement('tr');
      var num = document.createElement('td');
      num.textContent = String(i);
      var coord = document.createElement('td');
      coord.className = 'write';
      var answer = document.createElement('td');
      answer.className = 'write';
      tr.appendChild(num); tr.appendChild(coord); tr.appendChild(answer);
      tbody.appendChild(tr);
    }
  }

  function printBlankNow() {
    buildBlank();
    setPrintMode('print-mode-blank');
    doPrint();
  }

  /* После закрытия диалога печати бланк не должен оставаться выбранным:
     иначе следующая печать «Печать» уйдёт в режим пустого листа. */
  window.addEventListener('afterprint', function () {
    document.body.classList.remove('print-mode-key');
    document.body.classList.remove('print-mode-blank');
  });

  /* Тренировка: середина партии, где часть поля уже запеленгована.
     Ходы, сделанные до игрока, в счёт не идут и в журнал не попадают,
     но входят в историю заходов — иначе партию не восстановить. */
  function startTraining() {
    if (state.variant === 'chase') {
      toast(T('toast.train.chase'));
      return;
    }
    var lv = state.level;
    var opts = gameOptsFor(lv, null);
    var g = new E.Game(opts);
    var plan = Math.max(3, Math.round((lv.stars[0] || 20) * 0.45));
    var auto = [];

    for (var i = 0; i < plan && !g.over; i++) {
      var model = Solver.analyze(g);
      var hint = model.hint();
      if (!hint) break;
      var res = g.probe(hint.r, hint.c);
      if (res.type === 'bearing' || res.type === 'fox') auto.push([hint.r, hint.c]);
    }

    state.mode = 'training';
    startGame(lv, opts, auto, true);
    state.baseMoves = auto.length;
    updateUndoBtn();
    updateStats();
    saveSession();
    lv.calc ? calcReset() : null;
    setLCD('—', T('train.planned', { cells: countWords(auto.length) }));
    toast(T('train.toast', { cells: countWords(auto.length) }));
    if (!lv.calc) coordInput.focus({ preventScroll: true });
  }

  /* ---------- поле ---------- */

  function buildBoard(n) {
    boardEl.innerHTML = '';
    state.cells.clear();
    boardEl.style.setProperty('--n', String(n));
    boardEl.classList.toggle('is-dense', n >= 12);

    var frag = document.createDocumentFragment();
    var c, r, cc;

    var corner = document.createElement('div');
    corner.className = 'axis axis-corner';
    corner.setAttribute('aria-hidden', 'true');
    frag.appendChild(corner);

    for (c = 1; c <= n; c++) {
      var top = document.createElement('div');
      top.className = 'axis axis-top';
      top.textContent = String(c);
      top.setAttribute('aria-hidden', 'true');
      frag.appendChild(top);
    }

    for (r = 1; r <= n; r++) {
      var left = document.createElement('div');
      left.className = 'axis axis-left';
      left.textContent = String(r);
      left.setAttribute('aria-hidden', 'true');
      frag.appendChild(left);

      for (cc = 1; cc <= n; cc++) frag.appendChild(makeCell(r, cc));
    }

    boardEl.appendChild(frag);
  }

  function makeCell(r, c) {
    var cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.dataset.r = String(r);
    cell.dataset.c = String(c);
    cell.tabIndex = (r === 1 && c === 1) ? 0 : -1;
    cell.setAttribute('aria-label', T('cell.aria', { row: r, col: c }));
    cell.innerHTML =
      '<span class="v"></span>' +
      '<span class="fx">' + FOX_SVG + '<b class="cnt"></b></span>' +
      '<span class="mk" aria-hidden="true"></span>';

    var longFired = false;
    var pressTimer = 0;

    cell.addEventListener('click', function () {
      if (longFired) { longFired = false; return; }
      probe(r, c);
      cell.focus({ preventScroll: true });
    });

    cell.addEventListener('keydown', onCellKey);
    cell.addEventListener('focus', function () { previewLines(r, c); });
    cell.addEventListener('blur', clearPreview);

    cell.addEventListener('mouseenter', function () { previewLines(r, c); });
    cell.addEventListener('mouseleave', clearPreview);

    cell.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      if (!canMark()) { toast(T('toast.marks.off')); return; }
      cycleMark(r, c);
    });

    cell.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      longFired = false;
      pressTimer = window.setTimeout(function () {
        longFired = true;
        if (canMark()) cycleMark(r, c);
      }, 480);
    });

    var cancelPress = function () { window.clearTimeout(pressTimer); };
    cell.addEventListener('pointerup', cancelPress);
    cell.addEventListener('pointercancel', cancelPress);
    cell.addEventListener('pointerleave', cancelPress);

    state.cells.set(key(r, c), cell);
    return cell;
  }

  function onCellKey(e) {
    var n = state.game ? state.game.size : 10;
    var r = Number(e.currentTarget.dataset.r);
    var c = Number(e.currentTarget.dataset.c);
    var nr = r, nc = c;

    switch (e.key) {
      case 'ArrowUp': nr = Math.max(1, r - 1); break;
      case 'ArrowDown': nr = Math.min(n, r + 1); break;
      case 'ArrowLeft': nc = Math.max(1, c - 1); break;
      case 'ArrowRight': nc = Math.min(n, c + 1); break;
      case 'Home': nc = 1; break;
      case 'End': nc = n; break;
      default: return;
    }

    e.preventDefault();
    focusCell(nr, nc);
  }

  function focusCell(r, c) {
    var cell = state.cells.get(key(r, c));
    if (!cell) return;
    state.cells.forEach(function (x) { x.tabIndex = -1; });
    cell.tabIndex = 0;
    cell.focus();
  }

  function canPreview() {
    return !!state.game && !!state.level && state.level.hints === 'hover' && prefs.lines;
  }

  function previewLines(r, c) {
    if (!canPreview()) return;
    state.cells.forEach(function (cell) {
      cell.classList.remove('line');
      cell.classList.remove('line-preview');
    });
    state.game.heardCells(r, c).forEach(function (p) {
      var cell = state.cells.get(key(p[0], p[1]));
      if (cell) cell.classList.add('line-preview');
    });
  }

  function clearPreview() {
    state.cells.forEach(function (cell) { cell.classList.remove('line-preview'); });
    if (state.lastKey && prefs.lines) {
      var parts = state.lastKey.split(':');
      showLines(Number(parts[0]), Number(parts[1]));
    }
  }

  function showLines(r, c) {
    state.cells.forEach(function (cell) { cell.classList.remove('line'); });
    if (!prefs.lines || !state.level || state.level.hints === 'none') return;
    state.game.heardCells(r, c).forEach(function (p) {
      var cell = state.cells.get(key(p[0], p[1]));
      if (cell) cell.classList.add('line');
    });
  }

  function clearLines() {
    state.cells.forEach(function (cell) { cell.classList.remove('line'); });
  }

  /* ---------- отрисовка ---------- */

  function renderCell(r, c, animate) {
    var cell = state.cells.get(key(r, c));
    if (!cell) return;

    var g = state.game;
    var i = g.idx(r, c);
    var found = g.found[i];
    var res = state.results.get(key(r, c));
    var v = cell.querySelector('.v');
    var cnt = cell.querySelector('.cnt');
    var mk = cell.querySelector('.mk');
    var isLast = state.lastKey === key(r, c);
    var mark = state.marks.get(key(r, c));
    var auto = !mark && state.autoMarks.has(key(r, c));
    var isHint = !!state.hint && state.hint.r === r && state.hint.c === c;

    cell.classList.toggle('has-fox', found > 0);
    cell.classList.toggle('marked', !!mark || auto);
    cell.classList.toggle('marked-x', mark === 'x' || auto);
    cell.classList.toggle('auto-mark', auto);
    cell.classList.toggle('is-last', isLast);
    cell.classList.toggle('is-hint', isHint);
    cell.classList.toggle('is-stale', state.stale.has(key(r, c)));
    cell.classList.toggle('is-trail', state.trail === key(r, c));
    if (mk) mk.textContent = mark === 'x' ? '×' : (mark === 'q' ? '?' : (auto ? '×' : ''));

    if (res && res.bearing != null) {
      cell.classList.add('has-val');
      if (res.mode === 'binary') {
        /* «Радар»: значок вместо числа. «1» читалось как «одна лиса»,
           хотя ответ значит только «на лучах кто-то есть». */
        v.textContent = res.bearing ? '●' : '○';
        cell.dataset.radar = res.bearing ? '1' : '0';
        delete cell.dataset.n;
      } else {
        v.textContent = String(res.bearing);
        cell.dataset.n = String(Math.min(res.bearing, 5));
        delete cell.dataset.radar;
      }
    } else {
      v.textContent = '';
      cell.classList.remove('has-val');
      delete cell.dataset.n;
      delete cell.dataset.radar;
    }

    var revealed = cell.classList.contains('revealed');

    if (found > 0) {
      cnt.textContent = found > 1 ? String(found) : '';
      cell.setAttribute('aria-label', T('cell.aria.fox', { row: r, col: c, found: found }));
    } else {
      if (!revealed) cnt.textContent = '';
      cell.setAttribute('aria-label', res && res.bearing != null
        ? (res.mode === 'binary'
          ? T(res.bearing ? 'cell.aria.radar.on' : 'cell.aria.radar.off', { row: r, col: c })
          : T('cell.aria.bearing', { row: r, col: c, bearing: res.bearing }))
        : T('cell.aria', { row: r, col: c }));
    }

    if (animate) {
      cell.classList.remove('pop');
      void cell.offsetWidth;
      cell.classList.add('pop');
      window.setTimeout(function () { cell.classList.remove('pop'); }, 340);
    }
  }

  function renderAll() {
    var n = state.game.size;
    for (var r = 1; r <= n; r++) {
      for (var c = 1; c <= n; c++) renderCell(r, c, false);
    }
    if (state.lastKey) {
      var parts = state.lastKey.split(':');
      showLines(Number(parts[0]), Number(parts[1]));
    } else {
      clearLines();
    }
  }

  function canMark() {
    return !!(state.level && state.level.marks && prefs.notes);
  }

  function cycleMark(r, c) {
    var k = key(r, c);
    var cur = state.marks.get(k);
    if (!cur) state.marks.set(k, 'q');
    else if (cur === 'q') state.marks.set(k, 'x');
    else state.marks.delete(k);
    renderCell(r, c, false);
  }

  /* ---------- панель ---------- */

  function setLCD(value, note, isFox) {
    lcdValue.textContent = value;
    lcdNote.innerHTML = note;
    lcdBox.classList.toggle('is-fox', !!isFox);
    /* на телефоне панель пеленга уезжает под доску: короткая строка над полем
       показывает ответ там, где палец только что нажал */
    if (boardEcho) {
      var g = state.game;
      var cells = state.lastKey ? state.lastKey.split(':').slice(0, 2).join('.') : '';
      boardEcho.textContent = (cells ? cells + ' → ' + value + ' · ' : '') +
        T('echo.stats', { found: g.foundTotal, total: g.totalFoxes, moves: movesShown() });
      boardEcho.classList.toggle('is-fox', !!isFox);
    }
  }

  function updateStats() {
    var g = state.game;
    if (!g) return;
    statFound.textContent = String(g.foundTotal);
    statTotal.textContent = '/' + g.totalFoxes;
    statMoves.textContent = String(movesShown());
    statSeed.textContent = String(g.seed).padStart(6, '0');
    statTime.textContent = fmtTime(state.elapsed);
  }

  /* ---------- честная партия: помощь и повтор вне рекорда ---------- */

  /* Рекорд — это партия, сыгранная без помощи и по незнакомой расстановке.
     Подсказка, отмена хода, автопометки и повтор уже игранного номера партии
     дают знание, которого у честного игрока нет: с ними «открыл всех за 8 ходов»
     становится рекордом, который нельзя побить игрой. */

  var SEEN_LIMIT = 300;   /* сколько номеров партий помнить на уровень */

  function autoMarksOn() {
    return !!(prefs.auto && state.level && state.level.marks && state.level.board);
  }

  function outReasons() {
    var out = [];
    if (state.assist.hint) out.push(T('assist.hint'));
    if (state.assist.undo) out.push(T('assist.undo'));
    if (autoMarksOn()) out.push(T('assist.auto'));
    if (state.replay) out.push(T('assist.replay'));
    return out;
  }

  function outOfRecords() { return outReasons().length > 0; }

  /* Знакомые расстановки. Номер партии попадает в список на первом заходе —
     значит «открыл и ушёл» тоже расходует расстановку, и второй раз она уже
     не даёт рекорда. Память ограничена, чтобы prefs не росли бесконечно. */
  /* Ключ расстановки — поле и число лис: «Новичок» и «Экстрим» играют одну и ту же
     раскладку 8×8 из четырёх лис, разница только в ответе пеленгатора. Знание
     раскладки переезжает между уровнями, поэтому и память общая. */
  function layoutKey(lv) { return lv.size + 'x' + lv.foxes; }

  function seedPlayed(key2, seed) {
    var list = prefs.seen && prefs.seen[key2];
    return !!(list && list.indexOf(seed) >= 0);
  }

  function rememberSeed(key2, seed) {
    if (!prefs.seen) prefs.seen = {};
    var list = prefs.seen[key2] || [];
    if (list.indexOf(seed) < 0) list.push(seed);
    if (list.length > SEEN_LIMIT) list = list.slice(list.length - SEEN_LIMIT);
    prefs.seen[key2] = list;
  }

  function markSeedSeen() {
    if (state.seedSeen || !state.game || !state.level) return;
    if (state.mode === 'training') { state.seedSeen = true; return; }
    var key2 = layoutKey(state.level);
    state.replay = seedPlayed(key2, state.game.seed);
    rememberSeed(key2, state.game.seed);
    state.seedSeen = true;
    updateRecordLine();
  }

  function noteAssist(kind) {
    var was = outOfRecords();
    state.assist[kind] += 1;
    updateRecordLine();
    saveSession();
    if (!was && !wasQuiet()) toast(T('toast.assist.off'));
  }

  /* В тренировке, переигровке прошлого дня и на уровне без поля рекорд не пишется
     и так, поэтому лишний тост там только мешает. */
  function wasQuiet() {
    return state.mode === 'training' || archiveDaily() || !state.level || !state.level.board;
  }

  function updateRecordLine() {
    var lv = state.level;
    var key2 = recKey(lv);
    var best = prefs.best[key2];
    recMoves.textContent = best ? movesWord(best.moves) : '—';
    recPar.textContent = lv.stars ? movesWord(lv.stars[0]) : (lv.chase ? levelNote(lv) : '—');

    var out = outOfRecords() && !wasQuiet();
    recAssist.hidden = !out;
    if (out) recAssist.title = T('panel.assist.title', { what: outReasons().join(', ') });

    var st = levelStats(key2);
    var txt = T('statline', { plays: st.plays, wins: st.wins });
    if (st.forfeits) txt += T('statline.forfeits', { n: st.forfeits });
    statLine.textContent = txt;
  }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  /* Номер партии задачи дня: выводится из даты, поэтому задача одного дня
     одна и та же у всех и воспроизводится в любой день. */
  function dailySeed(day) {
    var s = (day || todayKey()) + '|hunter';
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % 1000000;
  }

  function archiveDaily() { return state.mode === 'daily' && !!state.dailyDate; }

  function updateDailyLine() {
    var d = prefs.daily;
    var txt;
    if (d && d.date === todayKey()) {
      txt = T('daily.today', {
        moves: movesWord(d.moves), stars: starsText(starsFor(levelOf('hunter'), d.moves))
      });
    } else {
      txt = T('daily.absent');
    }
    var hist = prefs.dailyHistory || {};
    var played = Object.keys(hist).length;
    var streak = dailyStreak();
    if (played) {
      txt += T('daily.tasks', { n: played }) +
        (streak > 1 ? T('daily.streak', { days: dayWord(streak) }) : '');
    }
    dailyLine.textContent = txt;
  }

  /* ---------- история задач дня ---------- */

  function dayKey(dt) {
    return dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate());
  }

  /* Серия: сколько дней подряд сыграно. Если сегодня ещё не играли,
     серия считается до вчерашнего дня и не обрывается на старте дня. */
  function dailyStreak() {
    var hist = prefs.dailyHistory || {};
    var d = new Date();
    if (!hist[dayKey(d)]) d.setDate(d.getDate() - 1);
    var n = 0;
    while (hist[dayKey(d)] && n < 400) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  function recordDaily(moves, seed, day) {
    var d = day || todayKey();
    if (!prefs.dailyHistory) prefs.dailyHistory = {};
    var prev = prefs.dailyHistory[d];
    if (!prev || moves < prev.moves) prefs.dailyHistory[d] = { moves: moves, seed: seed };
    var keys = Object.keys(prefs.dailyHistory).sort();
    while (keys.length > 120) delete prefs.dailyHistory[keys.shift()];
    var bestOfDay = prefs.dailyHistory[d];
    /* «Сегодня: …» в панели — только про сегодняшний день: переигровка
       прошлой задачи не должна переписывать сегодняшнюю строку. */
    if (d === todayKey()) prefs.daily = { date: d, moves: bestOfDay.moves, seed: seed };
  }

  function openDailyHistory() {
    var hist = prefs.dailyHistory || {};
    var days = Object.keys(hist).sort().reverse();
    var body = dailyTable.querySelector('tbody');
    body.innerHTML = '';

    if (!days.length) {
      var tr0 = document.createElement('tr');
      var td0 = document.createElement('td');
      td0.colSpan = 4;
      td0.textContent = T('daily.empty.row');
      tr0.appendChild(td0);
      body.appendChild(tr0);
      el('daily-stats').textContent = T('daily.empty');
    } else {
      days.forEach(function (day) {
        var e = hist[day];
        var tr = document.createElement('tr');
        if (day === todayKey()) tr.className = 'is-picked';
        [day, movesWord(e.moves), String(e.seed).padStart(6, '0')].forEach(function (text, i) {
          var td = document.createElement('td');
          td.textContent = text;
          if (i) td.className = 'mono';
          tr.appendChild(td);
        });
        var tdPlay = document.createElement('td');
        var btnPlay = document.createElement('button');
        btnPlay.type = 'button';
        btnPlay.className = 'btn tiny';
        btnPlay.textContent = T('daily.play');
        btnPlay.setAttribute('data-day', day);
        btnPlay.title = T('daily.play.title', { day: day });
        tdPlay.appendChild(btnPlay);
        tr.appendChild(tdPlay);
        body.appendChild(tr);
      });
      var best = days.reduce(function (a, day) { return Math.min(a, hist[day].moves); }, Infinity);
      var streak = dailyStreak();
      el('daily-stats').textContent = T('daily.sum', {
        days: String(days.length), best: movesWord(best), streak: dayWord(streak)
      });
    }

    openModal(dailyModal, el('btn-daily-today'));
  }

  /* ---------- итоги: рекорды и статистика всех режимов ---------- */

  /* «chase:8x4:3:2» → «Гон 8×8 · 4 лисы · через 3 хода · перебегают 2». */
  function chaseKeyTitle(key) {
    var p = String(key).split(':');
    var d = String(p[1] || '0x0').split('x');
    var size = Number(d[0]) || 0;
    var foxes = Number(d[1]) || 0;
    var every = Number(p[2] || 0);
    var count = p[3] || 'all';
    var t = T('chase.key.title', { size: size, foxes: foxWord(foxes) });
    t += every ? T('chase.key.every', { every: movesWord(every) }) : T('chase.key.none');
    t += count === 'all' ? T('chase.key.all') : T('chase.key.some', { count: count });
    return t;
  }

  function statsRow(key, title, stars) {
    var st = levelStats(key);
    var best = prefs.best[key] || null;
    return {
      key: key, title: title, stars: stars || null,
      plays: st.plays, wins: st.wins, forfeits: st.forfeits,
      moves: best ? best.moves : null,
      time: best ? best.time : null,
      seed: best ? best.seed : null,
      date: best ? best.date : null
    };
  }

  function statsRows() {
    var rows = [];
    E.LEVELS.forEach(function (lv) {
      var key = lv.rec || lv.id;
      var st = levelStats(key);
      if (st.plays || prefs.best[key]) rows.push(statsRow(key, levelTitle(lv) + ' · ' + levelNote(lv), lv.stars));
    });
    if (levelStats('mk61').plays || prefs.best.mk61) {
      rows.push(statsRow('mk61', T('stats.mk61'), null));
    }
    Object.keys(prefs.best || {}).concat(Object.keys(prefs.stats || {})).forEach(function (key) {
      if (key.indexOf('chase:') !== 0) return;
      if (rows.some(function (r) { return r.key === key; })) return;
      rows.push(statsRow(key, chaseKeyTitle(key), null));
    });
    return rows;
  }

  function statsDateText(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return dayKey(d);
  }

  function openStats() {
    var rows = statsRows();
    var body = statsTable.querySelector('tbody');
    body.innerHTML = '';
    statsTable.classList.toggle('is-empty', !rows.length);

    if (!rows.length) {
      var tr0 = document.createElement('tr');
      var td0 = document.createElement('td');
      td0.colSpan = 7;
      td0.textContent = T('stats.empty.row');
      tr0.appendChild(td0);
      body.appendChild(tr0);
      el('stats-summary').textContent = T('stats.empty');
    } else {
      rows.forEach(function (r) {
        var tr = document.createElement('tr');
        var cells = [
          r.title,
          String(r.plays),
          String(r.wins),
          r.forfeits ? String(r.forfeits) : '—',
          r.moves == null ? '—' : movesWord(r.moves),
          r.time == null ? '—' : fmtTime(r.time),
          r.seed == null ? '—' : String(r.seed).padStart(6, '0')
        ];
        cells.forEach(function (text, i) {
          var td = document.createElement('td');
          td.textContent = text;
          if (i) td.className = 'mono';
          tr.appendChild(td);
        });
        body.appendChild(tr);
      });

      var plays = rows.reduce(function (a, r) { return a + r.plays; }, 0);
      var wins = rows.reduce(function (a, r) { return a + r.wins; }, 0);
      var forfeits = rows.reduce(function (a, r) { return a + r.forfeits; }, 0);
      var bestRow = rows.reduce(function (a, r) {
        if (r.moves == null) return a;
        return (!a || r.moves < a.moves) ? r : a;
      }, null);
      var dailyDays = Object.keys(prefs.dailyHistory || {}).length;
      var txt = T('stats.sum', { modes: rows.length, plays: plays, wins: wins });
      if (forfeits) txt += T('stats.sum.forfeits', { n: forfeits });
      if (bestRow) {
        txt += T('stats.sum.best', {
          moves: movesWord(bestRow.moves), mode: bestRow.title.split(' ·')[0]
        });
      }
      if (dailyDays) txt += T('stats.sum.daily', { n: dailyDays });
      el('stats-summary').textContent = txt + '.';
    }

    openModal(statsModal, el('btn-stats-csv'));
  }

  function statsCsv() {
    var lines = [T('stats.csv.head')];
    statsRows().forEach(function (r) {
      lines.push([
        '"' + r.title.replace(/"/g, '""') + '"',
        r.plays, r.wins, r.forfeits,
        r.moves == null ? '' : r.moves,
        r.time == null ? '' : fmtTime(r.time),
        r.seed == null ? '' : String(r.seed).padStart(6, '0'),
        statsDateText(r.date)
      ].join(';'));
    });
    return lines.join('\r\n') + '\r\n';
  }

  function statsJson() {
    return JSON.stringify({
      app: T('stats.app'),
      version: 1,
      exportedAt: new Date().toISOString(),
      modes: statsRows(),
      best: prefs.best || {},
      stats: prefs.stats || {},
      daily: prefs.daily || null,
      dailyHistory: prefs.dailyHistory || {}
    }, null, 2);
  }

  function exportStatsCsv() {
    var text = statsCsv();
    /* BOM: без него Excel открывает русский CSV кракозябрами */
    downloadBlob(new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' }),
      'oxota-itogi-' + todayKey() + '.csv');
    toast(T('toast.stats.csv'));
  }

  function exportStatsJson() {
    downloadBlob(new Blob([statsJson()], { type: 'application/json;charset=utf-8' }),
      'oxota-itogi-' + todayKey() + '.json');
    toast(T('toast.stats.json'));
  }

  function bearingNote(res) {
    var p = res.parts || { row: 0, col: 0, d1: 0, d2: 0 };

    if (res.mode === 'binary') {
      return res.bearing ? T('lcd.binary.fox') : T('lcd.binary.clear');
    }
    if (res.mode === 'rays') {
      return T('lcd.rays', { row: p.row, col: p.col, d1: p.d1, d2: p.d2 });
    }
    if (res.mode === 'rowcol') {
      return T('lcd.rowcol', { row: p.row, col: p.col });
    }

    var cell = coords(res.r, res.c);
    var n = res.bearing;
    if (n === 0) return T('lcd.clear', { cell: cell });
    if (n === 1) return T('lcd.one', { cell: cell });
    return T('lcd.many', { foxes: foxWord(n), cell: cell });
  }

  function addLog(res) {
    var li = document.createElement('li');
    li.className = 'is-new' + (res.type === 'fox' ? ' is-fox' : '');
    var c = document.createElement('span');
    c.className = 'c';
    c.textContent = coords(res.r, res.c);
    var r = document.createElement('span');
    r.className = 'r';
    if (res.type === 'fox') {
      r.textContent = T('lcd.fox', { left: res.remaining });
    } else if (res.mode === 'binary') {
      r.textContent = T(res.bearing ? 'log.yes' : 'log.clear');
    } else if (res.mode === 'rays') {
      r.textContent = res.parts.row + '·' + res.parts.col + '·' + res.parts.d1 + '·' + res.parts.d2;
    } else if (res.mode === 'rowcol') {
      r.textContent = res.parts.row + '·' + res.parts.col;
    } else {
      r.textContent = T('log.bearing', { n: res.bearing });
    }
    li.appendChild(c);
    li.appendChild(r);
    logEl.prepend(li);
    while (logEl.children.length > 400) logEl.lastElementChild.remove();
    logCount.textContent = String(movesShown());
  }

  function clearLog() {
    logEl.innerHTML = '';
    logCount.textContent = '0';
  }

  /* ---------- ход ---------- */

  function probe(r, c) {
    var g = state.game;
    if (!g) return;
    if (g.over) {
      toast(T(g.won ? 'toast.over.replay' : 'toast.over'));
      return;
    }

    var res = g.probe(r, c);
    if (res.type !== 'fox' && res.type !== 'bearing') return;
    state.probes.push([r, c]);

    if (!state.startedAt) {
      state.startedAt = Date.now();
      startTimer();
    }

    markSeedSeen();
    state.results.set(key(r, c), res);
    state.stale.delete(key(r, c));
    state.trail = null;   /* след живёт ровно один заход */
    state.lastKey = key(r, c);

    renderAll();
    renderCell(r, c, true);
    addLog(res);
    tick();
    updateStats();
    clearHint();
    refreshAuto();

    if (res.type === 'fox') {
      setLCD(T('lcd.fox', { left: res.remaining }), res.remaining === 0
        ? T('lcd.fox.last')
        : T('lcd.fox.note', { left: res.remaining, total: g.totalFoxes }), true);
      sfx.fox();
    } else {
      var value = res.mode === 'binary'
        ? T(res.bearing ? 'bin.yes' : 'bin.no')
        : String(res.bearing);
      setLCD(value, bearingNote(res), false);
      sfx.probe();
    }

    if (res.moved) afterMove(res);
    if (state.level && state.level.calc) calcRender(res);
    updateDuelLine();
    saveSession();
    updateUndoBtn();

    if (res.win) finish();
  }

  /* ---------- МК-61: клавиши и индикатор ---------- */

  function calcSetInput(text) {
    state.calcInput = text;
    calcDigits.textContent = text || '—';
  }

  function calcReset() {
    calcSetInput('');
    calcAnswerEl.textContent = '—';
    calcNoteEl.textContent = T('calc.note');
    var g = state.game;
    calcLamp.textContent = T('calc.lamp', {
      found: g ? g.foundTotal : 0, total: g ? g.totalFoxes : 8
    });
  }

  /* Индикатор после захода: ответ там же, где его показал бы настоящий МК-61. */
  function calcRender(res) {
    var g = state.game;
    if (!g) return;
    calcLamp.textContent = T('calc.lamp', { found: g.foundTotal, total: g.totalFoxes });
    if (!res) return;
    if (res.type === 'fox') {
      calcAnswerEl.textContent = T('calc.answer.fox', { left: res.remaining });
      calcNoteEl.textContent = T('calc.note.fox', { left: res.remaining, total: g.totalFoxes });
    } else {
      calcAnswerEl.textContent = res.mode === 'binary'
        ? T(res.bearing ? 'calc.yes' : 'calc.no')
        : String(res.bearing);
      calcNoteEl.textContent = T('calc.note.move', { moves: res.moves });
    }
  }

  function calcPress(key) {
    if (key === 'c') { calcSetInput(''); return; }
    if (key === 'sp') { calcSubmit(); return; }
    if (key === '.') {
      if (state.calcInput.indexOf('.') === -1 && state.calcInput.length < 5) {
        calcSetInput(state.calcInput + '.');
      }
      return;
    }
    if (/^[0-9]$/.test(key) && state.calcInput.length < 5) calcSetInput(state.calcInput + key);
  }

  function calcSubmit() {
    var g = state.game;
    if (!g) return;
    var parsed = E.parseCoord(state.calcInput, g.size);
    if (!parsed) {
      calcScreen.classList.add('shake');
      calcNoteEl.textContent = T('calc.note.bad', { size: g.size });
      sfx.error();
      window.setTimeout(function () { calcScreen.classList.remove('shake'); }, 900);
      return;
    }
    if (g.over) {
      toast(T(g.won ? 'toast.over.replay' : 'toast.over'));
      return;
    }
    calcSetInput('');
    probe(parsed.r, parsed.c);
  }

  function calcModalOpen() {
    return !rulesModal.hidden || !reviewModal.hidden || !winModal.hidden || !shareModal.hidden ||
      !dailyModal.hidden || !statsModal.hidden;
  }

  function attemptInput() {
    var size = state.game ? state.game.size : E.SIZE;
    var parsed = E.parseCoord(coordInput.value, size);
    if (!parsed) {
      coordInput.classList.add('invalid');
      lcdBox.classList.add('shake');
      lcdNote.textContent = T('coord.bad.size', { size: size });
      sfx.error();
      window.setTimeout(function () {
        coordInput.classList.remove('invalid');
        lcdBox.classList.remove('shake');
      }, 900);
      coordInput.select();
      return null;
    }
    return parsed;
  }

  /* ---------- таймер ---------- */

  function startTimer() {
    stopTimer();
    state.timer = window.setInterval(tick, 250);
  }

  function stopTimer() {
    if (state.timer) {
      window.clearInterval(state.timer);
      state.timer = null;
    }
  }

  function tick() {
    var run = state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : 0;
    state.elapsed = state.timeBase + run;
    statTime.textContent = fmtTime(state.elapsed);
  }

  /* ---------- партия ---------- */

  function hashSeed() {
    var m = String(location.hash || '').match(/seed=(\d{1,7})/);
    return m ? Number(m[1]) : null;
  }

  function hashVs() {
    var m = String(location.hash || '').match(/[&#?]vs=(\d{1,4})/);
    var n = m ? Number(m[1]) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function seedFromHash() {
    var seed = hashSeed();
    if (seed != null) {
      var vs = hashVs();
      state.duel = vs ? { seed: seed, vs: vs } : null;
    }
    return seed;
  }

  /* Номер партии живёт в адресе; параметр vs остаётся, пока играем ту же партию. */
  function seedIntoHash(seed) {
    var tail = (state.duel && state.duel.seed === seed) ? '&vs=' + state.duel.vs : '';
    try { history.replaceState(null, '', '#seed=' + seed + tail); } catch (err) { /* file:// */ }
  }

  /* ---------- дуэль по номеру партии ---------- */

  function duelActive() {
    return !!(state.duel && state.game && state.duel.seed === state.game.seed);
  }

  function duelMoves() { return movesShown(); }

  function updateDuelLine() {
    if (!duelActive()) { duelLine.hidden = true; return; }
    var g = state.game, vs = state.duel.vs, mine = duelMoves();
    var txt = T('duel.line', { seed: String(g.seed).padStart(6, '0'), moves: movesWord(vs) });
    if (g.over && g.won) {
      txt += mine < vs ? T('duel.win', { mine: mine })
        : (mine === vs ? T('duel.draw', { mine: mine }) : T('duel.more', { mine: mine, diff: mine - vs }));
    } else if (mine >= vs) {
      txt += T('duel.behind', { mine: mine });
    } else {
      txt += T('duel.ahead', { mine: mine, vs: vs });
    }
    duelLine.textContent = txt;
    duelLine.hidden = false;
    duelLine.classList.toggle('is-lost', !!(g.over && g.won && mine > vs));
  }

  /* В Android-оболочке адрес страницы внутренний
     (appassets.androidplatform.net): такой ссылкой делиться нельзя — у получателя
     она не откроется. Для дуэли в APK берём публичный адрес игры. */
  var PUBLIC_BASE = 'https://alexsey111.github.io/fox-hunt-1990/';

  function duelBase() {
    var href = String(location.href);
    if (href.indexOf('appassets.androidplatform.net') >= 0 || href.indexOf('file:') === 0) {
      return PUBLIC_BASE;
    }
    return href.split('#')[0];
  }

  function duelLink(seed, moves) {
    return duelBase() + '#seed=' + seed + (moves ? '&vs=' + moves : '');
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; },
        function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    ta.remove();
    return ok;
  }

  function shareDuel() {
    var g = state.game;
    if (!g) return;
    var mine = duelMoves();
    var link = mine > 0 ? duelLink(g.seed, mine) : duelLink(g.seed);
    var note = mine > 0
      ? T('share.note.norm', { seed: String(g.seed).padStart(6, '0'), moves: movesWord(mine) })
      : T('share.note.none', { seed: String(g.seed).padStart(6, '0') });

    /* На телефоне уместнее системное «Поделиться»: там сразу мессенджеры
       и почта, а не копирование в буфер. */
    if (window.AndroidApp && typeof window.AndroidApp.share === 'function') {
      try {
        window.AndroidApp.share(note + ' ' + link);
        return;
      } catch (err) { /* мост не ответил — показываем окно со ссылкой */ }
    }

    shareLink.value = link;
    shareNote.textContent = note;
    openModal(shareModal, el('btn-copy'));
    shareLink.select();

    copyText(link).then(function (ok) {
      if (ok) {
        shareNote.textContent += T('share.copied');
      } else {
        shareNote.textContent += T('share.nocopy');
      }
    });
  }

  function copyShareLink() {
    shareLink.select();
    copyText(shareLink.value).then(function (ok) {
      toast(ok ? T('toast.copy.ok') : T('toast.copy.manual'));
    });
  }

  /* ---------- сборка партии, отмена хода, продолжение ---------- */

  function gameOptsFor(lv, seed) {
    var opts = {
      seed: seed == null ? ((Math.random() * 1000000) | 0) : seed,
      size: lv.size, foxes: lv.foxes, mode: lv.mode
    };
    if (lv.chase) opts.chase = lv.chase;
    return opts;
  }

  /* Партия восстанавливается проигрыванием заходов с начала: движок
     детерминирован по сиду, поэтому поле, стопки и перебежки совпадают
     с исходными. Так работают и отмена хода, и продолжение партии. */
  function rebuildGame(opts, probes) {
    var g = new E.Game(opts);
    for (var i = 0; i < probes.length && !g.over; i++) {
      g.probe(probes[i][0], probes[i][1]);
    }
    return g;
  }

  /* Всё, что выводится из журнала, пересобирается заново: числа на поле,
     потускневшие клетки, журнал, индикатор и последняя отметка. */
  function syncFromLog() {
    var g = state.game, i, e, last = null, lastMove = -1;
    if (!g) return;

    for (i = 0; i < g.log.length; i++) if (g.log[i].type === 'move') lastMove = i;

    state.results.clear();
    state.stale.clear();
    for (i = 0; i < g.log.length; i++) {
      e = g.log[i];
      if (e.type !== 'bearing' && e.type !== 'fox') continue;
      state.results.set(key(e.r, e.c), e);
      if (i < lastMove) state.stale.add(key(e.r, e.c));
      last = e;
    }
    state.trail = null;
    state.hint = null;
    state.lastKey = last ? key(last.r, last.c) : null;

    clearLog();
    /* Журнал в разметке новый сверху, а addLog делает prepend — значит
       проходим события в хронологическом порядке, от первого к последнему. */
    for (i = 0; i < g.log.length; i++) {
      e = g.log[i];
      if (e.type === 'bearing' || e.type === 'fox') {
        addLog(e);
      } else if (e.type === 'move') {
        var n = e.moved.length;
        var who = n === 1 ? T('move.one')
          : (e.all ? T('move.all') : T('move.some', { foxes: foxWord(n) }));
        var where = n <= 3
          ? T('move.from', { cells: e.moved.map(function (m) { return coords(m.fr, m.fc); }).join(', ') })
          : '';
        addMoveLog(who + where + T('move.tail'));
      }
    }

    if (last) {
      if (last.type === 'fox') {
        setLCD(T('lcd.fox', { left: last.remaining }),
          T('lcd.fox.note', { left: last.remaining, total: g.totalFoxes }), true);
      } else {
        setLCD(last.mode === 'binary' ? T(last.bearing ? 'calc.yes' : 'calc.no') : String(last.bearing),
          T('lcd.moveNote', { moves: last.moves, note: bearingNote(last) }), false);
      }
      if (state.level && state.level.calc) calcRender(last);
    } else {
      setLCD('—', T(state.level && state.level.mode === 'binary' ? 'lcd.first.hint.binary' : 'lcd.first.hint'));
      if (state.level && state.level.calc) calcReset();
    }

    renderAll();
    updateUndoBtn();
  }

  function startGame(lv, opts, probes, quiet) {
    stopTimer();
    clearTimeout(state.winTimer);

    state.level = lv;
    state.opts = opts;
    state.dailyDate = null;
    state.probes = (probes || []).slice();
    state.game = state.probes.length ? rebuildGame(opts, state.probes) : new E.Game(opts);

    state.results.clear();
    state.marks.clear();
    state.autoMarks.clear();
    state.stale.clear();
    state.trail = null;
    state.hint = null;
    state.assist = { hint: 0, undo: 0 };
    state.replay = false;
    state.seedSeen = false;
    state.baseMoves = 0;
    state.lastKey = null;
    state.startedAt = 0;
    state.elapsed = 0;
    state.timeBase = 0;
    state.giveUpArmed = 0;

    applyLevelChrome();
    if (state.cells.size !== lv.size * lv.size) buildBoard(lv.size);

    resetGiveUp();
    boardWrap.classList.remove('is-over');
    lcdBox.classList.remove('is-fox');
    clearLog();
    closeModal(winModal);

    state.cells.forEach(function (cell) {
      cell.classList.remove('revealed');
      var cnt = cell.querySelector('.cnt');
      if (cnt) cnt.textContent = '';
    });

    coordInput.value = '';
    coordInput.classList.remove('invalid');

    seedIntoHash(state.game.seed);

    if (state.probes.length) {
      /* продолжаем партию: числа, журнал и индикатор берём из журнала ходов */
      syncFromLog();
    } else {
      setLCD('—', T(lv.mode === 'binary' ? 'lcd.first.hint.binary' : 'lcd.first.hint'));
      if (lv.calc) calcReset();
    }

    renderAll();
    clearHint();
    optAuto.checked = !!prefs.auto;
    refreshAuto();
    updateStats();
    updateRecordLine();
    updateDailyLine();
    markLevelBar();
    updateUndoBtn();

    if (lv.calc) {
      if (!quiet) calcReset();
    } else if (!quiet) {
      coordInput.focus({ preventScroll: true });
    }

    if (state.duel && state.duel.seed !== state.game.seed) state.duel = null;
    updateDuelLine();
    saveSession();
  }

  function newGame(seed) {
    var lv = state.variant === 'chase' ? chaseLevel() : (state.level || levelOf(prefs.level));
    if (state.variant === 'mk61') lv = mkLevel();
    startGame(lv, gameOptsFor(lv, seed), []);
  }

  function updateUndoBtn() {
    var g = state.game;
    var floor = state.mode === 'training' ? state.baseMoves : 0;
    btnUndo.disabled = !(g && !g.over && state.probes.length > floor);
  }

  /* Отмена последнего захода. Партия пересобирается проигрыванием всех
     заходов, кроме последнего, — иначе пришлось бы хранить снимки поля. */
  function undoMove() {
    var g = state.game;
    if (!g) return;
    if (g.over) { toast(T('toast.over.undo')); return; }
    var floor = state.mode === 'training' ? state.baseMoves : 0;
    if (state.probes.length <= floor) { toast(T('toast.undo.none')); return; }

    state.probes.pop();
    state.game = rebuildGame(state.opts, state.probes);
    stopTimer();
    state.timeBase = state.elapsed;
    state.startedAt = 0;
    state.giveUpArmed = 0;
    resetGiveUp();

    syncFromLog();
    tick();
    noteAssist('undo');
    updateStats();
    updateDuelLine();
    saveSession();
    toast(T('toast.undo.done', { moves: movesShown() }));
  }

  /* ---------- продолжение партии после закрытия вкладки ---------- */

  function saveSession() {
    var g = state.game;
    if (!g) return;
    if (g.over || !state.probes.length) {
      if (prefs.session) { prefs.session = null; savePrefs(); }
      return;
    }
    prefs.session = {
      v: 1,
      variant: state.variant,
      levelId: state.level.id,
      chase: state.variant === 'chase' ? chaseConfig() : null,
      mode: state.mode,
      day: state.dailyDate || null,
      baseMoves: state.baseMoves,
      opts: state.opts,
      probes: state.probes,
      assist: { hint: state.assist.hint, undo: state.assist.undo },
      replay: !!state.replay,
      seedSeen: !!state.seedSeen,
      elapsed: state.elapsed,
      savedAt: Date.now()
    };
    savePrefs();
  }

  function sessionOk(s) {
    if (!s || s.v !== 1 || !s.opts || !Array.isArray(s.probes) || !s.probes.length) return false;
    if (s.probes.length > 4000) return false;
    var size = s.opts.size;
    if (size !== 8 && size !== 10 && size !== 12) return false;
    for (var i = 0; i < s.probes.length; i++) {
      var p = s.probes[i];
      if (!p || !Array.isArray(p)) return false;
      if (p[0] < 1 || p[0] > size || p[1] < 1 || p[1] > size) return false;
    }
    if (s.mode === 'daily' && s.opts.seed !== dailySeed(s.day || todayKey())) return false;
    return true;
  }

  function restoreSession(s) {
    state.variant = s.variant === 'chase' ? 'chase' : (s.variant === 'mk61' ? 'mk61' : 'classic');
    prefs.variant = state.variant;
    markVariantBar();

    var lv;
    if (state.variant === 'chase') {
      if (s.chase) state.chase = s.chase;
      syncChaseInputs();
      lv = chaseLevel();
    } else if (state.variant === 'mk61') {
      lv = mkLevel();
    } else {
      lv = levelOf(s.levelId);
    }
    state.mode = s.mode === 'daily' || s.mode === 'training' ? s.mode : 'free';

    startGame(lv, s.opts, s.probes, true);
    if (s.assist) {
      /* Помощь переживает перезапуск страницы: иначе «отменил, закрыл вкладку,
         продолжил» стирало бы отметку и партия снова шла бы в рекорд. */
      state.assist = { hint: Number(s.assist.hint) || 0, undo: Number(s.assist.undo) || 0 };
    }
    state.replay = !!s.replay;
    state.seedSeen = !!s.seedSeen;
    state.baseMoves = s.baseMoves || 0;
    if (state.mode === 'daily' && s.day) state.dailyDate = s.day;
    state.timeBase = s.elapsed || 0;
    state.elapsed = state.timeBase;
    tick();
    updateStats();
    /* Значок «вне рекорда» и строка рекорда зависят от помощи, а она пришла
       из сессии уже после startGame — перерисовываем строку ещё раз. */
    updateRecordLine();
    updateUndoBtn();
    updateDuelLine();
    saveSession();
  }

  function finish() {
    var g = state.game;
    var lv = state.level;
    var training = state.mode === 'training';
    var archive = state.mode === 'daily' && !!state.dailyDate;
    var key2 = recKey(lv);
    stopTimer();
    tick();
    boardWrap.classList.add('is-over');

    /* Помощь и знакомый номер партии дают знание, которого у честной игры нет:
       звёзд за такую партию не выдаём, рекорд не пишем. Статистика партий и
       побед считается как обычно — партия состоялась. */
    var out = outOfRecords();
    var stars = out ? null : starsFor(lv, movesShown());
    var isRecord = false;

    if (!training) {
      if (!archive) {
        var st = levelStats(key2);
        st.plays += 1;
        st.wins += 1;
        prefs.stats[key2] = st;

        var prev = prefs.best[key2];
        isRecord = !out && (!prev || movesShown() < prev.moves);
        if (isRecord) {
          prefs.best[key2] = {
            moves: movesShown(), time: state.elapsed, seed: g.seed,
            date: new Date().toISOString()
          };
        }
      }
      if (state.mode === 'daily' && !out) {
        recordDaily(movesShown(), g.seed, state.dailyDate || todayKey());
      }
      savePrefs();
      updateRecordLine();
      updateDailyLine();
      state.winTimer = window.setTimeout(function () { showWin(isRecord, stars); }, 850);
    } else {
      state.winTimer = window.setTimeout(function () { showWin(false, stars); }, 850);
    }

    updateStats();
    sfx.win();
    updateDuelLine();
    prefs.session = null;
    savePrefs();
    updateUndoBtn();
  }

  /* Рекорд авторов игры 1990 года: 19 ходов на классическом поле 10 × 10. */
  function levelRecordByAuthors(lv, moves) {
    return !!lv && lv.id === 'hunter' && moves <= AUTHOR_MOVES;
  }

  /* Текст под звёздами. Отдельная функция, потому что у этого абзаца пять ветвей
     и его надо уметь проверять, не доигрывая партию до победы. */
  function winNote(isRecord, best, lv, moves) {
    if (archiveDaily()) return T('win.note.archive', { day: state.dailyDate });
    if (state.mode === 'training') return T('win.note.training');
    if (state.variant === 'chase') {
      return isRecord ? T('win.note.chase.new') : T('win.note.chase.old', { moves: movesWord(best.moves) });
    }
    if (lv.calc) {
      return isRecord ? T('win.note.calc.new')
        : T('win.note.calc.old', { moves: movesWord(best.moves), seed: String(best.seed).padStart(6, '0') });
    }
    if (isRecord) {
      return levelRecordByAuthors(lv, moves)
        ? T('win.note.record.authors')
        : T('win.note.record', { moves: movesWord(lv.stars[0]) });
    }
    if (moves === best.moves) {
      /* Рекорд авторов — отдельная веха: 19 ходов остаются 19 ходами,
         даже когда личный рекорд уже равен им или лучше. */
      return levelRecordByAuthors(lv, moves) ? T('win.note.repeat.authors') : T('win.note.repeat');
    }
    var note = T('win.note.best', {
      moves: movesWord(best.moves), seed: String(best.seed).padStart(6, '0')
    });
    return levelRecordByAuthors(lv, moves) ? note + T('win.note.best.authors') : note;
  }

  function showWin(isRecord, stars) {
    var g = state.game;
    var lv = state.level;

    el('win-title').textContent = T('win.title.foxes', { foxes: foxWord(g.totalFoxes) });
    el('win-moves').textContent = String(movesShown());
    el('win-time').textContent = fmtTime(state.elapsed);

    var best = prefs.best[recKey(lv)];
    el('win-record').textContent = best ? String(best.moves) : '—';

    var starsEl = el('win-stars');
    starsEl.innerHTML = '';
    starsEl.hidden = stars == null;
    if (stars != null) {
      for (var i = 0; i < 3; i++) {
        var s = document.createElement('span');
        s.className = 'star' + (i < stars ? ' on' : '');
        s.textContent = '★';
        starsEl.appendChild(s);
      }
      starsEl.setAttribute('aria-label', T('stars.rating', { stars: stars }));
    }

    var out = outOfRecords();
    var note = out ? T('win.note.out', { what: outReasons().join(', ') })
      : winNote(isRecord, best, lv, movesShown());
    if (!out && state.mode === 'daily' && !archiveDaily()) note = T('win.note.daily', { day: todayKey() }) + note;
    if (!out && duelActive()) {
      var mine = movesShown(), vs = state.duel.vs;
      note += mine < vs ? T('win.note.duel.win', { vs: vs, mine: mine })
        : (mine === vs ? T('win.note.duel.draw', { vs: vs })
          : T('win.note.duel.lose', { vs: vs, mine: mine }));
    }
    state.lastWin = { record: isRecord, stars: stars };
    el('win-note').textContent = note;
    el('btn-win-look').textContent = lv.calc ? T('btn.winLook.calc') : T('btn.winLook');

    openModal(winModal, el('btn-again'));
  }

  function giveUp() {
    var g = state.game;
    if (!g || g.over) { toast(T('toast.over.already')); return; }

    if (!state.giveUpArmed) {
      state.giveUpArmed = Date.now();
      btnGiveUp.textContent = T('btn.giveup.armed');
      window.setTimeout(function () {
        if (state.giveUpArmed && Date.now() - state.giveUpArmed >= 3900) resetGiveUp();
      }, 4000);
      return;
    }

    resetGiveUp();
    var left = g.forfeit();
    stopTimer();
    boardWrap.classList.add('is-over');
    clearLines();
    state.lastKey = null;

    var st = levelStats(recKey(state.level));
    st.plays += 1;
    st.forfeits += 1;
    prefs.stats[recKey(state.level)] = st;
    savePrefs();
    updateRecordLine();
    prefs.session = null;
    savePrefs();
    updateUndoBtn();

    left.forEach(function (spot) {
      var cell = state.cells.get(key(spot.r, spot.c));
      if (!cell) return;
      cell.classList.add('revealed', 'has-fox');
      var cnt = cell.querySelector('.cnt');
      cnt.textContent = String(spot.foxes);
      cell.setAttribute('aria-label', T('cell.aria.foxes', { row: spot.r, col: spot.c, foxes: foxWord(spot.foxes) }));
    });

    var totalLeft = left.reduce(function (a, b) { return a + b.foxes; }, 0);
    setLCD('—', T('giveup.revealed', { foxes: foxWord(totalLeft) }));
    toast(T('toast.giveup', { foxes: foxWord(totalLeft) }));
  }

  function resetGiveUp() {
    state.giveUpArmed = 0;
    btnGiveUp.textContent = T('btn.giveup');
  }

  /* ---------- модальные окна и тосты ---------- */

  function openModal(modal, focusTarget) {
    modal.hidden = false;
    var target = focusTarget || modal.querySelector('.x');
    if (target) window.setTimeout(function () { target.focus(); }, 20);
  }

  function closeModal(modal) {
    modal.hidden = true;
    if (modal === reviewModal) stopReviewPlay();
  }

  document.querySelectorAll('.modal').forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal(modal);
    });
    modal.querySelectorAll('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { closeModal(modal); });
    });
  });

  function toast(text) {
    toastEl.textContent = text;
    toastEl.hidden = false;
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(function () { toastEl.hidden = true; }, 2600);
  }

  /* ---------- оформление ---------- */

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('.seg-btn').forEach(function (btn) {
      var on = btn.dataset.theme === theme;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    prefs.theme = theme;
    savePrefs();
  }

  function setSound(on) {
    prefs.sound = !!on;
    btnSound.setAttribute('aria-pressed', on ? 'true' : 'false');
    savePrefs();
    if (on) { sfx.probe(); }
  }

  /* ---------- события ---------- */

  coordForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var parsed = attemptInput();
    if (!parsed) return;
    probe(parsed.r, parsed.c);
    coordInput.value = '';
    coordInput.focus({ preventScroll: true });
  });

  coordInput.addEventListener('input', function () {
    coordInput.classList.remove('invalid');
  });

  btnSound.addEventListener('click', function () { setSound(!prefs.sound); });

  /* Клавиши МК-61: мышь и тач — через делегирование, клавиатура — в общем keydown. */
  calcKeys.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-key]') : null;
    if (!btn) return;
    sfx.key();
    calcPress(btn.dataset.key);
  });

  optLines.addEventListener('change', function () {
    prefs.lines = optLines.checked;
    savePrefs();
    if (!prefs.lines) { clearLines(); clearPreview(); }
    else if (state.lastKey) {
      var p = state.lastKey.split(':');
      showLines(Number(p[0]), Number(p[1]));
    }
  });

  optNotes.addEventListener('change', function () {
    prefs.notes = optNotes.checked;
    savePrefs();
    if (!prefs.notes) {
      state.marks.clear();
      renderAll();
    }
  });

  document.querySelectorAll('.seg-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { setTheme(btn.dataset.theme); });
  });

  el('btn-rules').addEventListener('click', function () { openModal(rulesModal); });
  el('btn-lang').addEventListener('click', function () { setLang(I18N.lang() === 'ru' ? 'en' : 'ru'); });
  el('btn-new').addEventListener('click', function () { state.mode = 'free'; newGame(); });
  el('btn-replay').addEventListener('click', function () {
    var seed = state.game ? state.game.seed : null;
    state.mode = 'free';
    newGame(seed);
    toast(T('toast.replay.same', { seed: String(seed).padStart(6, '0') }));
  });

  btnGiveUp.addEventListener('click', giveUp);
  btnUndo.addEventListener('click', undoMove);
  btnShare.addEventListener('click', shareDuel);
  el('btn-copy').addEventListener('click', copyShareLink);

  /* Ссылку можно вставить в адресную строку без перезагрузки страницы. */
  window.addEventListener('hashchange', function () {
    var seed = hashSeed();
    if (seed == null) return;
    if (!state.game || seed !== state.game.seed) {
      state.mode = 'free';
      newGame(seedFromHash());
      toast(T('toast.replay.link', { seed: String(seed).padStart(6, '0') }));
      return;
    }
    var vs = hashVs();
    state.duel = vs ? { seed: seed, vs: vs } : null;
    updateDuelLine();
  });

  el('btn-again').addEventListener('click', function () {
    closeModal(winModal);
    state.mode = 'free';
    newGame();
  });

  el('btn-same').addEventListener('click', function () {
    var seed = state.game ? state.game.seed : null;
    closeModal(winModal);
    newGame(seed);
  });

  el('btn-win-review').addEventListener('click', function () {
    closeModal(winModal);
    openReview();
  });

  /* Задача дня: сегодняшняя или за прошлую дату. Прошлый день даётся
     переиграть, но в рекорды уровня и общую статистику он не идёт. */
  function startDaily(day) {
    var d = day || todayKey();
    if (state.variant !== 'classic') {
      state.variant = 'classic';
      prefs.variant = 'classic';
      savePrefs();
      markVariantBar();
    }
    if (!state.level || state.level.id !== 'hunter') {
      state.level = levelOf('hunter');
      markLevelBar();
    }
    state.mode = 'daily';
    var seed = dailySeed(d);
    newGame(seed);
    state.dailyDate = d === todayKey() ? null : d;
    toast(T('toast.daily', { day: d, seed: String(seed).padStart(6, '0') }) +
      (state.dailyDate ? T('toast.daily.archive') : ''));
  }

  el('btn-daily').addEventListener('click', function () { startDaily(); });

  el('btn-hint').addEventListener('click', showHint);
  el('btn-review').addEventListener('click', openReview);
  el('btn-review-txt').addEventListener('click', exportReviewText);
  el('btn-review-png').addEventListener('click', exportReviewPng);
  el('review-prev').addEventListener('click', function () { reviewStep(-1); });
  el('review-next').addEventListener('click', function () { reviewStep(1); });
  el('review-play').addEventListener('click', reviewPlayToggle);
  el('btn-daily-hist').addEventListener('click', openDailyHistory);
  el('btn-daily-today').addEventListener('click', function () {
    closeModal(dailyModal);
    startDaily();
  });
  /* «Играть» в строке истории: задача за ту дату — в историю дня пойдёт,
     в рекорды уровня нет. */
  dailyTable.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-day]');
    if (!btn) return;
    closeModal(dailyModal);
    startDaily(btn.getAttribute('data-day'));
  });
  el('btn-stats').addEventListener('click', openStats);
  el('btn-stats-csv').addEventListener('click', exportStatsCsv);
  el('btn-stats-json').addEventListener('click', exportStatsJson);
  el('btn-print').addEventListener('click', printSheetNow);
  el('btn-print-blank').addEventListener('click', printBlankNow);
  /* второй вход к тому же бланку — из подвала: панель инструментов скрыта
     в варианте «МК-61», а бланк там нужнее всего */
  var blankTriggers = document.querySelectorAll('[data-print-blank]');
  for (var bi = 0; bi < blankTriggers.length; bi++) {
    if (blankTriggers[bi].id === 'btn-print-blank') continue;
    blankTriggers[bi].addEventListener('click', printBlankNow);
  }
  el('btn-train').addEventListener('click', startTraining);

  optAuto.addEventListener('change', function () {
    prefs.auto = optAuto.checked;
    savePrefs();
    refreshAuto();
    updateRecordLine();
    if (prefs.auto && outOfRecords() && !wasQuiet()) toast(T('toast.assist.off'));
  });

  document.addEventListener('keydown', function (e) {
    var tagName = (e.target && e.target.tagName) || '';

    /* Отмена захода: Ctrl+Z — в любом режиме, кроме полей ввода и окон. */
    if ((e.ctrlKey || e.metaKey) && /^[zZяЯ]$/.test(e.key) &&
        tagName !== 'INPUT' && tagName !== 'TEXTAREA' && !calcModalOpen()) {
      e.preventDefault();
      undoMove();
      return;
    }

    /* Разбор: стрелки листают ходы, как в проигрывателе. */
    if (!reviewModal.hidden && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
        tagName !== 'INPUT' && tagName !== 'TEXTAREA') {
      e.preventDefault();
      reviewStep(e.key === 'ArrowLeft' ? -1 : 1);
      return;
    }

    /* МК-61: цифры и «.» идут на индикатор, Enter — заход, Backspace — стереть. */
    if (state.variant === 'mk61' && !calcModalOpen()) {
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); sfx.key(); calcPress(e.key); return; }
      if (e.key === '.' || e.key === ',') { e.preventDefault(); sfx.key(); calcPress('.'); return; }
      if (e.key === 'Enter') { e.preventDefault(); calcSubmit(); return; }
      if (e.key === 'Backspace') {
        e.preventDefault();
        calcSetInput(state.calcInput.slice(0, -1));
        return;
      }
      if (e.key === 'c' || e.key === 'C' || e.key === 'с' || e.key === 'С') {
        e.preventDefault();
        calcSetInput('');
        return;
      }
    }

    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      if (e.key === 'Escape') { coordInput.blur(); }
      return;
    }
    if (e.key === 'Escape') {
      if (!shareModal.hidden) { closeModal(shareModal); return; }
      if (!dailyModal.hidden) { closeModal(dailyModal); return; }
      if (!statsModal.hidden) { closeModal(statsModal); return; }
      if (!rulesModal.hidden) { closeModal(rulesModal); return; }
      if (!reviewModal.hidden) { closeModal(reviewModal); return; }
      if (!winModal.hidden) { closeModal(winModal); }
      return;
    }
    if (e.key === 'h' || e.key === 'H' || e.key === 'р' || e.key === 'Р') {
      e.preventDefault();
      showHint();
    }
  });

  /* ---------- старт ---------- */

  /* Язык — раньше всего остального: панели собираются уже с переводами. */
  I18N.set(prefs.lang === 'en' ? 'en' : 'ru');
  I18N.apply();
  paintLinks();
  syncLangChrome();

  buildLevelBar();
  if (prefs.chase && prefs.chase.size) state.chase = prefs.chase;
  syncChaseInputs();
  state.variant = (prefs.variant === 'chase' || prefs.variant === 'mk61') ? prefs.variant : 'classic';
  markVariantBar();

  variantBar.querySelectorAll('.variant-btn').forEach(function (b) {
    b.addEventListener('click', function () { setVariant(b.dataset.variant); });
  });
  [chaseSize, chaseFoxes, chaseEvery, chaseCount].forEach(function (sel) {
    sel.addEventListener('change', function () {
      readChaseInputs();
      if (state.variant === 'chase') { state.level = chaseLevel(); newGame(null); }
    });
  });

  state.level = state.variant === 'chase' ? chaseLevel()
    : (state.variant === 'mk61' ? mkLevel() : levelOf(prefs.level));
  buildBoard(state.level.size);
  setTheme(prefs.theme || 'modern');
  btnSound.setAttribute('aria-pressed', prefs.sound ? 'true' : 'false');
  markLevelBar();

  var startSeed = seedFromHash();
  /* Ссылку из адреса уважаем, но номер, который игра дописала сама,
     продолжению не мешает: если он совпадает с сохранённой партией — продолжаем. */
  var resumeOk = sessionOk(prefs.session) &&
    (startSeed == null || startSeed === prefs.session.opts.seed);
  if (resumeOk) {
    try {
      restoreSession(prefs.session);
      toast(T('toast.resume', { moves: movesWord(movesShown()) }) +
        (state.mode === 'training' ? T('toast.resume.training')
          : (archiveDaily() ? T('toast.resume.daily', { day: state.dailyDate }) : '')));
    } catch (err) {
      prefs.session = null;
      savePrefs();
      newGame(null);
      toast(T('toast.resume.fail'));
    }
  } else {
    newGame(startSeed);
  }
  /* Признак «интерфейс собран»: по нему десктопная обёртка ждёт кадр для снимка,
     а не спит фиксированные миллисекунды. */
  document.documentElement.dataset.ready = '1';

  /* ---------- установка как приложение (PWA) ----------
     Манифест и service worker действуют только по http(s): на file:// и в
     Electron регистрация молча пропускается, игра работает как раньше.
     Кнопка «Установить» появляется сама, когда браузер считает игру
     устанавливаемой (beforeinstallprompt); в уже установленном приложении
     этого события не бывает, и кнопки нет. */
  var btnInstall = el('btn-install');
  var installEvent = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    installEvent = e;
    if (btnInstall) btnInstall.hidden = false;
  });

  if (btnInstall) {
    btnInstall.addEventListener('click', function () {
      if (!installEvent) { btnInstall.hidden = true; return; }
      installEvent.prompt();
      installEvent.userChoice.then(function (res) {
        if (res && res.outcome === 'accepted') toast(T('toast.installed'));
        installEvent = null;
        btnInstall.hidden = true;
      })['catch'](function () { installEvent = null; btnInstall.hidden = true; });
    });
  }

  window.addEventListener('appinstalled', function () {
    if (btnInstall) btnInstall.hidden = true;
    toast(T('toast.installed'));
  });

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js')['catch'](function () {
        /* офлайн-копия — удобство, а не условие игры: молча живём без неё */
      });
    });
  }
})();
