/* Сборка веб-папки для статического хостинга (Netlify, Cloudflare Pages, Vercel).
   Кладёт в dist-web/ только то, что нужно браузеру: страницу, скрипты, иконки,
   манифест, service worker и файл заголовков. Ни node_modules, ни desktop/,
   ни тесты, ни документация туда не попадают.
   Запуск: node tools/build-web.js  (или npm run web) */
'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var OUT = path.join(ROOT, 'dist-web');
var pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

var FILES = [
  'index.html',
  'privacy.html',
  'manifest.json',
  'sw.js',
  'assets/styles.css',
  'assets/i18n.js',
  'assets/engine.js',
  'assets/solver.js',
  'assets/app.js',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png',
  'assets/icons/apple-touch-icon-180.png'
];

/* Netlify и Cloudflare Pages читают _headers. Service worker и страницу
   нельзя кэшировать надолго: иначе новая версия не доедет до игравших. */
var HEADERS = [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: no-referrer',
  '',
  '/index.html',
  '  Cache-Control: no-cache',
  '',
  '/sw.js',
  '  Cache-Control: no-cache',
  '',
  '/manifest.json',
  '  Cache-Control: no-cache',
  '',
  '/assets/*',
  '  Cache-Control: public, max-age=3600',
  ''
].join('\n');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

var total = 0;
FILES.forEach(function (rel) {
  var from = path.join(ROOT, rel);
  var to = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  total += fs.statSync(to).size;
});

fs.writeFileSync(path.join(OUT, '_headers'), HEADERS);

/* Версия service worker-кэша должна совпадать с версией сборки: иначе у тех,
   кто уже открывал игру, останется старый app.js. Сверяем, а не правим молча. */
var sw = fs.readFileSync(path.join(OUT, 'sw.js'), 'utf8');
var m = sw.match(/var CACHE = 'fox-hunt-([\d.]+)'/);
var problems = [];
if (!m) problems.push('в sw.js не найден CACHE вида fox-hunt-<версия>');
else if (m[1] !== pkg.version) {
  problems.push('CACHE в sw.js = ' + m[1] + ', а package.json = ' + pkg.version);
}

FILES.forEach(function (rel) {
  if (!fs.existsSync(path.join(OUT, rel))) problems.push('не скопирован ' + rel);
});

console.log('dist-web: ' + FILES.length + ' файлов, ' +
  (total / 1024).toFixed(0) + ' КБ, версия ' + pkg.version);
if (problems.length) {
  console.error('ПРОБЛЕМЫ:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log('OK: список файлов, версия кэша и пакет согласованы');
