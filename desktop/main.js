/* Охота на лис — десктопная обёртка.
   Вся игра живёт в index.html: здесь только окно, меню и сохранение размеров.
   Запуск: npm run desktop   (в dev-режиме)  ·  сборка: npm run dist */

'use strict';

const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.join(__dirname, '..');
const PAGE = path.join(ROOT, 'index.html');
const STATE_FILE = () => path.join(app.getPath('userData'), 'window.json');

/* Аргументы для проверки без человека за экраном:
   --smoke снимает снимок окна и выходит, --print-crash печатает ошибки. */
const argv = process.argv.slice(1);
const SMOKE = argv.includes('--smoke') || argv.includes('--selftest');
const SELFTEST = argv.includes('--selftest');
const SMOKE_OUT = (function () {
  const i = argv.indexOf('--smoke-out');
  return i >= 0 && argv[i + 1] ? argv[i + 1] : path.join(app.getPath('temp'), 'fox-smoke.png');
})();

/* Самопроверка собранного приложения: сценарий проходит по экранам и отдаёт
   числа, а решение «похоже на правду» принимает main-процесс, а не страница. */
const SELFTEST_SCRIPT = `(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const q = s => document.querySelector(s);
  const cell = (r, c) => document.querySelector('#board .cell[data-r="' + r + '"][data-c="' + c + '"]');
  const logCells = () => [...document.querySelectorAll('#log li .c')].map(e => e.textContent);
  const out = {};

  out.lang0 = document.documentElement.lang;
  out.moves0 = q('#stat-moves').textContent;

  [[2, 3], [7, 7], [4, 9]].forEach(p => { const el = cell(p[0], p[1]); if (el) el.click(); });
  await wait(250);
  out.moves = q('#stat-moves').textContent;
  out.log = logCells();
  out.lcd = q('#lcd-note').textContent;

  q('#btn-undo').click();
  await wait(250);
  out.movesAfterUndo = q('#stat-moves').textContent;
  out.logAfterUndo = logCells();

  q('#btn-lang').click();
  await wait(700);
  out.lang1 = document.documentElement.lang;
  out.movesAfterLang = q('#stat-moves').textContent;
  out.headline = q('h1').textContent;

  q('#btn-review').click();
  await wait(400);
  out.reviewRows = document.querySelectorAll('#review-table tbody tr').length;
  out.reviewStep = q('#review-step').textContent;
  out.reviewMove = q('#review-move').textContent;
  q('#review-modal [data-close]').click();
  await wait(150);

  q('[data-variant="mk61"]').click();
  await wait(400);
  out.calcLamp = q('#calc-lamp').textContent;
  out.calcKeys = document.querySelectorAll('#calc-keys button').length;
  out.boardHidden = getComputedStyle(q('#board')).display;
  q('#btn-lang').click();
  await wait(700);
  out.calcLampRu = q('#calc-lamp').textContent;

  q('[data-variant="classic"]').click();
  await wait(300);
  q('#btn-stats').click();
  await wait(300);
  out.statsHead = [...document.querySelectorAll('#stats-table thead th')].map(t => t.textContent);
  out.statsSummary = q('#stats-summary').textContent;
  q('#stats-modal [data-close]').click();

  out.storage = (() => { try { localStorage.setItem('__selftest', '1'); localStorage.removeItem('__selftest'); return 'ok'; } catch (e) { return 'fail:' + e.name; } })();
  return JSON.stringify(out);
})()`;

/* Ждём, пока страница сама скажет, что собралась (html[data-ready]);
   кадр «на таймере» иногда приходил на пустое поле. */
function waitReady(w, timeoutMs) {
  const started = Date.now();
  return new Promise(function (resolve) {
    function later() {
      if (Date.now() - started > timeoutMs) return resolve(false);
      setTimeout(tick, 150);
    }
    function tick() {
      /* executeJavaScript до готовности документа кидает ошибку — это повод
         подождать ещё, а не сдаваться: иначе кадр снимается на пустом экране. */
      if (w.webContents.isLoading()) return later();
      w.webContents.executeJavaScript("document.documentElement.dataset.ready === '1'")
        .then(function (ok) { if (ok) resolve(true); else later(); })
        .catch(later);
    }
    tick();
  });
}

