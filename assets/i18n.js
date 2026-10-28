/* Локализация интерфейса: ru (по умолчанию) и en.
   UMD: в браузере — window.I18N, в Node — module.exports (для проверок). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.I18N = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DICT = { ru: {}, en: {} };
  var lang = 'ru';

  function add(key, ru, en) {
    DICT.ru[key] = ru;
    DICT.en[key] = en;
  }

  /* ---------- английский и русский: заголовок, шапка, панели ---------- */

  add('meta.title', 'Охота на лис — 1990 / 2026', 'Fox Hunt — 1990 / 2026');
  add('meta.desc',
    'Охота на лис — логическая игра Ю. Иванова и П. Иртюги из «Науки и жизни» № 10 за 1990 год. Поле 10×10, восемь лис, классическая пеленгация.',
    'Fox Hunt — a logic game by Yu. Ivanov and P. Irtuga from Nauka i Zhizn no. 10, 1990. A 10×10 board, eight foxes, classic radio bearings.');

  add('hdr.title', 'Охота на лис', 'Fox Hunt');
  add('hdr.sub', '«Наука и жизнь» № 10, 1990 · Ю. Иванов, П. Иртюга · Ленинград',
    'Nauka i Zhizn no. 10, 1990 · Yu. Ivanov, P. Irtuga · Leningrad');

  add('aria.theme', 'Оформление', 'Appearance');
  add('btn.sound', 'Звук', 'Sound');
  add('btn.rules', 'Правила', 'Rules');
  add('btn.lang', 'EN', 'RU');
  add('btn.lang.title', 'Переключить на английский', 'Switch to Russian');
  add('btn.install', 'Установить', 'Install');
  add('btn.install.title', 'Установить игру на устройство', 'Install the game on this device');
  add('toast.installed', 'Игра установлена — ярлык на экране', 'Installed — the shortcut is on your screen');
  add('aria.variant', 'Вариант игры', 'Game variant');
  add('var.classic', 'Классика 1990', 'Classic 1990');
  add('var.chase', 'Гон', 'Chase');
  add('var.mk61', 'МК-61', 'MK-61');
  add('aria.level', 'Уровень сложности', 'Difficulty');
  add('aria.chase', 'Настройки гона', 'Chase settings');
  add('aria.close', 'Закрыть', 'Close');

  add('chase.field', 'Поле', 'Board');
  add('chase.foxes', 'Лис', 'Foxes');
  add('chase.every', 'Перебежка', 'Relocation');
  add('chase.every.0', 'никогда', 'never');
  add('chase.every.5', 'через 5 ходов', 'every 5 moves');
  add('chase.every.4', 'через 4 хода', 'every 4 moves');
  add('chase.every.3', 'через 3 хода', 'every 3 moves');
  add('chase.every.2', 'через 2 хода', 'every 2 moves');
  add('chase.every.1', 'каждый ход', 'every move');
  add('chase.count', 'Сколько лис', 'How many');
  add('chase.count.title', 'сколько лис сдвигается за одну перебежку', 'how many foxes move in one relocation');
  add('chase.count.one', '1 лиса', '1 fox');
  add('chase.count.all', 'все', 'all');

  add('aria.board', 'Игровое поле', 'Game board');
  add('blind.title', 'ПОЛЯ НЕТ', 'NO BOARD');
  add('blind.text',
    'Как на МК-61: только индикатор, журнал и ввод координат.<br>Лучи придётся держать в голове — подсказок здесь не будет.',
    'Just like the MK-61: the indicator, the log and coordinate input.<br>You keep the rays in your head — no hints here.');

  add('calc.brand', 'ЭЛЕКТРОНИКА МК-61', 'ELEKTRONIKA MK-61');
  add('calc.found', 'НАЙДЕНО {found}/{total}', 'FOUND {found}/{total}');
  add('calc.tag.input', 'ВВОД', 'INPUT');
  add('calc.tag.bearing', 'ПЕЛЕНГ', 'BEARING');
  add('calc.note', 'строка . столбец · С/П — заход', 'row . column · C/P — probe');
  add('calc.key.c', 'С', 'C');
  add('calc.key.sp', 'С/П', 'C/P');
  add('calc.hint',
    'Клавиатура тоже работает: цифры и «.», Enter — заход, Backspace — стереть. Поля нет намеренно: лучи держите в голове, как на настоящем калькуляторе.',
    'The keyboard works too: digits and “.”, Enter — probe, Backspace — erase. There is no board on purpose: keep the rays in your head, as on the real calculator.');

  add('board.hint', 'Строка ↓, столбец →. Клик по клетке — пеленг из неё, это один ход.',
    'Row ↓, column →. A click on a cell takes a bearing from it — that is one move.');
  add('board.hint.extra', 'Правый клик — своя пометка.', 'Right click — your own mark.');

  add('lcd.bearing', 'ПЕЛЕНГ', 'BEARING');
  add('lcd.hint', 'введите координаты вида 4.3', 'enter coordinates like 4.3');
  add('stat.found', 'Найдено', 'Found');
  add('stat.moves', 'Ходы', 'Moves');
  add('stat.time', 'Время', 'Time');
  add('stat.seed', 'Партия', 'Game');
  add('coord.label', 'Координаты', 'Coordinates');
  add('coord.label.hint', 'строка . столбец', 'row . column');
  add('coord.aria', 'Координаты: строка, точка, столбец', 'Coordinates: row, dot, column');
  add('btn.probe', 'Пеленг', 'Probe');

  add('opt.lines', 'Подсветка лучей', 'Highlight rays');
  add('opt.notes', 'Заметки', 'Notes');
  add('opt.auto', 'Автопометки', 'Auto-marks');
  add('opt.auto.title', '«×» там, где лисы не может быть по логике пеленгов',
    '“×” where no fox can be, judging by the bearings');
  add('legend.notes',
    'Правый клик (или долгое нажатие): «?» — здесь может быть лиса, второй раз — «×» — здесь точно нет. Автопометки ставят «×» только там, где лисы не может быть по логике пеленгов.',
    'Right click (or a long press): “?” — a fox may be here, again — “×” — no fox here. Auto-marks put “×” only where the bearings rule a fox out.');

  add('btn.hint', 'Подсказка', 'Hint');
  add('btn.review', 'Разбор', 'Review');
  add('btn.print', 'Печать', 'Print');
  add('btn.print.blank', 'Пустое поле', 'Blank sheet');
  add('btn.print.blank.title', 'Распечатать пустое поле, чтобы отмечать пеленги на бумаге',
    'Print an empty board to mark bearings on paper');
  add('btn.new', 'Новая партия', 'New game');
  add('btn.undo', 'Отменить', 'Undo');
  add('btn.undo.title', 'Отменить последний заход (Ctrl+Z)', 'Undo the last probe (Ctrl+Z)');
  add('btn.replay', 'Повторить', 'Replay');
  add('btn.share', 'Поделиться', 'Share');
  add('btn.train', 'Тренировка', 'Practice');
  add('btn.giveup', 'Сдаться', 'Give up');

  add('log.title', 'Журнал ходов', 'Move log');
  add('aria.log', 'Журнал ходов', 'Move log');
  add('panel.rec', 'Рекорд уровня —', 'Level record —');
  add('panel.par', '· пар —', '· par —');
  add('btn.daily', 'Задача дня', 'Daily puzzle');
  add('btn.dailyHist', 'История задач дня', 'Daily puzzle history');
  add('btn.stats', 'Итоги: рекорды и статистика', 'Totals: records and stats');

  add('foot.level', 'Поле 10 × 10 · восемь лис', 'Board 10 × 10 · eight foxes');
  add('foot.bearing', 'Пеленг: строка, столбец и две диагонали', 'Bearing: row, column and both diagonals');
  add('foot.dim', 'Логика 1990 года, оболочка 2026-го', '1990 rules, 2026 shell');

  /* ---------- правила ---------- */

  add('rules.eyebrow', '«Наука и жизнь» № 10 · октябрь 1990', 'Nauka i Zhizn no. 10 · October 1990');
  add('rules.title', 'Охота на лис', 'Fox Hunt');
  add('rules.lead',
    'Логическая игра Ю. Иванова и П. Иртюги для программируемого микрокалькулятора «Электроника МК-61». Поле 10 × 10, восемь лис.',
    'A logic game by Yu. Ivanov and P. Irtuga for the Elektronika MK-61 programmable calculator. A 10 × 10 board, eight foxes.');
  add('rules.quote',
    '«Вам неизвестно, где точно сидит лиса, но Вам архиважно поймать всех зверюшек за минимальное число ходов. В качестве оружия у Вас имеется радиопеленгатор, реагирующий на рыжих бестий».',
    '“You do not know where the fox sits, but it is vital to catch every one of the beasts in as few moves as possible. Your weapon is a radio direction finder that reacts to the red-haired creatures.”');
  add('rules.h.rules', 'Правила', 'Rules');
  add('rules.r1', 'Восемь лис прячутся на поле 10 × 10. Несколько лис могут сидеть в одной клетке.',
    'Eight foxes hide on a 10 × 10 board. Several foxes may share one cell.');
  add('rules.r2',
    'Вы называете клетку парой чисел «строка.столбец», например <code>4.3</code>. Каждый заход — один ход.',
    'You name a cell as “row.column”, for example <code>4.3</code>. Every call is one move.');
  add('rules.r3',
    'Если в названной клетке есть лиса, ловится ровно одна: индикатор показывает <b>ЛИС·N</b>, где N — сколько лис ещё не поймано. Если в клетке сидели две, вторая ловится следующим заходом.',
    'If the named cell holds a fox, exactly one is caught: the indicator shows <b>FOX·N</b>, where N is how many foxes are still free. If two sat there, the second is caught by the next call.');
  add('rules.r4',
    'Если лис в клетке нет, пеленгатор показывает, сколько не пойманных лис лежит на четырёх лучах из неё: строка, столбец и обе диагонали. Клетка считается один раз, даже если лежит сразу на нескольких лучах.',
    'If the cell is empty, the finder reports how many free foxes lie on the four rays from it: the row, the column and both diagonals. A cell counts once, even when it lies on several rays.');
  add('rules.r5', 'Пойманные лисы из пеленга исчезают. Цель — поймать все восемь за минимальное число ходов.',
    'Caught foxes disappear from the bearing. The goal is to catch all eight in as few moves as possible.');
  add('rules.example',
    'Пример из журнала: при расстановке, где по две лисы в 2.1 и 4.6, заход <code>4.3</code> даёт пеленг 4. Затем <code>4.6</code> — «ЛИС·7», ещё раз <code>4.6</code> — «ЛИС·6», и третий раз — пеленг 2.',
    'The log example: with two foxes in 2.1 and two in 4.6, the call <code>4.3</code> gives a bearing of 4. Then <code>4.6</code> — “FOX·7”, <code>4.6</code> again — “FOX·6”, and the third call gives a bearing of 2.');

  add('rules.h.levels', 'Уровни и пеленг', 'Levels and bearings');
  add('rules.l1', '<b>Новичок</b> (8 × 8, 4 лисы) — пеленг приходит четырьмя числами: строка, столбец и две диагонали по отдельности.',
    '<b>Novice</b> (8 × 8, 4 foxes) — the bearing comes as four numbers: row, column and both diagonals separately.');
  add('rules.l2', '<b>Разведчик</b> (10 × 10) — только строка и столбец, диагонали не слышны.',
    '<b>Scout</b> (10 × 10) — row and column only, the diagonals are silent.');
  add('rules.l3', '<b>Охотник</b> (10 × 10) — классика 1990 года: одно число, сумма по четырём лучам.',
    '<b>Hunter</b> (10 × 10) — the 1990 original: one number, the sum over four rays.');
  add('rules.l4', '<b>Ветеран</b> (12 × 12, 10 лис) — лучи подсвечиваются только после хода, заметок нет.',
    '<b>Veteran</b> (12 × 12, 10 foxes) — rays light up only after the move, no notes.');
  add('rules.l5', '<b>Слепой</b> — поля нет вовсе: индикатор, журнал и ввод координат, как на МК-61.',
    '<b>Blind</b> — no board at all: the indicator, the log and coordinate input, as on the MK-61.');
  add('rules.l6', '<b>Экстрим</b> (8 × 8, 4 лисы) — радар отвечает «есть лиса на лучах» или «чисто», без количества.',
    '<b>Extreme</b> (8 × 8, 4 foxes) — the radar answers “fox on the rays” or “clear”, without a count.');

  add('rules.h.added', 'Что добавлено в этой версии', 'Added in this version');
  add('rules.a1',
    'Уровни, звёзды и пар: три звезды — от порога, посчитанного перебором партий эталонной политики (600 партий на уровень); там, где нет заметок или поля, поправка +2 хода.',
    'Levels, stars and par: three stars come from a threshold measured by playing 600 games per level with a reference policy; where there are no notes or no board, two moves are added.');
  add('rules.a2',
    'Рекорды, статистика партий и сдач — отдельно по каждому уровню. Кнопка «Итоги» собирает всё в одну таблицу и выгружает в .csv или .json.',
    'Records and the count of games and forfeits are kept per level. The “Totals” button gathers everything into one table and exports .csv or .json.');
  add('rules.a3',
    'Задача дня: одна расстановка на всех, выведенная из даты. История задач дня — сыгранные дни и серия подряд; прошлый день можно переиграть (это не идёт в рекорды).',
    'Daily puzzle: one layout for everyone, derived from the date. The history shows the days played and the streak; a past day can be replayed, but that does not count towards records.');
  add('rules.a4',
    'Отмена хода: кнопка «Отменить» или Ctrl+Z. Незаконченная партия продолжается после закрытия вкладки.',
    'Undo: the “Undo” button or Ctrl+Z. An unfinished game resumes after the tab is closed.');
  add('rules.a5', 'Заметки двух видов: «?» — может быть, «×» — точно нет. Автопометки ставят «×» по логике пеленгов.',
    'Two kinds of notes: “?” — may be, “×” — definitely not. Auto-marks place “×” by the logic of the bearings.');
  add('rules.a6',
    'Подсказка и разбор партии: подсказка показывает клетку с наибольшей ожидаемой информацией, разбор — сколько бит принёс каждый ход.',
    'Hint and review: the hint points at the cell with the most expected information, the review shows how many bits each move brought.');
  add('rules.a7', 'Печатный бланк поля с ключом для ведущего и тренировка с уже запеленгованной позиции.',
    'A printable board sheet with the host’s key, and practice from an already-probed position.');
  add('rules.a8', 'Журнал ходов, таймер, номер партии и тема «1990» с зелёным индикатором.',
    'A move log, a timer, the game number and a “1990” theme with a green indicator.');

  add('rules.h.chase', 'Вариант «Гон»', 'The Chase variant');
  add('rules.c1', 'Отдельный вариант рядом с классикой: поле 8 × 8, 10 × 10 или 12 × 12, лис от 4 до 10 — на выбор.',
    'A separate variant next to the classic: an 8 × 8, 10 × 10 or 12 × 12 board and 4 to 10 foxes, your choice.');
  add('rules.c2', 'Пока не наступил срок перебежки, лисы стоят на месте: первые ходы ничем не отличаются от классики.',
    'Until the relocation is due the foxes stay put: the first moves are exactly like the classic.');
  add('rules.c3',
    'Перебежка — сдвиг на одну соседнюю клетку (по горизонтали, вертикали или диагонали). Настраивается: никогда, через 5, 4, 3, 2 хода или каждый ход. За одну перебежку сдвигается любое выбранное число лис — от одной до всего состава.',
    'A relocation moves a fox to one neighbouring cell (horizontally, vertically or diagonally). Configure it: never, every 5, 4, 3, 2 moves, or every move. Any chosen number of foxes moves at once — from one to the whole pack.');
  add('rules.c4',
    'Видно, откуда ушла лиса, но не куда: она где-то рядом — источник на один ход подсвечивается штриховкой. Числа на поле после перебежки тускнеют — они про прежнюю расстановку.',
    'You see where a fox left, not where it went: it is somewhere nearby, and the source cell is hatched for one move. Numbers on the board fade after a relocation — they describe the old layout.');
  add('rules.c5', 'Лиса не встаёт в клетку, куда вы только что смотрели: перебежка не награждает за слепой тык.',
    'A fox never steps into the cell you have just probed: relocation must not reward blind poking.');
  add('rules.c6', 'Звёзд в гоне нет: пороги посчитаны для неподвижных лис. Рекорд и статистика ведутся отдельно для каждой настройки.',
    'No stars in the chase: the thresholds are measured for stationary foxes. Records and stats are kept per configuration.');

  add('rules.h.mk61', 'Вариант «МК-61»', 'The MK-61 variant');
  add('rules.m1', 'Поля нет вовсе: только зелёный индикатор и клавиши, как на «Электронике МК-61».',
    'No board at all: just the green indicator and the keys, as on the Elektronika MK-61.');
  add('rules.m2', 'Правила классики 1990 года: 10 × 10, восемь лис, пеленг — лисы на строке, столбце и двух диагоналях.',
    'The 1990 rules: 10 × 10, eight foxes, the bearing counts foxes on the row, the column and both diagonals.');
  add('rules.m3',
    'Ввод: цифры, точка, «С» — стереть, «С/П» — заход. С клавиатуры: цифры и «.», Enter — заход, Backspace — стереть, C — очистить.',
    'Input: digits, a dot, “C” to erase, “C/P” to probe. From the keyboard: digits and “.”, Enter to probe, Backspace to erase, C to clear.');
  add('rules.m4',
    'Подсказок, заметок и подсветки лучей здесь нет: лучи и числа держите в голове. Звёзд тоже нет, рекорд — отдельный.',
    'No hints, notes or ray highlighting here: keep the rays and numbers in your head. No stars either, and the record is its own.');
  add('rules.tiny',
    'В оригинале поля на экране не было вовсе: МК-61 показывал только числа, а координаты вводились через точку. Расстановка, поимка по одной лисе и правило четырёх лучей оставлены без изменений — современная только оболочка.',
    'The original had no board on screen at all: the MK-61 showed numbers only and coordinates were typed with a dot. The layout, one-fox-per-call catching and the four-ray rule are unchanged — only the shell is modern.');
  add('btn.got', 'Понятно', 'Got it');
  add('btn.close', 'Закрыть', 'Close');

  /* ---------- победа ---------- */

  add('win.eyebrow', 'Партия окончена', 'Game over');
  add('win.title', 'Все лисы найдены', 'All foxes found');
  add('aria.stars', 'Оценка партии', 'Game rating');
  add('win.record', 'Рекорд', 'Record');
  add('btn.again', 'Ещё партия', 'Another game');
  add('btn.same', 'Повторить эту', 'Replay this one');
  add('btn.winLook', 'Посмотреть поле', 'View the board');

  /* ---------- разбор ---------- */

  add('review.eyebrow', 'Разбор партии', 'Game review');
  add('review.title', 'Что дал каждый ход', 'What each move gave');
  add('aria.reviewBoard', 'Какие клетки исключил выбранный ход', 'Which cells the chosen move crossed out');
  add('review.none', 'Ход не выбран', 'No move chosen');
  add('review.hint',
    'Нажмите строку в таблице — поле покажет, какие клетки этот пеленг вычеркнул и почему.',
    'Click a row in the table — the board will show which cells that bearing crossed out, and why.');
  add('review.lg.excluded', 'вычеркнуто этим ходом', 'crossed out by this move');
  add('review.lg.gone', 'было вычеркнуто раньше', 'already crossed out before');
  add('review.lg.open', 'ещё возможно', 'still possible');
  add('review.lg.probe', 'точка пеленга', 'bearing point');
  add('review.prev', '← Назад', '← Back');
  add('review.prev.title', 'Предыдущий ход (←)', 'Previous move (←)');
  add('review.next', 'Вперёд →', 'Next →');
  add('review.next.title', 'Следующий ход (→)', 'Next move (→)');
  add('review.play', 'Проиграть', 'Play');
  add('review.stop', 'Стоп', 'Stop');
  add('th.cell', 'Клетка', 'Cell');
  add('th.answer', 'Ответ', 'Answer');
  add('th.bits', 'Бит', 'Bits');
  add('th.note', 'Оценка', 'Note');
  add('review.bits.note',
    '«Бит» — сколько информации принёс ход; ноль значит, что ответ можно было предсказать заранее. Строку можно выбрать: поле сверху покажет, что именно она доказала.',
    '“Bits” is how much information the move brought; zero means the answer could be predicted in advance. Pick a row: the board above shows what exactly it proved.');
  add('btn.txt', 'Скачать .txt', 'Save .txt');
  add('btn.png', 'Скачать .png', 'Save .png');
  add('btn.txt.title', 'Сохранить разбор текстом', 'Save the review as text');
  add('btn.png.title', 'Сохранить разбор картинкой', 'Save the review as a picture');

  /* ---------- задача дня ---------- */

  add('daily.eyebrow', 'Задача дня', 'Daily puzzle');
  add('daily.title', 'История задач дня', 'Daily puzzle history');
  add('th.date', 'Дата', 'Date');
  add('th.moves', 'Ходов', 'Moves');
  add('th.game', 'Партия', 'Game');
  add('daily.note',
    'Расстановка дня выводится из даты. Прошлый день можно переиграть: результат попадёт в историю дня, но не в рекорды уровня и не в общую статистику.',
    'The daily layout is derived from the date. A past day can be replayed: the result goes into the daily history, but not into level records or overall stats.');
  add('btn.dailyToday', 'Сегодняшняя задача', "Today's puzzle");
  add('btn.play', 'Играть', 'Play');
  add('btn.play.title', 'Сыграть задачу за {date} заново', 'Play the puzzle for {date} again');

  /* ---------- итоги ---------- */

  add('stats.eyebrow', 'Итоги', 'Totals');
  add('stats.title', 'Рекорды и статистика', 'Records and stats');
  add('th.mode', 'Режим', 'Mode');
  add('th.games', 'Партий', 'Games');
  add('th.wins', 'Побед', 'Wins');
  add('th.forfeits', 'Сдач', 'Forfeits');
  add('stats.note',
    'В файл попадают все режимы: уровни классики, МК-61 и каждая настройка гона отдельно. Время — лучшее в рекордной партии.',
    'Every mode goes into the file: the classic levels, the MK-61 and each chase configuration separately. The time is the best one, from the record game.');
  add('btn.csv', 'Скачать .csv', 'Save .csv');
  add('btn.json', 'Скачать .json', 'Save .json');

  /* ---------- дуэль ---------- */

  add('share.eyebrow', 'Дуэль', 'Duel');
  add('share.title', 'Ссылка на партию', 'Link to the game');
  add('share.lead', 'Соперник откроет ту же расстановку и увидит норму — ваши ходы.',
    'Your opponent opens the same layout and sees the target — your number of moves.');
  add('aria.link', 'Ссылка на партию', 'Link to the game');
  add('btn.copy', 'Копировать', 'Copy');
  add('share.note',
    'Ссылку можно открыть в другой вкладке или на другом устройстве. Номер партии и норма живут в адресе — сервера у игры нет.',
    'The link works in another tab or on another device. The game number and the target live in the address — the game has no server.');

  /* ---------- печать ---------- */

  add('print.title', 'Охота на лис', 'Fox Hunt');
  add('print.board', 'Поле', 'Board');
  add('print.note',
    'Пеленг: строка + столбец + две диагонали. Ловится одна лиса за заход. В клетке может сидеть несколько лис.',
    'Bearing: row + column + both diagonals. One fox is caught per call. A cell may hold several foxes.');
  add('print.log', 'Журнал', 'Log');
  add('print.blank.log', 'Заходы', 'Moves');
  add('print.blank.meta', 'Поле {size} × {size} · {foxes} · партия {seed}',
    'Board {size} × {size} · {foxes} · game {seed}');
  add('print.blank.blank', 'Пустой бланк: расстановки на листке нет.',
    'A blank sheet: no foxes are printed on it.');
  add('print.blank.mk61', 'Как на МК-61: поле ведите на бумаге, экран отвечает только пеленгом.',
    'As on the MK-61: keep the board on paper, the screen only answers with bearings.');
  add('print.blank.note',
    'Пеленг — сколько не пойманных лис на строке, столбце и двух диагоналях этой клетки. Координаты записывайте как 4.3: строка, затем столбец. Ловится одна лиса за заход.',
    'A bearing is how many uncaught foxes sit on this cell’s row, column and both diagonals. Write coordinates as 4.3: row first, then column. One fox is caught per move.');
  add('print.blank.how',
    '«?» — здесь может быть лиса, «×» — здесь её точно нет. Пойманные лисы из пеленга вычитаются.',
    '“?” — a fox may be here, “×” — there is certainly none. Caught foxes are subtracted from bearings.');
  add('print.key', 'Ключ для ведущего', 'Host’s key');
  add('print.keynote', 'Эту страницу охотнику не показывают: здесь расстановка.',
    'The hunter never sees this page: the layout is here.');

  /* ---------- окончание числительных ---------- */

  add('unit.move', 'ход|хода|ходов', 'move|moves');
  add('unit.fox', 'лиса|лисы|лис', 'fox|foxes');
  add('unit.day', 'день|дня|дней', 'day|days');
  add('unit.win', 'победа|победы|побед', 'win|wins');
  add('unit.game', 'партия|партии|партий', 'game|games');


  /* ---------- уровни (названия и пояснения) ---------- */

  add('level.novice.title', 'Новичок', 'Novice');
  add('level.novice.note', 'четыре числа по лучам', 'four numbers per ray');
  add('level.scout.title', 'Разведчик', 'Scout');
  add('level.scout.note', 'строка и столбец, без диагоналей', 'row and column, no diagonals');
  add('level.hunter.title', 'Охотник', 'Hunter');
  add('level.hunter.note', 'классика 1990 года', 'the 1990 original');
  add('level.veteran.title', 'Ветеран', 'Veteran');
  add('level.veteran.note', '12×12, подсветка только после хода', '12×12, rays light up only after the move');
  add('level.blind.title', 'Слепой', 'Blind');
  add('level.blind.note', 'без поля, как на МК-61', 'no board, like the MK-61');
  add('level.extreme.title', 'Экстрим', 'Extreme');
  add('level.extreme.note', 'радар: есть лиса на лучах или нет', 'radar: a fox on the rays or not');
  add('mode.chase', 'Гон', 'Chase');
  add('mode.mk61', 'МК-61', 'MK-61');
  add('mk61.note', 'калькулятор: индикатор и клавиши', 'calculator: indicator and keys');
  add('chase.note.all', 'все {foxes} через {every}', 'all {foxes} every {every}');
  add('chase.note.count', '{foxes} через {every}', '{foxes} every {every}');
  add('chase.note.none', 'лисы не перебегают', 'the foxes stay put');
  add('level.bar.title', '{note} · три звезды от {moves}', '{note} · three stars from {moves}');
  add('train.no.chase', 'В гоне тренировки нет: перебежки меняют позицию',
    'No practice in the chase: relocations change the position');
  add('train.no.calc', 'В МК-61 тренировки нет: поля нет', 'No practice in the MK-61: there is no board');
  add('foot.calc', 'МК-61 · поле {size} × {size} · {foxes} · {note}', 'MK-61 · board {size} × {size} · {foxes} · {note}');
  add('foot.chase', 'Гон · поле {size} × {size} · {foxes} · {note}', 'Chase · board {size} × {size} · {foxes} · {note}');
  add('foot.classic', 'Поле {size} × {size} · {foxes}', 'Board {size} × {size} · {foxes}');
  add('hint.calc',
    'МК-61: поля нет, только клавиши. Введите строку и столбец через точку, <span class="hint-extra">С/П — заход, С — стереть.</span>',
    'MK-61: no board, keys only. Type the row and the column with a dot, <span class="hint-extra">C/P — probe, C — erase.</span>');
  add('hint.blind',
    'Поля нет: вводите координаты в панели, Enter — заход. Пеленг придёт числом, лучи держите в голове.',
    'No board: enter coordinates in the panel, Enter takes the bearing. The answer is a number; keep the rays in your head.');
  add('hint.chase',
    'Гон: лисы перебегают, старые числа тускнеют — они уже про прежнюю расстановку. <span class="hint-extra">Номер в углу клетки с точкой — устаревший пеленг.</span>',
    'Chase: the foxes relocate and old numbers fade — they describe the previous layout. <span class="hint-extra">A number with a dot is a stale bearing.</span>');
  add('hint.after',
    'Строка ↓, столбец →. Клик по клетке — пеленг из неё, это один ход. <span class="hint-extra">Лучи подсвечиваются только после хода.</span>',
    'Row ↓, column →. A click takes a bearing from the cell — one move. <span class="hint-extra">Rays light up only after the move.</span>');
  add('hint.default', 'Строка ↓, столбец →. Клик по клетке — пеленг из неё, это один ход.',
    'Row ↓, column →. A click takes a bearing from the cell — one move.');
  add('hint.default.marks', 'Правый клик — своя пометка.', 'Right click — your own mark.');
  add('chase.count.allOption', 'все {foxes}', 'all {foxes}');


  /* ---------- пеленг, журнал, индикатор ---------- */

  add('lcd.binary.fox', 'на лучах есть лиса', 'a fox is on the rays');
  add('lcd.binary.clear', 'на лучах чисто', 'the rays are clear');
  add('lcd.rays', 'строка {row} · столбец {col} · ╲ {d1} · ╱ {d2}', 'row {row} · column {col} · ╲ {d1} · ╱ {d2}');
  add('lcd.rowcol', 'строка {row} · столбец {col} — диагонали не слышны',
    'row {row} · column {col} — the diagonals are silent');
  add('lcd.clear', 'чисто: ни одной лисы на лучах из {cell}', 'clear: no fox on the rays from {cell}');
  add('lcd.one', 'одна лиса на строке, столбце или диагонали из {cell}',
    'one fox on the row, column or diagonal from {cell}');
  add('lcd.many', '{foxes} на четырёх лучах из {cell}', '{foxes} on the four rays from {cell}');
  add('lcd.fox', 'ЛИС·{left}', 'FOX·{left}');
  add('lcd.fox.note', 'поймана одна, осталось {left} из {total}', 'one caught, {left} of {total} left');
  add('lcd.fox.note.one', 'поймана одна, осталось {left} из {total}', 'one caught, {left} of {total} left');
  add('lcd.first.hint', 'введите координаты вида 4.3', 'enter coordinates like 4.3');
  add('lcd.first.hint.binary', 'радар: введите координаты вида 4.3', 'radar: enter coordinates like 4.3');
  add('lcd.hint.fox', 'похоже, лиса в {cell}', 'looks like a fox is in {cell}');
  add('lcd.ready', '—', '—');

  add('move.one', 'Лиса перебежала', 'A fox relocated');
  add('move.all', 'Лисы перебежали', 'The foxes relocated');
  add('move.some', 'Перебежали {foxes}', '{foxes} relocated');
  add('move.from', ' из {cells}', ' from {cells}');
  add('move.tail', ' — старые пеленги больше не про эту расстановку.',
    ' — the old bearings no longer describe this layout.');
  add('move.log.tag', 'перебежка', 'relocation');

  add('cell.aria', 'Строка {row}, столбец {col}', 'Row {row}, column {col}');
  add('cell.aria.fox', 'Строка {row}, столбец {col}: поймано лис — {found}',
    'Row {row}, column {col}: foxes caught — {found}');
  add('cell.aria.bearing', 'Строка {row}, столбец {col}: пеленг {bearing}',
    'Row {row}, column {col}: bearing {bearing}');

  add('coord.bad', 'Введите координаты вида 4.3 — строка и столбец через точку',
    'Enter coordinates like 4.3 — row and column with a dot');


  add('stars.rating', 'Оценка партии: {stars} из 3', 'Game rating: {stars} of 3');
  add('cell.aria.foxes', 'Строка {row}, столбец {col}: {foxes}', 'Row {row}, column {col}: {foxes}');
  add('giveup.revealed', 'поле раскрыто, партия прервана: оставалось {foxes}',
    'the board is revealed, the game is over: {foxes} were left');


  /* ---------- разбор: объяснение хода ---------- */

  add('unit.cell', 'клетка|клетки|клеток', 'cell|cells');
  add('review.head', 'Ход {move} — {cell}: ', 'Move {move} — {cell}: ');
  add('review.spots', 'Возможных мест до хода: {before}, после: {after}.',
    'Possible spots before the move: {before}, after it: {after}.');
  add('review.fox.head', 'поимка: в клетке была лиса.', 'a catch: there was a fox in the cell.');
  add('review.fox.b1',
    'Клетка уходит с поля, а старые пеленги уменьшаются на одну лису — поэтому новых мест это не вычёркивает.',
    'The cell leaves the board and the old bearings drop by one fox — so this crosses out no new spots.');
  add('review.fox.b2', 'Лис осталось: {foxes}.', 'Foxes left: {foxes}.');
  add('review.binary.fox.head', 'на лучах есть лиса («есть»).', 'there is a fox on the rays (“yes”).');
  add('review.binary.clear.head', 'на лучах лис нет («чисто»).', 'no foxes on the rays (“clear”).');
  add('review.binary.probeCut', 'Точка пеленга вычеркнута — лисы в ней нет, иначе был бы «ЛИС».',
    'The probe cell is crossed out — no fox sits there, or the answer would have been “FOX”.');
  add('review.binary.nothing',
    'Больше ничего: ответ «есть» не говорит, в какой из клеток лучей лиса, а вне лучей их может быть сколько угодно.',
    'Nothing more: “yes” does not say which ray cell holds the fox, and off the rays there may be any number of them.');
  add('review.binary.allcut',
    'Вычеркнуты все клетки лучей — {cells}, включая точку пеленга: лис там нет ни в одной.',
    'Every ray cell is crossed out — {cells}, the probe cell included: there is no fox in any of them.');
  add('review.rays',
    'четыре луча считаются отдельно: строка {row}, столбец {col}, диагонали {d1} и {d2}.',
    'the four rays count separately: row {row}, column {col}, diagonals {d1} and {d2}.');
  add('review.rowcol', 'строка и столбец считаются отдельно: {row} и {col}.',
    'the row and the column count separately: {row} and {col}.');
  add('review.sum', 'на четырёх лучах ровно {foxes}.', 'exactly {foxes} on the four rays.');
  add('review.probeCut', 'Точка пеленга вычеркнута: лисы там нет, иначе был бы «ЛИС».',
    'The probe cell is crossed out: no fox there, or the answer would have been “FOX”.');
  add('review.lineCut', 'На лучах вычеркнуто {cells}: больше положенного лис там уже не поместится.',
    'Crossed out on the rays: {cells} — more than allowed would no longer fit there.');
  add('review.lineCut.n', 'На лучах вычеркнуто {cells}: больше {n} лис там уже не поместится.',
    'Crossed out on the rays: {cells} — more than {n} foxes would no longer fit there.');
  add('review.offCut',
    'Вне лучей вычеркнуто {cells}: иначе лис на лучах стало бы меньше, чем показал пеленгатор.',
    'Crossed out off the rays: {cells} — otherwise the rays would hold fewer foxes than the bearing showed.');
  add('review.noCut',
    'Ни одной новой клетки этот ответ не вычеркнул — он лишь подтвердил уже известное.',
    'This answer crossed out no new cell — it only confirmed what was already known.');
  add('cell.cut.now', '{base}: вычеркнуто этим ходом', '{base}: crossed out by this move');
  add('cell.cut.before', '{base}: вычеркнуто раньше', '{base}: crossed out earlier');
  add('review.step', 'Ход {n} из {total}', 'Move {n} of {total}');
  add('review.stop', 'Стоп', 'Stop');

  /* ---------- экспорт разбора ---------- */

  add('export.title', 'Охота на лис — разбор партии', 'Fox Hunt — game review');
  add('export.mode', 'Режим: {title} ({note})', 'Mode: {title} ({note})');
  add('export.head', 'Партия: {seed} · ходов: {moves} · время: {time} · поле {size}×{size}, лис {foxes}',
    'Game: {seed} · moves: {moves} · time: {time} · board {size}×{size}, {foxes}');
  add('export.info', 'Информация: {bits} бита.', 'Information: {bits} bits.');
  add('export.row', 'бит: {bits} · вычеркнуто этим ходом: {cells} · возможных мест после: {open}',
    'bits: {bits} · crossed out by this move: {cells} · possible spots after: {open}');
  add('export.legend', 'Легенда: «вычеркнуто этим ходом» — клетки, где лиса перестала быть возможной.',
    'Legend: “crossed out by this move” marks cells where a fox stopped being possible.');
  add('export.png.head', 'Партия {seed} · {size}×{size} · лис {foxes} · ходов {moves} · {bits} бита',
    'Game {seed} · {size}×{size} · {foxes} · moves {moves} · {bits} bits');
  add('export.png.row', '{bits} бита · вычеркнуто {cells}', '{bits} bits · crossed out {cells}');
  add('export.png.legend',
    'светлее — лиса ещё возможна · тёмное — вычеркнуто раньше · золотое — вычеркнуто этим ходом',
    'lighter — a fox is still possible · dark — crossed out earlier · gold — crossed out by this move');
  add('toast.review.empty', 'Разбирать нечего: ходов нет', 'Nothing to review: there were no moves');
  add('toast.review.none', 'Пока ни одного хода — разбирать нечего', 'No moves yet — nothing to review');
  add('toast.review.txt', 'Разбор сохранён текстом', 'The review is saved as text');
  add('toast.review.png', 'Картинка разбора сохранена', 'The review image is saved');
  add('toast.lang', 'Язык интерфейса: русский', 'Interface language: English');


  /* ---------- подсказка, пометки, счёт ---------- */

  add('toast.over.new', 'Партия окончена — начните новую', 'The game is over — start a new one');
  add('toast.over', 'Партия окончена', 'The game is over');
  add('toast.over.replay', 'Все лисы уже пойманы — начните новую партию',
    'Every fox is caught — start a new game');
  add('toast.hint.blind', 'На «Слепом» уровне подсказок нет', 'The Blind level has no hints');
  add('toast.hint.none', 'Подсказать нечего: поле уже решено', 'Nothing to hint: the board is solved');
  add('hint.catchLine', 'Ловите {cell}', 'Catch {cell}');
  add('hint.bearingLine', 'Пеленг из {cell}', 'Bearing from {cell}');
  add('lcd.hint.fox.here', 'похоже, лиса в {cell}', 'looks like a fox is in {cell}');
  add('toast.marks.off', 'На этом уровне заметки отключены', 'Marks are off on this level');
  add('toast.over.undo', 'Партия окончена — отменять нечего', 'The game is over — nothing to undo');
  add('toast.undo.none', 'Отменять нечего: сделайте заход', 'Nothing to undo: take a bearing first');
  add('toast.undo.done', 'Заход отменён · ходов {moves}', 'The move is undone · {moves} played');
  add('toast.resume', 'Продолжаем партию: {moves}', 'Resuming the game: {moves}');
  add('toast.resume.training', ' · тренировка', ' · practice');
  add('toast.resume.daily', ' · задача дня {day}', ' · daily task {day}');
  add('toast.resume.fail', 'Сохранённую партию продолжить не удалось — начали новую',
    'The saved game could not be resumed — started a new one');
  add('toast.replay.same', 'Та же расстановка — партия {seed}', 'Same layout — game {seed}');
  add('toast.replay.link', 'Партия по ссылке: {seed}', 'Game from the link: {seed}');
  add('toast.daily', 'Задача дня {day} · партия {seed}', 'Daily task {day} · game {seed}');
  add('toast.daily.archive', ' · в рекорды не пойдёт', ' · not counted as a record');


  /* ---------- сводки: рекорд, задача дня, итоги ---------- */

  add('statline', 'Партий: {plays} · побед: {wins}', 'Games: {plays} · wins: {wins}');
  add('statline.forfeits', ' · сдач: {n}', ' · forfeits: {n}');
  add('daily.today', 'Сегодня: {moves} · {stars}', 'Today: {moves} · {stars}');
  add('daily.absent', 'Расстановка дня — одна на всех, новая каждый день.',
    'The daily layout is the same for everyone and changes every day.');
  add('daily.tasks', ' · задач: {n}', ' · tasks: {n}');
  add('daily.streak', ', серия {days}', ', streak {days}');
  add('daily.empty.row', 'Ещё ни одной задачи дня не сыграно.', 'No daily task has been played yet.');
  add('daily.empty', 'История пуста.', 'The history is empty.');
  add('daily.play', 'Играть', 'Play');
  add('daily.play.title', 'Сыграть задачу за {day} заново', 'Play the task for {day} again');
  add('daily.sum', 'Сыграно: {days} · лучший результат: {best} · серия: {streak}.',
    'Played: {days} · best result: {best} · streak: {streak}.');
  add('chase.key.title', 'Гон {size}×{size} · {foxes}', 'Chase {size}×{size} · {foxes}');
  add('chase.key.every', ' · перебежка через {every}', ' · relocation every {every}');
  add('chase.key.none', ' · перебежек нет', ' · no relocations');
  add('chase.key.all', ' · перебегают все', ' · all of them relocate');
  add('chase.key.some', ' · перебегают {count}', ' · {count} relocate');
  add('stats.empty.row', 'Ещё ни одной партии: сыграйте — и здесь появятся рекорды.',
    'No games yet: play one and the records will appear here.');
  add('stats.empty', 'Пока пусто.', 'Nothing here yet.');
  add('stats.sum', 'Режимов: {modes} · партий: {plays} · побед: {wins}',
    'Modes: {modes} · games: {plays} · wins: {wins}');
  add('stats.sum.forfeits', ' · сдач: {n}', ' · forfeits: {n}');
  add('stats.sum.best', ' · лучший рекорд: {moves} ({mode})', ' · best record: {moves} ({mode})');
  add('stats.sum.daily', ' · задач дня: {n}', ' · daily tasks: {n}');
  add('stats.csv.head', 'Режим;Партий;Побед;Сдач;Рекорд;Время;Партия;Дата',
    'Mode;Games;Wins;Forfeits;Record;Time;Game;Date');
  add('stats.app', 'Охота на лис', 'Fox Hunt');
  add('toast.stats.csv', 'Итоги сохранены в .csv', 'The summary is saved as .csv');
  add('toast.stats.json', 'Итоги сохранены в .json', 'The summary is saved as .json');
  add('stats.mk61', 'МК-61 · калькулятор', 'MK-61 · calculator');


  add('unit.day', 'день|дня|дней', 'day|days');
  add('log.bearing', 'пеленг {n}', 'bearing {n}');
  add('log.yes', 'есть', 'yes');
  add('log.clear', 'чисто', 'clear');
  add('lcd.fox.last', 'поймана последняя лиса', 'the last fox is caught');
  add('calc.lamp', 'НАЙДЕНО {found}/{total}', 'FOUND {found}/{total}');
  add('calc.answer.fox', 'ЛИС {left}', 'FOX {left}');
  add('calc.note.fox', 'поймана одна · осталось {left} из {total}',
    'one caught · {left} of {total} left');
  add('calc.note.move', 'ход {moves} · лис на четырёх лучах', 'move {moves} · foxes on the four rays');
  add('calc.note.bad', 'нужно два числа от 1 до {size}, например 4.3',
    'two numbers from 1 to {size} are needed, e.g. 4.3');
  add('coord.bad.size', 'координаты — два числа от 1 до {size}, например 4.3',
    'coordinates are two numbers from 1 to {size}, e.g. 4.3');


  add('calc.yes', 'ЕСТЬ', 'YES');
  add('calc.no', 'НЕТ', 'NO');
  add('lcd.moveNote', 'ход {moves} · {note}', 'move {moves} · {note}');
  add('print.meta', 'Поле {size} × {size} · {foxes} · партия {seed}',
    'Board {size} × {size} · {foxes} · game {seed}');
  add('print.meta.chase', ' · гон: {note}', ' · chase: {note}');
  add('train.planned', 'тренировка: {cells} уже запеленговано', 'practice: {cells} already taken');
  add('train.toast', 'Тренировка: {cells} сыграно до вас', 'Practice: {cells} played before you');
  add('toast.train.chase', 'В гоне тренировки нет: лисы перебегают, позиция не сохраняется',
    'No practice in the chase: the foxes relocate and the position does not hold');

  /* ---------- дуэль ---------- */

  add('duel.line', 'Дуэль, партия {seed}: у соперника {moves}. ', 'Duel, game {seed}: your rival took {moves}. ');
  add('duel.win', 'Вы уложились за {mine} — победа.', 'You finished in {mine} — you win.');
  add('duel.draw', 'Ровно {mine} — ничья.', 'Exactly {mine} — a draw.');
  add('duel.more', 'У вас {mine} — на {diff} больше.', 'You took {mine} — {diff} more.');
  add('duel.behind', 'У вас уже {mine} — рекорд соперника не побит, но партию можно доиграть.',
    'You are at {mine} — the rival’s record stands, but you can play on.');
  add('duel.ahead', 'У вас {mine} из {vs} — ещё есть запас.', 'You are at {mine} of {vs} — still some room.');
  add('share.note.norm', 'Партия {seed}, ваша норма — {moves}. Соперник должен управиться строго быстрее.',
    'Game {seed}, your benchmark is {moves}. Your rival must be strictly faster.');
  add('share.note.none', 'Партия {seed} без нормы: первый ход соперника станет его счётом.',
    'Game {seed} without a benchmark: the rival’s first move sets the score.');
  add('share.copied', ' Ссылка уже в буфере обмена.', ' The link is in the clipboard.');
  add('share.nocopy', ' Буфер обмена недоступен — выделите ссылку и скопируйте вручную.',
    ' The clipboard is unavailable — select the link and copy it by hand.');
  add('toast.copy.ok', 'Ссылка скопирована', 'The link is copied');
  add('toast.copy.manual', 'Выделил ссылку — нажмите Ctrl+C', 'The link is selected — press Ctrl+C');
  add('btn.winLook.calc', 'К индикатору', 'To the indicator');

  /* ---------- победа и сдача ---------- */

  add('win.title.foxes', 'Все {foxes} найдены', 'All {foxes} found');
  add('win.note.archive',
    'Задача дня {day} (переигровка): результат попал в историю дня, но не в рекорды уровня и не в статистику.',
    'Daily task {day} (replay): the result went into the daily history, not into the level records or the statistics.');
  add('win.note.training', 'Тренировка: результат не идёт ни в рекорд, ни в статистику уровня.',
    'Practice: the result counts neither as a record nor in the level statistics.');
  add('win.note.chase.new',
    'Новый рекорд гона. Звёзд здесь нет: пороги классики к перебежкам не относятся.',
    'A new chase record. No stars here: the classic thresholds do not cover relocations.');
  add('win.note.chase.old',
    'Рекорд гона — {moves}. Звёзд здесь нет: пороги классики к перебежкам не относятся.',
    'The chase record is {moves}. No stars here: the classic thresholds do not cover relocations.');
  add('win.note.calc.new', 'Новый рекорд МК-61. Звёзд нет: на калькуляторе их не выдают.',
    'A new MK-61 record. No stars: the calculator does not hand them out.');
  add('win.note.calc.old', 'Рекорд МК-61 — {moves}, партия {seed}.',
    'The MK-61 record is {moves}, game {seed}.');
  add('win.note.record.authors',
    'Новый рекорд уровня — и не хуже рекорда авторов (19 ходов).',
    'A new level record — and no worse than the authors’ own (19 moves).');
  add('win.note.record', 'Новый рекорд уровня. Пар на три звезды — {moves}.',
    'A new level record. Three stars from {moves}.');
  add('win.note.repeat', 'Повторение рекорда уровня.', 'A repeat of the level record.');
  add('win.note.best', 'Рекорд уровня — {moves}, партия {seed}.',
    'The level record is {moves}, game {seed}.');
  add('win.note.daily', 'Задача дня {day}. ', 'Daily task {day}. ');
  add('win.note.duel.win', ' Дуэль: норма {vs}, у вас {mine} — соперник проиграл.',
    ' Duel: the benchmark is {vs}, you took {mine} — your rival lost.');
  add('win.note.duel.draw', ' Дуэль: ровно {vs} — ничья.', ' Duel: exactly {vs} — a draw.');
  add('win.note.duel.lose', ' Дуэль: норма {vs}, у вас {mine} — соперник выиграл.',
    ' Duel: the benchmark is {vs}, you took {mine} — your rival won.');
  add('toast.giveup', 'Сдались. Оставалось {foxes}.', 'You gave up. {foxes} were left.');
  add('btn.giveup.armed', 'Точно сдаться?', 'Really give up?');


  add('review.row.title', 'Показать, что вычеркнул этот ход', 'Show what this move crossed out');
  add('review.sum.moves', 'Ходов: {n} · всего {bits} бита информации.',
    'Moves: {n} · {bits} bits of information in total.');
  add('review.sum.weak', ' Слабых ходов: {n}.', ' Weak moves: {n}.');
  add('review.sum.best', ' Лучший — {moves} ({cell}): {bits} бита.',
    ' The best one — {moves} ({cell}): {bits} bits.');
  add('review.sum.bestBearing', ' Самый информативный пеленг — {moves} ({cell}): {bits} бита.',
    ' The most informative bearing — {moves} ({cell}): {bits} bits.');
  add('review.none', 'Ходов нет', 'No moves');
  add('toast.over.already', 'Партия уже окончена', 'The game is already over');


  /* ---------- тексты решателя (сами ключи отдаёт solver.js) ---------- */

  add('hint.text.certain', 'лиса здесь точно: остальные клетки на лучах уже исключены.',
    'a fox is certainly here: the other ray cells are already excluded.');
  add('hint.text.chance', 'похоже, лиса здесь: шанс {p} %.', 'a fox looks likely here: a {p}% chance.');
  add('hint.text.bits', 'ожидаем {bits} бита, шанс поимки {p} %.',
    'expecting {bits} bits, a {p}% chance of a catch.');
  add('note.catch', 'поимка', 'a catch');
  add('note.strong', 'сильный ход', 'a strong move');
  add('note.normal', 'обычный', 'ordinary');
  add('note.repeat', 'повтор: клетка уже была', 'a repeat: this cell was played');
  add('note.nothing', 'почти ничего', 'almost nothing');

  add('rules.a9',
    'Английская версия интерфейса: кнопка EN/RU в шапке. Русский — по умолчанию, выбор запоминается, незаконченная партия при переключении не теряется.',
    'An English interface: the EN/RU button in the header. Russian is the default, the choice is remembered, and a game in progress survives the switch.');

  add('win.note.repeat.authors',
    'Повторение рекорда уровня — и по-прежнему не хуже авторов (19 ходов).',
    'A repeat of the level record — and still no worse than the authors (19 moves).');
  add('win.note.best.authors', ' Это не хуже рекорда авторов (19 ходов).',
    ' That is no worse than the authors’ record (19 moves).');

  add('foot.author', 'Воссоздал и дополнил: Алексей (Alexsey111)', 'Rebuilt and extended by Alexey (Alexsey111)');
  add('foot.repo', 'Код и веб-версия на GitHub', 'Source code and web version on GitHub');
  add('foot.repo.title', 'Открыть репозиторий на GitHub', 'Open the repository on GitHub');
  add('foot.win', 'Скачать для Windows', 'Download for Windows');
  add('foot.win.title', 'Установщик для Windows с GitHub', 'Windows installer from GitHub');
  add('foot.donate', 'Поддержать проект', 'Support the project');
  add('foot.donate.title', 'Добровольный перевод на поддержку игры', 'A voluntary donation to support the game');
  add('foot.blank', 'Бланк для печати', 'Printable sheet');
  add('foot.blank.title', 'Распечатать пустое поле, чтобы отмечать на бумаге',
    'Print an empty board to mark on paper');
  add('echo.stats', 'найдено {found}/{total} · ходы {moves}',
    'found {found}/{total} · moves {moves}');

  add('rules.h.where', 'Где взять и как поддержать', 'Where to get it and how to support it');
  add('rules.w1',
    'Веб-версия открывается в браузере без установки и работает офлайн после первого открытия: <a class="foot-link" data-web target="_blank" rel="noopener">играть в браузере</a>.',
    'The web version opens in a browser with nothing to install and works offline after the first visit: <a class="foot-link" data-web target="_blank" rel="noopener">play in the browser</a>.');
  add('rules.w2',
    'Для Windows есть установщик и portable-версия в одном файле (~79 МБ, интернет не нужен): <a class="foot-link" data-win target="_blank" rel="noopener">скачать с GitHub</a>.',
    'For Windows there is an installer and a single-file portable build (~79 MB, no internet needed): <a class="foot-link" data-win target="_blank" rel="noopener">download from GitHub</a>.');
  add('rules.w3',
    'Рекламы в игре нет и не будет. Поддержать проект можно добровольно: <a class="foot-link" data-donate target="_blank" rel="noopener">перевести любую сумму</a>.',
    'There is no advertising in the game and there will be none. You can support the project voluntarily: <a class="foot-link" data-donate target="_blank" rel="noopener">send any amount</a>.');
  add('rules.w4',
    'Сервера у игры нет: партии, рекорды и настройки хранятся только в браузере или в профиле приложения и никуда не отправляются.',
    'The game has no server: games, records and settings live only in your browser or the app profile and are never sent anywhere.');

  function set(l) {
    lang = DICT[l] ? l : 'ru';
    return lang;
  }

  function t(key, vars) {
    var s = DICT[lang] && DICT[lang][key];
    if (s == null) s = DICT.ru[key];
    if (s == null) return key;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (m, k) {
        return vars[k] != null ? String(vars[k]) : m;
      });
    }
    return s;
  }

  /* Форма слова по числу: ru — три формы, en — две. */
  function plural(key, n) {
    var forms = (DICT[lang] && DICT[lang][key]) || DICT.ru[key];
    if (!forms) return '';
    var parts = String(forms).split('|');
    n = Math.abs(Number(n) || 0);
    if (parts.length < 3) return n === 1 ? parts[0] : (parts[1] || parts[0]);
    var i = n % 100, j = n % 10;
    if (i > 10 && i < 20) return parts[2];
    if (j > 1 && j < 5) return parts[1];
    if (j === 1) return parts[0];
    return parts[2];
  }

  /* «3 хода», «1 лиса», «12 moves» */
  function num(n, key) {
    return n + ' ' + plural(key, n);
  }

  /* Подставляет перевод в размеченную статику: [data-i18n], [data-i18n-html],
     [data-i18n-title], [data-i18n-aria], [data-i18n-ph]. */
  function apply(root, vars) {
    var doc = root || document;
    var els = doc.querySelectorAll('[data-i18n], [data-i18n-html], [data-i18n-title], [data-i18n-aria], [data-i18n-ph]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key, vars);
      key = el.getAttribute('data-i18n-html');
      if (key) el.innerHTML = t(key, vars);
      key = el.getAttribute('data-i18n-title');
      if (key) el.title = t(key, vars);
      key = el.getAttribute('data-i18n-aria');
      if (key) el.setAttribute('aria-label', t(key, vars));
      key = el.getAttribute('data-i18n-ph');
      if (key) el.placeholder = t(key, vars);
    }
  }

  return {
    t: t,
    plural: plural,
    num: num,
    set: set,
    lang: function () { return lang; },
    apply: apply,
    has: function (key) { return !!(DICT[lang] && DICT[lang][key]); },
    keys: function () { return Object.keys(DICT.ru); },
    dict: DICT
  };
});
