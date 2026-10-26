// كل ملف واجهة تحمّله الصفحة يجب أن يكون مسموحاً في خادم المكتب، وفي السحابة، ومنسوخاً في بناء السحابة
// (كان بناء السحابة يفوّت ملفات جديدة فتعمل الميزة في المكتب ولا تعمل على demo)
'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..', '..');
const rd = f => fs.readFileSync(path.join(R, f), 'utf8');
const arr = (src, rx) => { const m = rx.exec(src); assert.ok(m, 'لم يُعثر على القائمة ' + rx); return Function('return ' + m[1])() };

test('ملفات الصفحة الرئيسية مسموحة ومنسوخة في المكتب والسحابة', () => {
  const idx = [...rd('office/index.html').matchAll(/(?:src|href)="([\w.-]+\.(?:js|css|webp|jpg|png))"/g)].map(m => m[1]);
  const off = rd('office/server.js'), cl = rd('cloud/src/office.js');
  const admO = arr(off, /ADMIN_FILES = new Set\((\[[^\]]*\])\)/), pubO = arr(off, /PUBLIC_FILES = new Set\((\[[^\]]*\])\)/);
  const admC = arr(cl, /ADMIN_FILES = new Set\((\[[^\]]*\])\)/), pubC = arr(cl, /PUBLIC_FILES = new Set\((\[[^\]]*\])\)/);
  const ui = arr(rd('cloud/tools/build.mjs'), /const UI = (\[[^\]]*\])/);
  for (const f of idx) {
    assert.ok(admO.includes(f) || pubO.includes(f), `${f}: غير مسموح في خادم المكتب`);
    assert.ok(admC.includes(f) || pubC.includes(f), `${f}: غير مسموح في السحابة`);
    assert.ok(ui.includes(f), `${f}: لا يُنسخ في بناء السحابة (cloud/tools/build.mjs)`);
  }
  for (const f of ['genie-face.webp']) { assert.ok(admO.includes(f) && admC.includes(f) && ui.includes(f), f + ' ناقص'); assert.ok(fs.existsSync(path.join(R, 'office', f)), f + ' غير موجود') }
});
