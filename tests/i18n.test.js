'use strict';
/* Тесты локали: интерфейс двуязычный, и перевод не должен «терять» ключи.
   Раньше это проверялось глазами — теперь тестом: наборы ru/en совпадают,
   строки не пустые, подстановки {..} одни и те же, а разметка не ссылается
   на несуществующие ключи. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const I18N = require('../assets/i18n.js');
const E = require('../assets/engine.js');

const RU = I18N.dict.ru;
const EN = I18N.dict.en;

test('ru и en: одинаковый набор ключей', () => {
  const ru = Object.keys(RU).sort();
  const en = Object.keys(EN).sort();
  assert.deepEqual(ru.filter((k) => !(k in EN)), [], 'ключей нет в en');
  assert.deepEqual(en.filter((k) => !(k in RU)), [], 'ключей нет в ru');
  assert.ok(ru.length > 380, `ключей в словаре: ${ru.length}`);
});

test('ни одна строка не пустая', () => {
  for (const lang of ['ru', 'en']) {
    for (const [k, v] of Object.entries(I18N.dict[lang])) {
      assert.ok(String(v).trim().length > 0, `${lang}.${k} пустая`);
    }
  }
});

test('подстановки {..} совпадают в ru и en', () => {
  const vars = (s) => (String(s).match(/\{[a-zA-Z0-9]+\}/g) || []).sort().join(',');
  for (const k of Object.keys(RU)) {
    assert.equal(vars(RU[k]), vars(EN[k]), `подстановки разошлись: ${k}`);
  }
});

test('у каждого уровня есть название и пояснение на обоих языках', () => {
  for (const lv of E.LEVELS) {
    for (const lang of ['ru', 'en']) {
      for (const part of ['title', 'note']) {
        const key = 'level.' + lv.id + '.' + part;
        assert.ok(I18N.dict[lang][key], `нет ${lang}.${key}`);
      }
    }
  }
});

test('в разметке нет ссылок на несуществующие ключи', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const re = /data-i18n(?:-html|-title|-aria|-ph)?="([^"]+)"/g;
  const bad = [];
  let m;
  while ((m = re.exec(html))) {
    if (!RU[m[1]]) bad.push(m[1]);
  }
  assert.deepEqual(bad, []);
});