function checkSelftest(data) {
  const problems = [];
  const num = v => Number(v);
  if (num(data.moves) !== 3) problems.push('после трёх кликов ходов ' + data.moves);
  if (!Array.isArray(data.log) || data.log.length !== 3) problems.push('в журнале ' + (data.log || []).length + ' записей');
  if (num(data.movesAfterUndo) !== 2) problems.push('после отмены ходов ' + data.movesAfterUndo);
  if ((data.logAfterUndo || []).length !== 2) problems.push('после отмены в журнале ' + (data.logAfterUndo || []).length);
  if (data.lang1 === data.lang0) problems.push('язык не переключился');
  if (num(data.movesAfterLang) !== 2) problems.push('при смене языка ходы стали ' + data.movesAfterLang);
  if (!data.reviewRows) problems.push('разбор пуст');
  if (!data.calcLamp) problems.push('нет индикатора МК-61');
  if (data.calcKeys !== 13) problems.push('клавиш в МК-61: ' + data.calcKeys);
  if (data.boardHidden !== 'none') problems.push('в МК-61 поле не скрыто');
  if (!(data.statsHead || []).length) problems.push('нет таблицы итогов');
  if (data.storage !== 'ok') problems.push('localStorage: ' + data.storage);
  return problems;
}

let win = null;

function readWindowState() {
  try {
    const raw = JSON.parse(fs.readFileSync(STATE_FILE(), 'utf8'));
    if (raw && Number.isFinite(raw.width) && Number.isFinite(raw.height)) return raw;
  } catch (err) { /* первый запуск — размеры по умолчанию */ }
  return { width: 1360, height: 900, maximized: false };
}

function saveWindowState() {
  if (!win || win.isDestroyed()) return;
  try {
    const box = win.getNormalBounds ? win.getNormalBounds() : win.getBounds();
    fs.writeFileSync(STATE_FILE(), JSON.stringify({
      width: box.width, height: box.height, maximized: win.isMaximized()
    }));
  } catch (err) { /* без прав на запись играть можно, просто окно не запомнится */ }
}

/* Меню: только то, что нужно игре. «Правила» есть в самой игре, здесь — масштаб,
   полноэкранный режим и инструменты разработчика для отладки. */
