'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const M = require('../lib/muqtafi.js');
const fx = n => fs.readFileSync(path.join(__dirname, 'fixtures', 'muqtafi', n), 'utf8');

test('المقتفي: صفحة النتائج → عدد النتائج وتنبيه التضييق وصفوف الأحكام بروابطها', () => {
  const r = M.parseResults(fx('results.html'));
  assert.equal(r.total, 758); assert.equal(r.narrow, true); assert.equal(r.loginRequired, false);
  assert.equal(r.results.length, 3);
  const a = r.results[0];
  assert.deepEqual([a.id, a.no, a.year, a.date, a.court, a.city, a.litigation, a.field], [104321, '520', '2016', '2019-02-10', 'النقض', 'رام الله', 'دعوى', 'حقوق']);
  assert.match(a.cardUrl, /ViewCJCard\.aspx\?CJID=104321$/); assert.match(a.textUrl, /CJFullText\.aspx\?CJID=104321$/); assert.match(a.pdfUrl, /ShowDoc\.aspx\?ID=104321$/);
  assert.equal(M.parseResults('<html><input name="ctl00$LoginView1$LogInCont1$Login1$UserName"></html>').loginRequired, true);
});

test('المقتفي: النص الكامل → الأقسام الخمسة وتاريخ الفصل والمواد المشار إليها', () => {
  const f = M.parseFullText(fx('fulltext.html'));
  assert.deepEqual(Object.keys(f.sections), ['judges', 'facts', 'reasoning', 'verdict', 'conclusions']);
  assert.match(f.sections.verdict, /تقرر المحكمة رد الطعن موضوعاً/);
  assert.ok(!/<|&nbsp;/.test(f.text), 'بلا وسوم'); assert.ok(f.text.length > 8000);
  assert.equal(f.decided, '2019-02-10');
  assert.equal(f.laws.length, 11); assert.deepEqual(f.laws[6], { legId: 13975, article: 24, text: 'المادة (24) من قانون العمل رقم 7 لسنة 2000' });
  assert.match(f.text, /^الديباجة\n/); assert.ok(f.text.includes('\n\nالتسبيب\n'));
});

test('المقتفي: بطاقة الحكم → الرأس والمبادئ والنصوص القانونية والأحكام ذات العلاقة ومسارات الكشاف', () => {
  const c = M.parseCard(fx('card.html'));
  assert.deepEqual([c.court, c.city, c.domain, c.no, c.year, c.date, c.litigation], ['النقض', 'رام الله', 'الدعوى الحقوقية', '520', '2016', '2019-02-10', 'دعوى']);
  assert.equal(c.principles.length, 4); assert.match(c.principles[2].text, /^عقد العمل محدد المدة يتم تكييفه/);
  assert.equal(c.laws.length, 11); assert.equal(c.laws[3].kind, 'تطبيق'); assert.equal(c.laws[3].linked, 187); assert.equal(c.laws[9].text, 'قانون العمل الفلسطيني');
  assert.deepEqual(c.related, [{ id: 104322, title: 'حكم محكمة الإستئناف المنعقدة في رام الله في الدعوى الحقوقية رقم 985 لسنة 2014' }]);
  assert.equal(c.paths.length, 5); assert.equal(c.paths[0], 'حقوق > عمل > مكافأة نهاية الخدمة');
});

test('المقتفي: التحويل إلى سجل مكتبة الاجتهادات (المبادئ جاهزة من البطاقة، المجال من الكشاف)', () => {
  const r = M.parseResults(fx('results.html')).results[0], c = M.parseCard(fx('card.html')), f = M.parseFullText(fx('fulltext.html'));
  const x = M.toRuling(r, c, f);
  assert.equal(x.court, 'محكمة النقض'); assert.equal(x.no, 'دعوى 520/2016'); assert.equal(x.date, '2019-02-10'); assert.equal(x.field, 'عمالي');
  assert.match(x.principle, /^1- صدور حكم/); assert.ok(x.principle.includes('\n3- عقد العمل'));
  assert.ok(x.keywords.includes('مكافأة نهاية الخدمة')); assert.match(x.summary, /رد الطعن موضوعاً/);
  assert.equal(x.muqtafiId, 104321); assert.match(x.srcUrl, /CJID=104321/); assert.equal(x.src, 'المقتفي · معهد الحقوق – جامعة بيرزيت');
  assert.equal(x.text.length, f.text.length);
});

test('المقتفي: نموذج الدخول → تُنسخ الحقول المخفية ولا يُطبع شيء من كلمة المرور في المفاتيح', () => {
  const html = '<form><input type="hidden" name="__VIEWSTATE" id="__VIEWSTATE" value="abc=="><input type="hidden" name="__EVENTVALIDATION" value="x&amp;y"></form>';
  const b = M.loginBody(html, 'office', 'p@ss');
  assert.equal(b.get('__VIEWSTATE'), 'abc=='); assert.equal(b.get('__EVENTVALIDATION'), 'x&y');
  assert.equal(b.get('ctl00$LoginView1$LogInCont1$Login1$UserName'), 'office'); assert.equal(b.get('ctl00$LoginView1$LogInCont1$Login1$Password'), 'p@ss');
});
