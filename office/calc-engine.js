/* الحاسبات القانونية: تعويض حوادث الطرق (قانون التأمين 20/2005)، الحقوق العمالية (قانون العمل 7/2000)، رسوم المحاكم (قرار 6/2023).
   حساب حتمي بلا ذكاء اصطناعي: كل سطر يحمل رقم المادة ونصها. ما لا نص له (سن نهاية العمل، نسبة خصم الدفع الفوري) يُدخله المحامي ويُعلَّم «تقدير». */
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else root.MQCALC = factory() })(typeof self !== 'undefined' ? self : this, function () {
'use strict';
const r2 = n => Math.round((+n || 0) * 100) / 100;
const num = (v, d = 0) => { const n = parseFloat(String(v == null ? '' : v).replace(/[,،\s]/g, '')); return isFinite(n) ? n : d };
const days = (a, b) => { const x = new Date(a), y = new Date(b); return isNaN(x) || isNaN(y) ? 0 : Math.max(0, Math.round((y - x) / 864e5)) };

/* ── نصوص المواد المعتمدة (قانون التأمين 20/2005) ── */
const INS = {
  144: 'م144/2: مسؤولية من يستعمل المركبة كاملة ومطلقة عن تعويض المصاب بغض النظر عن وجود خطأ من جانبه أو من جانب المصاب.',
  152.1: 'م152/1: خمسون ديناراً عن كل واحد بالمائة من نسبة العجز الدائم.',
  152.2: 'م152/2: أربعون ديناراً عن كل ليلة يمكثها المصاب في المشفى أو أية مؤسسة علاجية بسبب الحادث.',
  152.3: 'م152/3: خمسمائة دينار عن العملية أو العمليات الجراحية التي أجريت للمصاب بسبب الحادث واستلزمت مكوثه في المشفى.',
  152.4: 'م152/4: إذا لم يستحق المصاب تعويضاً بموجب الفقرات (1،2،3) يحق له تعويض لا يزيد عن خمسمائة دينار.',
  153: 'م153: لا يجوز أن يزيد مجموع التعويض عن الأضرار المعنوية عن عشرة آلاف دينار أردني.',
  154: 'م154: عند الوفاة يُدفع للورثة خمسون بالمائة من الحد الأقصى في م153 مطروحاً منه حصة الورثة المعالين وفق حجة حصر الإرث.',
  155: 'م155: لا يؤخذ في الاعتبار الدخل الذي يزيد على مثلي معدل الأجور في الحقل الاقتصادي للمصاب وفق آخر نشرة للجهاز المركزي للإحصاء.',
  156: 'م156: يستحق المصاب 100% من أجره اليومي طيلة مدة عجزه المؤقت على ألا تتجاوز سنتين من تاريخ الحادث.',
  157: 'م157: عند احتساب التعويض عن فقدان المقدرة على الكسب المستقبلي يجري خصم مقابل الدفع الفوري.',
  160: 'م160: دفعة مستعجلة خلال 30 يوماً: نفقات العلاج، ودفعات شهرية تُحدد بدخل الثلاثة أشهر السابقة للحادث بسقف م155.',
  165: 'م165: لا يجوز أن يزيد مجموع الدفعات الشهرية عن اثنتي عشرة دفعة.',
  168: 'م168/3: المبالغ المدفوعة للمستدعي جزء من إجمالي التعويض المستحق.',
  148: 'م148: الإخطار بوقوع الحادث خلال ثلاثين يوماً.',
  159: 'م159: تتقادم الدعوى إذا لم ترفع خلال ثلاث سنوات من الحادث أو من التقرير الطبي النهائي.',
};
/* ── نصوص المواد المعتمدة (قانون العمل 7/2000) ── */
const LAB = {
  25: 'م25: لا تزيد مدة العقد محدد المدة بما في ذلك التجديد على سنتين متتاليتين.', 26: 'م26: استمرار تنفيذ العقد محدد المدة بعد انقضائه يجعله غير محدد المدة.',
  42.2: 'م42/2: عند الاستقالة: ثلث المكافأة خلال السنوات الخمس الأولى، وثلثاها خلال الخمس التالية، وكاملة بعد عشر سنوات.',
  45: 'م45: مكافأة نهاية خدمة مقدارها أجر شهر عن كل سنة على أساس آخر أجر دون ساعات العمل الإضافية، وتحتسب كسور السنة، لمن أمضى سنة.',
  46: 'م46/1: إنهاء العقد غير محدد المدة بإشعار قبل شهر. م46/3: الإنهاء دون أسباب موجبة تعسفي.',
  47: 'م47: تعويض الفصل التعسفي أجر شهرين عن كل سنة على ألا يتجاوز أجر سنتين.',
  48: 'م48: للعامل بالقطعة أو بالعمولة تُحسب المكافأة والتعويض على متوسط أجره الشهري في السنة الأخيرة.',
  74: 'م74/1: إجازة سنوية مدفوعة الأجر أسبوعان عن كل سنة، وثلاثة أسابيع للأعمال الخطرة أو لمن أمضى خمس سنوات. م74/4: لا تُجمَّع لأكثر من سنتين.',
  79: 'م79: إجازة مرضية بأجر كامل 14 يوماً وبنصف الأجر 14 يوماً أخرى في السنة، بتقرير اللجنة الطبية.',
  89: 'م89: لا يجوز أن يقل أجر العامل عن الحد الأدنى المقر قانوناً.',
  119: 'م119: 75% من الأجر اليومي طيلة العجز المؤقت عن إصابة العمل بما لا يتجاوز 180 يوماً.',
  120: 'م120/1: الوفاة أو العجز الكلي الدائم: أجر 3500 يوم عمل أو 80% من الأجر الأساسي عن المدة المتبقية حتى سن الستين أيهما أكثر. م120/2: العجز الجزئي بنسبته بما لا يتجاوز تعويض العجز الكلي.',
  124: 'م124: يسقط حق المصاب بالمطالبة عن إصابة العمل بانقضاء سنتين على وقوعها ما لم يكن التأخير لعدم استقرار الإصابة أو عذر مشروع.',
  130: 'م130: يحسب تعويض إصابة العمل على أساس متوسط الأجر لآخر ثلاثة أشهر.',
};
const EST = 'تقدير قضائي لا نص صريح فيه؛ أدخله المحامي';

/* ── تعويض حوادث الطرق ── */
function insurance(i) {
  const L = [], notes = [], warn = [], add = (k, label, amount, basis, extra) => L.push({ k, label, amount: r2(amount), basis, ...(extra || {}) });
  /* مبالغ م152–154 بالدينار الأردني؛ تُحوَّل إلى عملة الأجر بسعر يدخله المحامي */
  const cur = i.currency || 'JOD', fx = cur === 'JOD' ? 1 : (num(i.fxJod, 0) || 1), J = (jod, extra) => ({ ...(extra || {}), jod: r2(jod), ...(fx !== 1 ? { detail: ((extra && extra.detail) ? extra.detail + ' · ' : '') + `${r2(jod)} دينار × ${fx}` } : {}) });
  const disab = Math.min(100, Math.max(0, num(i.disability))), nights = Math.max(0, num(i.nights)), ops = num(i.operations) > 0;
  /* 1) الضرر المعنوي م152 بسقف م153 */
  let m1 = disab * 50, m2 = nights * 40, m3 = ops ? 500 : 0, moral = m1 + m2 + m3, minFlag = false;
  if (i.died) { const share = Math.min(100, Math.max(0, num(i.dependantsShare))); moral = 5000 * (1 - share / 100); add('death', 'تعويض الورثة عن الوفاة', moral * fx, INS[154], J(moral, { detail: `50% × 10,000 = 5,000 دينار − حصة المعالين ${share}%` })) }
  else {
    if (m1) add('disab', `العجز الدائم ${disab}% × 50 دينار`, m1 * fx, INS[152.1], J(m1));
    if (m2) add('nights', `${nights} ليلة مستشفى × 40 دينار`, m2 * fx, INS[152.2], J(m2));
    if (m3) add('ops', 'العمليات الجراحية (500 دينار)', m3 * fx, INS[152.3], J(m3));
    if (!moral) { moral = 500; minFlag = true; add('min', 'تعويض معنوي بديل (حد أقصى)', 500 * fx, INS[152.4], J(500, { est: 'حتى 500 دينار بتقدير المحكمة' })) }
    if (moral > 10000) { add('cap', 'تخفيض إلى سقف الضرر المعنوي (10,000 دينار)', (10000 - moral) * fx, INS[153], J(10000 - moral)); moral = 10000 }
  }
  /* 2) الأجر المعتمد بسقف مثلي معدل الأجور م155 */
  const wage = num(i.monthlyWage), avg = num(i.sectorAvgWage), capW = avg > 0 ? avg * 2 : 0, usedW = capW && wage > capW ? capW : wage;
  if (capW && wage > capW) notes.push(`الأجر ${wage} يتجاوز مثلي معدل الأجور (${capW})، فاعتُمد ${capW} (م155).`);
  const daily = usedW / 30;
  /* 3) العجز المؤقت م156 */
  let tempDays = num(i.tempDays); if (!tempDays && i.accidentDate && i.returnDate) tempDays = days(i.accidentDate, i.returnDate);
  if (tempDays > 730) { notes.push('مدة العجز المؤقت تتجاوز سنتين، فحُدّت بـ730 يوماً (م156).'); tempDays = 730 }
  const temp = i.died ? 0 : daily * tempDays; if (temp) add('temp', `عجز مؤقت ${tempDays} يوماً × الأجر اليومي ${r2(daily)}`, temp, INS[156]);
  /* 4) فقدان الكسب المستقبلي: الأجر × نسبة العجز الوظيفي × الأشهر المتبقية حتى سن نهاية العمل، ثم خصم الدفع الفوري (م157) */
  const age = num(i.age), endAge = num(i.workEndAge, 60), disc = num(i.discountPct, 3), fdis = Math.min(100, Math.max(0, num(i.functionalDisability, disab)));
  let future = 0, futureNote = '';
  if (!i.died && fdis > 0 && usedW > 0 && age > 0 && endAge > age) {
    const years = endAge - age, gross = usedW * 12 * years * fdis / 100;
    /* خصم الدفع الفوري: قيمة حالية لدفعات سنوية متساوية بنسبة خصم disc% */
    const f = disc > 0 ? (1 - Math.pow(1 + disc / 100, -years)) / (disc / 100) / years : 1; future = gross * f; futureNote = `${usedW} × 12 × ${years} سنة × ${fdis}% = ${r2(gross)} ثم خصم الدفع الفوري ${disc}% سنوياً (معامل ${r2(f)})`;
    add('future', 'فقدان المقدرة على الكسب المستقبلي', future, INS[155] + ' ' + INS[157], { detail: futureNote, est: `سن نهاية العمل ${endAge} ونسبة الخصم ${disc}%: ${EST}` });
  } else if (i.died && usedW > 0 && age > 0 && endAge > age && num(i.dependantsShare) > 0) {
    const years = endAge - age, share = num(i.dependantsShare) / 100, gross = usedW * 12 * years * share, f = disc > 0 ? (1 - Math.pow(1 + disc / 100, -years)) / (disc / 100) / years : 1; future = gross * f;
    add('dependants', 'فقدان إعالة المعالين', future, INS[155] + ' ' + INS[157], { detail: `${usedW} × 12 × ${years} × حصة المعالين ${num(i.dependantsShare)}% ثم خصم ${disc}%`, est: EST });
  }
  /* 5) النفقات والدفعات المستعجلة */
  const med = num(i.medical); if (med) add('medical', 'نفقات العلاج والتمريض الموثقة', med, INS[160]);
  const paid = num(i.advancePaid); if (paid) add('advance', 'يُخصم: دفعات مستعجلة مدفوعة', -paid, INS[168]);
  /* 6) تنبيهات */
  if (i.accidentDate) { const d = days(i.accidentDate, i.today || new Date().toISOString().slice(0, 10)); if (d > 30 && !i.notified) warn.push('مضى أكثر من 30 يوماً على الحادث: تحقق من الإخطار (م148).'); if (d > 365 * 3) warn.push('مضت أكثر من ثلاث سنوات على الحادث: تحقق من التقادم وتاريخ التقرير الطبي النهائي (م159).') }
  const total = L.reduce((s, x) => s + x.amount, 0);
  return { lines: L, moral: r2(moral), total: r2(total), notes, warnings: warn, currency: cur, fxJod: fx, currencyNote: cur === 'JOD' ? 'كل المبالغ بالدينار الأردني.' : `مبالغ م152–154 بالدينار الأردني (${r2(moral)} دينار) حُوّلت بسعر ${fx} إلى ${cur === 'ILS' ? 'الشيكل' : cur}؛ راجع السعر يوم الحكم.`, wageUsed: r2(usedW), basisRefs: ['144', '152', '153', '154', '155', '156', '157', '160', '165', '168', '148', '159'].map(k => INS[k]) };
}

/* ── الحقوق العمالية ── */
function labour(i) {
  const L = [], notes = [], warn = [], add = (k, label, amount, basis, extra) => L.push({ k, label, amount: r2(amount), basis, ...(extra || {}) });
  const wage = num(i.monthlyWage), minW = num(i.minWage, 0);
  if (minW && wage && wage < minW) warn.push(`الأجر ${wage} أقل من الحد الأدنى ${minW}: يُطالَب بالفرق عن مدة الخدمة (م89).`);
  let years = num(i.years); if (!years && i.start && i.end) years = days(i.start, i.end) / 365.25;
  years = Math.max(0, years);
  const how = i.termination || 'dismissal'; /* dismissal | arbitrary | resignation | end_of_term | agreed */
  /* 1) مكافأة نهاية الخدمة م45 (+م42/2 عند الاستقالة) */
  if (years < 1) notes.push('مدة الخدمة أقل من سنة: لا تستحق مكافأة نهاية الخدمة (م45).');
  else {
    const full = wage * years; let frac = 1, why = '';
    if (how === 'resignation' && !i.justifiedLeave) { frac = years < 5 ? 1 / 3 : years < 10 ? 2 / 3 : 1; why = frac < 1 ? ` × ${frac === 1 / 3 ? 'الثلث' : 'الثلثان'} (استقالة)` : '' }
    add('eos', `مكافأة نهاية الخدمة: ${wage} × ${r2(years)} سنة${why}`, full * frac, LAB[45] + (why ? ' ' + LAB[42.2] : ''), i.commission ? { est: 'العامل بالقطعة/بالعمولة: على متوسط أجر السنة الأخيرة (م48)' } : undefined);
  }
  /* 2) بدل الإشعار م46 */
  if ((how === 'dismissal' || how === 'arbitrary') && !i.noticeGiven && i.contract !== 'fixed') add('notice', 'بدل الإشعار (شهر)', wage, LAB[46]);
  /* 3) الفصل التعسفي م47 */
  if (how === 'arbitrary') { const comp = Math.min(wage * 2 * years, wage * 24); add('arb', `تعويض الفصل التعسفي: شهران × ${r2(years)} سنة${wage * 2 * years > wage * 24 ? ' (حُدّ بأجر سنتين)' : ''}`, comp, LAB[47]) }
  if (i.contract === 'fixed') { if (years > 2) notes.push('العقد محدد المدة تجاوز سنتين فيُعتبر غير محدد المدة (م25، م26).'); else if (how === 'arbitrary') notes.push('إنهاء العقد محدد المدة قبل أجله: يُطالب عادة بأجر المدة المتبقية؛ أدخله في «مبالغ أخرى».') }
  /* 4) الإجازات السنوية غير المستعملة م74 */
  const leaveYears = Math.min(2, num(i.unusedLeaveYears)); if (leaveYears > 0) { const wk = (i.hazardous || years >= 5) ? 3 : 2; const amt = wage / 30 * 7 * wk * leaveYears; add('leave', `بدل إجازة سنوية غير مستعملة: ${wk} أسابيع × ${leaveYears} سنة`, amt, LAB[74]); if (num(i.unusedLeaveYears) > 2) notes.push('لا تُجمَّع الإجازات لأكثر من سنتين (م74/4).') }
  /* 5) أجور متأخرة ومبالغ أخرى */
  const unpaid = num(i.unpaidWages); if (unpaid) add('unpaid', 'أجور متأخرة غير مدفوعة', unpaid, 'م82: لا يجوز تأخير دفع الأجر أكثر من خمسة أيام من الاستحقاق.');
  const ot = num(i.overtime); if (ot) add('ot', 'بدل عمل إضافي', ot, 'يُدخله المحامي بحسب كشوف الدوام؛ لا يدخل في أساس المكافأة (م45).');
  const other = num(i.other); if (other) add('other', i.otherLabel || 'مبالغ أخرى', other, '');
  /* 6) إصابة العمل */
  if (i.injury) {
    const avg3 = num(i.avg3Wage, wage), daily = avg3 / 30;
    const td = Math.min(180, num(i.injuryTempDays)); if (td) add('inj_temp', `عجز مؤقت عن إصابة عمل: 75% × ${r2(daily)} × ${td} يوماً`, 0.75 * daily * td, LAB[119] + ' ' + LAB[130]);
    const pd = Math.min(100, num(i.injuryDisability)), age = num(i.age);
    if (pd > 0 || i.injuryDeath) { const a = daily * 3500, b = age > 0 && age < 60 ? 0.8 * avg3 * 12 * (60 - age) : 0, base = Math.max(a, b); const amt = i.injuryDeath ? base : base * pd / 100; add('inj_perm', i.injuryDeath ? 'تعويض الوفاة عن إصابة العمل' : `عجز دائم ${pd}% من تعويض العجز الكلي`, amt, LAB[120] + ' ' + LAB[130], { detail: `أجر 3500 يوم = ${r2(a)}؛ 80% حتى الستين = ${r2(b)}؛ الأكبر ${r2(base)}` }) }
    if (num(i.injuryTempDays) > 180) notes.push('العجز المؤقت عن الإصابة حُدّ بـ180 يوماً (م119).');
  }
  const total = L.reduce((s, x) => s + x.amount, 0);
  return { lines: L, total: r2(total), years: r2(years), notes, warnings: warn, basisRefs: ['25', '26', '42.2', '45', '46', '47', '48', '74', '89', '119', '120', '124', '130'].map(k => LAB[k]) };
}

/* ── رسوم المحاكم (قرار مجلس الوزراء 6/2023 بتعديل جدول رسوم المحاكم النظامية) — الأرقام قابلة للتعديل ── */
const FEES_DEFAULT = { magPct: 1, magMin: 30, magMax: 100, firstPct1: 1, firstBand: 70000, firstPct2: 0.5, firstMax: 1000, appealFrac: 0.5, execPct: 1, execMaxMag: 100, execMaxFirst: 1000, magLimit: 10000, source: 'قرار مجلس الوزراء رقم (6) لسنة 2023 بتعديل جدول رسوم المحاكم النظامية (بالدينار الأردني)' };
function fees(i, cfg) {
  const c = { ...FEES_DEFAULT, ...(cfg || {}) }, v = num(i.value), L = [], add = (label, amount, basis) => L.push({ label, amount: r2(amount), basis });
  const mag = i.court === 'mag' || (i.court !== 'first' && v > 0 && v <= c.magLimit);
  let first;
  if (mag) first = Math.min(c.magMax, Math.max(c.magMin, v * c.magPct / 100));
  else first = Math.min(c.firstMax, Math.min(v, c.firstBand) * c.firstPct1 / 100 + Math.max(0, v - c.firstBand) * c.firstPct2 / 100);
  add(`رسم الدعوى (${mag ? 'صلح' : 'بداية'}) عن قيمة ${v}`, first, mag ? `${c.magPct}% بحد أدنى ${c.magMin} وأقصى ${c.magMax} دينار` : `${c.firstPct1}% عن أول ${c.firstBand} ثم ${c.firstPct2}% بسقف ${c.firstMax} دينار`);
  if (i.appeal) add('رسم الاستئناف', first * c.appealFrac, 'نصف الرسم المدفوع في محكمة أول درجة (سادساً/1)');
  if (i.cassation) add('رسم النقض', first * c.appealFrac, 'تسري على النقض أحكام الاستئناف (سابعاً/1)');
  if (i.execution) add('رسم التنفيذ', Math.min(mag ? c.execMaxMag : c.execMaxFirst, v * c.execPct / 100), `${c.execPct}% من المحكوم به بسقف ${mag ? c.execMaxMag : c.execMaxFirst} دينار (ثامناً)`);
  return { lines: L, total: r2(L.reduce((s, x) => s + x.amount, 0)), source: c.source, note: 'الجدول عُدّل في 2022 و2023؛ راجع الأرقام في الإعدادات قبل الاعتماد. الدعاوى العمالية والجزائية لها أحكام إعفاء خاصة.' };
}
/* فائدة اختيارية بنسبة يحددها المحامي (لا نص فلسطيني عام يقرر فائدة قانونية) */
function interest(i) {
  const p = num(i.principal), rate = num(i.ratePct), d = i.from && i.to ? days(i.from, i.to) : num(i.days);
  const amt = p * rate / 100 * d / 365; return { days: d, amount: r2(amt), total: r2(p + amt), note: 'حساب بسيط (غير مركب) بنسبة يدخلها المحامي؛ استحقاق الفائدة ونسبتها مسألة تقديرية أمام المحاكم الفلسطينية.' };
}
return { insurance, labour, fees, interest, FEES_DEFAULT, INS, LAB };
});