function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    {
      label: 'Игра',
      submenu: [
        { role: 'reload', label: 'Перезагрузить' },
        { role: 'forceReload', label: 'Перезагрузить без кеша' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Полный экран (F11)' },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'Закрыть окно' } : { role: 'quit', label: 'Выход' }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        { role: 'resetZoom', label: 'Обычный масштаб' },
        { role: 'zoomIn', label: 'Крупнее' },
        { role: 'zoomOut', label: 'Мельче' },
        { type: 'separator' },
        { role: 'toggleDevTools', label: 'Инструменты разработчика' }
      ]
    },
    {
      label: 'Справка',
      submenu: [
        {
          label: 'Об игре',
          click: function () {
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'Охота на лис',
              message: 'Охота на лис — 1990 / 2026',
              detail: 'Логическая игра Ю. Иванова и П. Иртюги из «Науки и жизни» № 10 за 1990 год.\n\n' +
                'Версия приложения: ' + app.getVersion() + '\n' +
                'Electron ' + process.versions.electron + ', Chromium ' + process.versions.chrome,
              buttons: ['Понятно']
            });
          }
        }
      ]
    }
  ];
  if (isMac) template.unshift({ role: 'appMenu' });
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const state = readWindowState();

  win = new BrowserWindow({
    width: state.width,
    height: state.height,
    minWidth: 380,          /* ниже 380 px не помещается панель и калькулятор */
    minHeight: 520,
    backgroundColor: '#0e1116',
    title: 'Охота на лис',
    show: false,
    autoHideMenuBar: false,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,   /* игре Node не нужен: она целиком в браузерном слое */
      sandbox: true,
      spellcheck: false
    }
  });

  if (state.maximized) win.maximize();

  win.once('ready-to-show', function () {
    win.show();
    if (SMOKE) {
      win.webContents.executeJavaScript(`(() => {
        const q = s => document.querySelector(s);
        const box = e => e ? [Math.round(e.getBoundingClientRect().width), Math.round(e.getBoundingClientRect().height)] : null;
        return JSON.stringify({
          engine: typeof window.FoxEngine, i18n: typeof window.I18N,
          boardCells: document.querySelectorAll('#board .cell').length,
          levels: document.querySelectorAll('.lv-btn').length,
          levelBarHidden: q('#level-bar') ? q('#level-bar').hidden : 'нет',
          levelBarStyle: q('#level-bar') ? getComputedStyle(q('#level-bar')).display : 'нет',
          boardBox: box(q('#board')),
          seed: q('#stat-seed') ? q('#stat-seed').textContent : null,
          lang: document.documentElement.lang,
          storage: (() => { try { localStorage.setItem('__t','1'); localStorage.removeItem('__t'); return 'ok'; } catch (e) { return 'fail: ' + e.name; } })()
        });
      })()`).then(function (info) { console.log('DIAG ' + info); }).catch(function (err) {
        console.error('DIAG_FAIL ' + err.message);
      }).then(function () {
        if (!SELFTEST) return null;
        return win.webContents.executeJavaScript(SELFTEST_SCRIPT).then(function (raw) {
          const data = JSON.parse(raw);
          console.log('SELFTEST ' + raw);
          const problems = checkSelftest(data);
          if (problems.length) {
            console.error('SELFTEST_FAIL ' + problems.join('; '));
            app.exit(1);
            return;
          }
          console.log('SELFTEST_OK');
          app.exit(0);   /* снимок в этом режиме не нужен: выходим до capturePage */
        });
      }).then(function () {
        if (SELFTEST) return null;
        /* кадр снимаем, когда отрисовка устоялась: ready-to-show приходит
           раньше, чем браузер успевает показать поле и панели */
        return waitReady(win, 8000).then(function () {
          return new Promise(function (resolve) { setTimeout(resolve, 250); });
        });
      }).then(function () {
        if (SELFTEST) return null;
        return win.webContents.capturePage();
      }).then(function (image) {
        if (!image) return;   /* самопроверка уже вышла со своим кодом */
        fs.writeFileSync(SMOKE_OUT, image.toPNG());
        console.log('SMOKE_OK ' + SMOKE_OUT);
        app.quit();
      }).catch(function (err) {
        console.error('SMOKE_FAIL ' + err.message);
        app.exit(2);
      });
    }
  });

  win.on('close', saveWindowState);

  /* Внешние ссылки — в системный браузер, игра сама никуда не уходит. */
  win.webContents.setWindowOpenHandler(function (details) {
    if (/^https?:/i.test(details.url)) shell.openExternal(details.url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', function (e, url) {
    if (!url.startsWith('file://')) {
      e.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  /* Ошибки страницы видны в консоли запуска: иначе в собранном приложении
     о них узнать неоткуда — окно просто рисуется наполовину. */
  win.webContents.on('console-message', function (e, level, message, line, source) {
    if (level >= 2) console.error('CONSOLE ' + message + ' (' + source + ':' + line + ')');
  });

  win.webContents.on('render-process-gone', function (e, details) {
    console.error('RENDER_GONE ' + details.reason);
  });
  win.webContents.on('did-fail-load', function (e, code, desc, url) {
    console.error('LOAD_FAIL ' + code + ' ' + desc + ' ' + url);
  });

  win.loadFile(PAGE);
}

/* Одно окно: второй запуск фокусирует первое, а не открывает копию.
   Служебные прогоны (--smoke, --selftest) замок не берут: иначе проверка молча
   выходит, если игра уже открыта, и выглядит как «ничего не напечаталось». */
if (!SMOKE && !app.requestSingleInstanceLock()) {
  app.quit();
} else {
  if (!SMOKE) app.on('second-instance', function () {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(function () {
    buildMenu();
    createWindow();
    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  });
}
