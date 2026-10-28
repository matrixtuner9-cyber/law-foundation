'use strict';
/* المِسْبار المحلي: بحث وتحليل قانوني على الجهاز من القاعدة المحلية وحدها، دون إنترنت ودون نموذج لغوي.
   لا يكتب نصاً من عنده ولا يستنتج حكماً: كل ما يعرضه إما منقول حرفياً من القاعدة أو محسوب من نص المستخدم
   (التواريخ والمدد والمبالغ والأرقام والمواد المذكورة)، مع بيان سبب ظهور كل نتيجة. */
const { norm } = require('./misbar');

const clip = (s, n) => String(s ?? '').trim().slice(0, n);
const AR = '٠١٢٣٤٥٦٧٨٩';
const lat = s => String(s ?? '').replace(/[٠-٩]/g, c => AR.indexOf(c)).replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x6F0));
const flat = s => lat(String(s ?? '')).replace(/[ـ]/g, '').replace(/[ً-ْٰ]/g, '');

/* ── القوانين الفلسطينية الأساسية: أسماء مختصرة يتداولها المحامون → عبارة تُطابق عنوان التشريع في القاعدة ── */
const LAWS = [
  { key: 'usul', title: 'أصول المحاكمات المدنية والتجارية', alias: ['قانون الأصول', 'الأصول المدنية', 'أصول المحاكمات المدنية', 'أصول المحاكمات المدنية والتجارية'] },
  { key: 'usulshari', title: 'أصول المحاكمات الشرعية', alias: ['أصول المحاكمات الشرعية'] },
  { key: 'bayyinat', title: 'البينات', alias: ['قانون البينات', 'البينات في المواد المدنية والتجارية'] },
  { key: 'tort', title: 'المخالفات المدنية', alias: ['المخالفات المدنية', 'قانون المخالفات'] },
  { key: 'majalla', title: 'مجلة الأحكام العدلية', alias: ['المجلة', 'مجلة الأحكام العدلية', 'مجلة الأحكام'] },
  { key: 'labour', title: 'العمل الفلسطيني', alias: ['قانون العمل', 'قانون العمل الفلسطيني'] },
  { key: 'rent', title: 'المالكين والمستأجرين', alias: ['المالكين والمستأجرين', 'قانون المالكين'] },
  { key: 'exec', title: 'التنفيذ', alias: ['قانون التنفيذ'] },
  { key: 'trade', title: 'التجارة', alias: ['قانون التجارة'] },
  { key: 'companies', title: 'الشركات', alias: ['قانون الشركات', 'القرار بقانون بشأن الشركات'] },
  { key: 'arbitration', title: 'التحكيم', alias: ['قانون التحكيم'] },
  { key: 'penal', title: 'العقوبات', alias: ['قانون العقوبات'] },
  { key: 'crimproc', title: 'الإجراءات الجزائية', alias: ['قانون الإجراءات الجزائية', 'الإجراءات الجزائية', 'قانون الإجراءات'] },
  { key: 'personal', title: 'الأحوال الشخصية', alias: ['قانون الأحوال الشخصية'] },
  { key: 'fees', title: 'رسوم المحاكم النظامية', alias: ['قانون رسوم المحاكم', 'رسوم المحاكم'] },
  { key: 'courts', title: 'تشكيل المحاكم النظامية', alias: ['قانون تشكيل المحاكم', 'تشكيل المحاكم النظامية'] },
  { key: 'notary', title: 'الكاتب العدل', alias: ['قانون الكاتب العدل'] },
  { key: 'insurance', title: 'التأمين', alias: ['قانون التأمين'] },
  { key: 'consumer', title: 'حماية المستهلك', alias: ['قانون حماية المستهلك'] },
  { key: 'cyber', title: 'الجرائم الإلكترونية', alias: ['الجرائم الإلكترونية'] },
  { key: 'traffic', title: 'المرور', alias: ['قانون المرور'] },
  { key: 'drugs', title: 'مكافحة المخدرات والمؤثرات العقلية', alias: ['قانون المخدرات', 'مكافحة المخدرات'] },
  { key: 'civilservice', title: 'الخدمة المدنية', alias: ['قانون الخدمة المدنية'] },
  { key: 'pension', title: 'التقاعد العام', alias: ['قانون التقاعد العام', 'قانون التقاعد'] },
  { key: 'incometax', title: 'ضريبة الدخل', alias: ['قانون ضريبة الدخل'] },
  { key: 'juvenile', title: 'حماية الأحداث', alias: ['قانون حماية الأحداث', 'قانون الأحداث'] },
  { key: 'child', title: 'الطفل الفلسطيني', alias: ['قانون الطفل'] },
  { key: 'expropriation', title: 'الاستملاك', alias: ['قانون الاستملاك'] },
  { key: 'landsettle', title: 'تسوية الأراضي والمياه', alias: ['قانون تسوية الأراضي'] },
  { key: 'ottomanland', title: 'الأراضي العثماني', alias: ['قانون الأراضي العثماني'] },
  { key: 'weapons', title: 'الأسلحة النارية والذخائر', alias: ['قانون الأسلحة'] },
  { key: 'lawyers', title: 'المحامين النظاميين', alias: ['قانون المحامين'] },
];

/* ── موضوعات قانونية: كلمات دالّة في نص المستخدم → التشريعات المعنية وعبارة بحث في الأحكام.
   هذه إشارات للبحث لا قواعد قانونية: الموضوع يُعرض مع الكلمات التي أظهرته ليقدّر المحامي صلته ── */
const TOPICS = [
  { id: 'notice', label: 'التبليغات', w: ['تبليغ', 'التبليغ', 'مذكرة دعوى', 'ورقة قضائية', 'مأمور التبليغ', 'الموطن المختار', 'النشر في الصحف'], laws: ['usul'], q: 'تبليغ اوراق قضائية بطلان التبليغ' },
  { id: 'jurisdiction', label: 'الاختصاص', w: ['اختصاص', 'الاختصاص القيمي', 'الاختصاص المكاني', 'الاختصاص النوعي', 'عدم الاختصاص', 'محكمة الصلح', 'محكمة البداية'], laws: ['usul', 'courts'], q: 'الدفع بعدم الاختصاص' },
  { id: 'appeal', label: 'الطعن ومواعيده', w: ['استئناف', 'نقض', 'الطعن', 'ميعاد الطعن', 'مدة الطعن', 'لائحة الاستئناف', 'لائحة الطعن', 'اعتراض الغير', 'إعادة المحاكمة'], laws: ['usul'], q: 'ميعاد الطعن رد الطعن شكلا' },
  { id: 'evidence', label: 'الإثبات والبينات', w: ['بينة', 'البينات', 'شاهد', 'الشهود', 'شهادة', 'اليمين', 'إقرار', 'الإقرار', 'خبرة', 'خبير', 'سند عادي', 'سند رسمي', 'إنكار التوقيع', 'الادعاء بالتزوير', 'قرينة'], laws: ['bayyinat'], q: 'عبء الاثبات البينة الشخصية' },
  { id: 'tort', label: 'التعويض عن الضرر', w: ['تعويض', 'ضرر', 'الضرر', 'إهمال', 'الإهمال', 'مسؤولية تقصيرية', 'مخالفة مدنية', 'عطل وضرر'], laws: ['tort'], q: 'التعويض عن الضرر الاهمال' },
  { id: 'accident', label: 'حوادث الطرق والتأمين', w: ['حادث سير', 'حادث طرق', 'مركبة', 'سيارة', 'شركة التأمين', 'تأمين إلزامي', 'صندوق تعويض مصابي', 'مصاب', 'إصابة جسدية', 'عجز'], laws: ['insurance', 'traffic'], q: 'تعويض مصابي حوادث الطرق شركة التامين' },
  { id: 'labour', label: 'العمل والعمال', w: ['عامل', 'العامل', 'العمال', 'صاحب العمل', 'مكافأة نهاية الخدمة', 'نهاية الخدمة', 'فصل تعسفي', 'الفصل التعسفي', 'أجور', 'الأجر', 'بدل إشعار', 'إجازة سنوية', 'ساعات العمل', 'إصابة عمل'], laws: ['labour'], q: 'مكافاة نهاية الخدمة الفصل التعسفي' },
  { id: 'rent', label: 'الإيجار والإخلاء', w: ['مستأجر', 'المستأجر', 'المأجور', 'مأجور', 'بدل الإيجار', 'الأجرة', 'إخلاء', 'الإخلاء', 'عقد إيجار', 'إيجار', 'المؤجر'], laws: ['rent'], q: 'اخلاء الماجور عدم دفع الاجرة' },
  { id: 'exec', label: 'التنفيذ', w: ['تنفيذ', 'دائرة التنفيذ', 'قاضي التنفيذ', 'حجز', 'الحجز', 'حبس المدين', 'سند تنفيذي', 'إخطار تنفيذي', 'ملف تنفيذي'], laws: ['exec'], q: 'دائرة التنفيذ حبس المدين' },
  { id: 'cheque', label: 'الشيكات والأوراق التجارية', w: ['شيك', 'الشيك', 'شيكات', 'كمبيالة', 'سند سحب', 'سند لأمر', 'الرصيد', 'عدم كفاية الرصيد', 'بدون رصيد', 'لا يقابله رصيد', 'شيك مرتجع'], laws: ['trade', 'penal'], q: 'شيك عدم كفاية الرصيد' },
  { id: 'companies', label: 'الشركات والشراكة', w: ['شركة', 'الشركة', 'شريك', 'الشركاء', 'مساهم', 'تصفية الشركة', 'مدير الشركة', 'شركة تضامن', 'محدودة المسؤولية'], laws: ['companies', 'trade'], q: 'الشركاء تصفية الشركة' },
  { id: 'contract', label: 'العقود والالتزامات', w: ['عقد', 'العقد', 'فسخ', 'الفسخ', 'بطلان العقد', 'إخلال', 'الإخلال', 'شرط جزائي', 'الشرط الجزائي', 'التزام', 'الالتزام', 'تعهد', 'بيع', 'البيع', 'ثمن'], laws: ['majalla'], q: 'فسخ العقد الاخلال بالالتزام' },
  { id: 'limitation', label: 'التقادم ومرور الزمن', w: ['تقادم', 'التقادم', 'مرور الزمن', 'سقوط الحق', 'مضي المدة', 'عدم سماع الدعوى', 'ميعاد رفع الدعوى', 'مدة رفع الدعوى', 'مدة التقادم'], laws: ['majalla'], q: 'مرور الزمن عدم سماع الدعوى' },
  { id: 'urgent', label: 'القضاء المستعجل والطلبات', w: ['مستعجل', 'المستعجلة', 'قاضي الأمور المستعجلة', 'وقف التنفيذ', 'حجز تحفظي', 'منع سفر', 'طلب مستعجل'], laws: ['usul'], q: 'قاضي الامور المستعجلة الضرر المحدق' },
  { id: 'arbitration', label: 'التحكيم', w: ['تحكيم', 'التحكيم', 'محكم', 'قرار التحكيم', 'شرط التحكيم'], laws: ['arbitration'], q: 'قرار التحكيم بطلان' },
  { id: 'crimproc', label: 'الإجراءات الجزائية', w: ['شكوى جزائية', 'الشكوى', 'شكوى', 'دعوى جزائية', 'الحق الشخصي', 'المدعي بالحق الشخصي', 'توقيف', 'التوقيف', 'الكفالة', 'النيابة العامة', 'النيابة', 'التحقيق', 'لائحة اتهام', 'القبض', 'التفتيش', 'إخلاء سبيل', 'متهم', 'المتهم', 'المشتكي'], laws: ['crimproc'], q: 'بطلان اجراءات التفتيش التوقيف' },
  { id: 'penal', label: 'الجرائم والعقوبات', w: ['جريمة', 'الجريمة', 'جنحة', 'جناية', 'سرقة', 'احتيال', 'إيذاء', 'قتل', 'تزوير', 'إساءة الأمانة', 'الذم', 'القدح', 'تهديد', 'الشروع', 'عقوبة', 'العقوبة', 'يعاقب', 'الحبس', 'السجن', 'الغرامة', 'إدانة'], laws: ['penal'], q: 'اركان الجريمة القصد الجرمي' },
  { id: 'personal', label: 'الأحوال الشخصية', w: ['طلاق', 'الطلاق', 'نفقة', 'النفقة', 'حضانة', 'الحضانة', 'مهر', 'المهر', 'زواج', 'الزواج', 'إرث', 'تركة', 'التركة', 'الورثة', 'حصر إرث'], laws: ['personal'], q: 'النفقة الحضانة' },
  { id: 'land', label: 'الأراضي والملكية العقارية', w: ['أرض', 'الأرض', 'قطعة', 'حوض', 'طابو', 'تسجيل الأراضي', 'تسوية', 'إزالة الشيوع', 'الشيوع', 'منع معارضة', 'إفراز', 'وكالة دورية', 'سند تسجيل', 'حيازة'], laws: ['ottomanland', 'landsettle'], q: 'منع معارضة في منفعة ارض' },
  { id: 'fees', label: 'الرسوم القضائية', w: ['رسوم', 'الرسوم', 'رسم الدعوى', 'تقدير الرسم'], laws: ['fees'], q: 'رسوم الدعوى' },
  { id: 'consumer', label: 'حماية المستهلك', w: ['مستهلك', 'المستهلك', 'غش تجاري', 'سلعة'], laws: ['consumer'], q: 'حماية المستهلك' },
  { id: 'cyber', label: 'الجرائم الإلكترونية', w: ['إلكتروني', 'الإلكترونية', 'فيسبوك', 'مواقع التواصل', 'ابتزاز', 'الابتزاز', 'حساب وهمي', 'الإنترنت'], laws: ['cyber'], q: 'الجرائم الالكترونية' },
  { id: 'drugs', label: 'المخدرات', w: ['مخدرات', 'المخدرات', 'مؤثرات عقلية', 'حيازة مواد مخدرة', 'تعاطي'], laws: ['drugs'], q: 'حيازة المواد المخدرة بقصد' },
  { id: 'notary', label: 'الوكالات والكاتب العدل', w: ['كاتب العدل', 'الكاتب العدل', 'وكالة عامة', 'وكالة خاصة', 'تصديق'], laws: ['notary'], q: 'الوكالة الدورية الكاتب العدل' },
  { id: 'civilservice', label: 'الوظيفة العامة والتقاعد', w: ['موظف عام', 'الموظف', 'الخدمة المدنية', 'ديوان الموظفين', 'تقاعد', 'التقاعد', 'راتب تقاعدي'], laws: ['civilservice', 'pension'], q: 'الخدمة المدنية الموظف' },
  { id: 'tax', label: 'ضريبة الدخل', w: ['ضريبة', 'الضريبة', 'ضريبة الدخل', 'تقدير ضريبي'], laws: ['incometax'], q: 'ضريبة الدخل' },
  { id: 'juvenile', label: 'الأحداث والطفل', w: ['الأحداث', 'طفل', 'الطفل', 'قاصر', 'القاصر'], laws: ['juvenile', 'child'], q: 'حماية الاحداث' },
  { id: 'expropriation', label: 'الاستملاك', w: ['استملاك', 'الاستملاك', 'استملاك للمنفعة العامة'], laws: ['expropriation'], q: 'الاستملاك التعويض' },
];
/* كلمات عامة في كل نص قانوني لا تميّز موضوعاً */
const GENERIC = new Set(['قانون', 'ماده', 'مواد', 'محكمه', 'دعوي', 'قضيه', 'حكم', 'قرار', 'تاريخ', 'رقم', 'سنه', 'لسنه', 'مدعي', 'عليه', 'عليها', 'جهه', 'طرف', 'طرفين', 'فان', 'وان', 'ولا', 'كان', 'كانت', 'يكون', 'تكون', 'هذا', 'هذه', 'تلك', 'ذلك', 'التي', 'الذي', 'الذين', 'وقد', 'لقد', 'بعد', 'قبل', 'عند', 'حيث', 'كما', 'اما', 'الا', 'غير', 'بين', 'اذا', 'لدي', 'منذ', 'حتي', 'ضمن', 'خلال', 'وذلك', 'بان', 'ايضا', 'جميع', 'تم', 'يتم', 'قام', 'قامت', 'عن', 'الي', 'علي', 'في', 'من', 'مع', 'او', 'ان', 'لا', 'ما', 'هو', 'هي', 'لم', 'لن', 'قد', 'كل', 'اي', 'وهو', 'وهي', 'لها', 'له', 'لهم', 'بها', 'به', 'فيه', 'فيها', 'منه', 'منها', 'وكيل', 'وكيله', 'محامي', 'المحامي', 'السيد', 'السيده', 'شيكل', 'دينار', 'دولار', 'مبلغ', 'وقيمه', 'قيمه', 'يوم', 'شهر', 'عام', 'اول', 'ثاني', 'الاول', 'الثاني', 'موكل', 'موكلي', 'موكلنا', 'بتاريخ', 'استنادا', 'استناد', 'مستانف', 'مستانفه', 'مستانفين', 'مستدعي', 'مستدعيه', 'طاعن', 'طاعنه', 'مطعون', 'ضده', 'ضدها', 'ضدهم', 'يطالب', 'يستحق', 'تستحق', 'بموجب', 'المذكور', 'مذكور', 'المذكوره', 'وعليه', 'فقره', 'بند', 'لايحه', 'وقدمنا', 'قدمنا', 'ونريد', 'بقيمته', 'بقيمه', 'قيمته', 'واعيد', 'اعيد', 'رغم', 'منذ', 'الان', 'حاليا', 'يدعي', 'تدعي', 'ويدعي', 'كذلك', 'ايضا', 'بخصوص', 'يتعلق', 'تتعلق', 'بدون', 'دون', 'نريد', 'اريد', 'هل', 'يجوز', 'يحق', 'كيف', 'ماذا', 'لماذا', 'متي', 'نحن', 'انا', 'انه', 'انها', 'لكن', 'ولكن', 'فقط', 'جدا', 'اخر', 'احد', 'نفس', 'بشان', 'وفق', 'وفقا', 'حسب', 'لدى', 'مستند', 'مستندات', 'ملف', 'جلسه', 'جلسات']);

const LAWN = LAWS.map(l => { const al = new Set([norm(l.title), ...l.alias.map(norm)]); for (const a of [...al]) if (a.startsWith('قانون ')) al.add(a.slice(6)); return { ...l, n: norm(l.title), al: [...al].filter(Boolean).sort((a, b) => b.length - a.length) } });
const TOPN = TOPICS.map(t => ({ ...t, wn: [...new Set(t.w.map(norm).filter(Boolean))] }));

/* ── استخراج من نص المستخدم ── */
const MONTHS = { 'كانون الثاني': 1, 'شباط': 2, 'آذار': 3, 'اذار': 3, 'نيسان': 4, 'أيار': 5, 'ايار': 5, 'حزيران': 6, 'تموز': 7, 'آب': 8, 'اب': 8, 'أيلول': 9, 'ايلول': 9, 'تشرين الأول': 10, 'تشرين الاول': 10, 'تشرين الثاني': 11, 'كانون الأول': 12, 'كانون الاول': 12,
  'يناير': 1, 'فبراير': 2, 'مارس': 3, 'أبريل': 4, 'ابريل': 4, 'إبريل': 4, 'مايو': 5, 'يونيو': 6, 'يوليو': 7, 'أغسطس': 8, 'اغسطس': 8, 'سبتمبر': 9, 'أكتوبر': 10, 'اكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12 };
const MON_RX = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');
const iso = (y, m, d) => { y = +y; m = +m; d = +d; if (y < 100) y += y > 50 ? 1900 : 2000; if (y < 1850 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return ''; const t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCMonth() === m - 1 ? t.toISOString().slice(0, 10) : '' };
const around = (s, i, n, w = 60) => s.slice(Math.max(0, i - w), Math.min(s.length, i + n + w)).replace(/\s+/g, ' ').trim();

function dates(text) {
  const s = flat(text), out = [], seen = new Set();
  const add = (d, i, n, raw) => { if (d && !seen.has(d + '@' + i)) { seen.add(d + '@' + i); out.push({ date: d, raw: raw.trim(), at: i, ctx: around(s, i, n) }) } };
  for (const m of s.matchAll(/(?<![\d/.-])(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?![\d/.-])/g)) add(iso(m[1], m[2], m[3]), m.index, m[0].length, m[0]);
  for (const m of s.matchAll(/(?<![\d/.-])(\d{1,2})[-/.](\d{1,2})[-/.](\d{4}|\d{2})(?![\d/.-])/g)) add(iso(m[3], m[2], m[1]), m.index, m[0].length, m[0]);
  for (const m of s.matchAll(new RegExp('(?<!\\d)(\\d{1,2})\\s*(?:من\\s*)?(?:شهر\\s*)?(' + MON_RX + ')\\s*(?:من\\s*)?(?:عام|سنة)?\\s*(\\d{4})', 'g'))) add(iso(m[3], MONTHS[m[2]], m[1]), m.index, m[0].length, m[0]);
  out.sort((a, b) => a.date.localeCompare(b.date) || a.at - b.at);
  return out;
}
const CUR = { 'دينار': 'دينار أردني', 'دنانير': 'دينار أردني', 'شيكل': 'شيكل', 'شيقل': 'شيكل', 'شواكل': 'شيكل', 'دولار': 'دولار', 'يورو': 'يورو', 'جنيه': 'جنيه' };
function amounts(text) {
  const s = flat(text), out = [];
  for (const m of s.matchAll(/(\d{1,3}(?:[,،٬]\d{3})+|\d+(?:\.\d+)?)\s*(?:ألف\s*)?(دينار|دنانير|شيكل|شيقل|شواكل|دولار|يورو|جنيه)/g)) {
    let v = Number(m[1].replace(/[,،٬]/g, '')); if (/ألف/.test(m[0])) v *= 1000;
    if (v > 0) out.push({ value: v, currency: CUR[m[2]], raw: m[0], ctx: around(s, m.index, m[0].length) });
  }
  return out;
}
function caseNos(text) {
  const s = flat(text), out = [], seen = new Set();
  for (const m of s.matchAll(/(دعوى|الدعوى|القضية|قضية|طلب|الطلب|استئناف|الاستئناف|نقض|النقض|الطعن|طعن|ملف تنفيذي|التنفيذ|جزاء|صلح|بداية)\s*(?:\S+\s*){0,3}?(?:رقم|رقمه|رقمها)?\s*\(?\s*(\d{1,6})\s*\/\s*(\d{4})\s*\)?/g)) {
    const k = m[2] + '/' + m[3]; if (seen.has(k)) continue; seen.add(k); out.push({ no: k, kind: m[1].replace(/^ال/, ''), ctx: around(s, m.index, m[0].length) });
  }
  return out;
}
/* المواد المذكورة: «المادة (240) من قانون أصول المحاكمات»، «المواد 12 و13 من قانون البينات»، «م/223/2 أصول»، «المادة ذاتها/من القانون ذاته» */
/* «م/1» في الأحكام رمز مبرز لا مادة، فلا يُعتمد */
const ART_HEAD = /(?<![ء-ي])(?:(?:ب|و|ل|ف|لل|بال|وال|فال)?(?:ال)?ماد(?:ة|ه|تين|تان|تي|تا)|(?:ب|و|ل|ف|لل|بال|وال)?(?:ال)?مواد)\s*/g;
function citations(text) {
  const s = flat(text), out = []; let lastLaw = null;
  for (const m of s.matchAll(ART_HEAD)) {
    const i = m.index + m[0].length, tail = s.slice(i, i + 220);
    const nm = /^(?:رقم\s*)?((?:[(\[]?\s*\d{1,4}(?:\s*\/\s*\d{1,3})?\s*[)\]]?(?:\s*(?:مكرر[ةا]?))?\s*(?:[،,]|و|،\s*و|-|إلى|الى|حتى)?\s*){1,12})/.exec(tail);
    if (!nm) continue;
    const nums = [...nm[1].matchAll(/(\d{1,4})(?:\s*\/\s*(\d{1,3}))?/g)].map(x => ({ n: x[1], p: x[2] || '' }));
    if (!nums.length) continue;
    const rest = tail.slice(nm[0].length);
    let law = null, phrase = '';
    const lm = /^\s*(?:من|في)?\s*(?:ال)?(?:قانون|القرار بقانون|قرار بقانون|نظام|مجلة)?\s*([^\n.،؛:()\[\]]{2,90})/.exec(rest);
    const short = /^\s*(?:من)?\s*(?:القانون|قانون)?\s*(ذاته|نفسه|المذكور|ذات القانون|نفس القانون)/.test(rest) || /^\s*منه/.test(rest);
    if (lm && !short) { phrase = lm[1].replace(/\s+(?:و?تعديلاته|المعدل|الساري|النافذ).*$/, '').trim(); law = matchLaw(phrase) }
    if (!law && (short || !lm)) law = lastLaw;
    if (law) lastLaw = law;
    const range = /(\d{1,4})\s*(?:-|إلى|الى|حتى)\s*(\d{1,4})/.exec(nm[1]);
    let list = nums;
    if (range && +range[2] > +range[1] && +range[2] - +range[1] <= 10) { list = []; for (let k = +range[1]; k <= +range[2]; k++) list.push({ n: String(k), p: '' }) }
    for (const x of list) out.push({ article: x.n, para: x.p, law: law ? law.key : '', lawTitle: law ? law.title : '', phrase: law ? '' : clip(phrase, 90), ctx: around(s, m.index, m[0].length + nm[0].length, 40) });
  }
  const seen = new Set();
  return out.filter(c => { const k = c.law + ':' + c.article + ':' + c.para + ':' + (c.law ? '' : c.phrase); if (seen.has(k)) return false; seen.add(k); return true });
}
function matchLaw(phrase) {
  const p = norm(phrase); if (!p) return null;
  /* الاسم يبدأ به النص بعد «من» (حدود كلمات كاملة)، أو يرد في وسطه إن كان من كلمتين فأكثر؛ الأطول يغلب */
  const P = ' ' + p + ' ';
  let best = null, bl = 0;
  for (const l of LAWN) for (const a of l.al) { const ok = P.startsWith(' ' + a + ' ') || (a.includes(' ') && P.includes(' ' + a + ' ')); if (ok && a.length > bl) { best = l; bl = a.length } }
  if (best && best.key === 'usul' && / شرعيه /.test(P)) best = LAWN.find(l => l.key === 'usulshari');
  return best;
}
function topics(text) {
  const n = ' ' + norm(text) + ' ', out = [];
  for (const t of TOPN) {
    const hits = t.wn.filter(w => n.includes(' ' + w + ' ') || (w.includes(' ') && n.includes(w)));
    if (!hits.length) continue;
    const cnt = hits.reduce((a, w) => a + (n.split(' ' + w + ' ').length - 1 || 1), 0);
    out.push({ id: t.id, label: t.label, hits: t.w.filter(w => hits.includes(norm(w))).slice(0, 6), score: hits.length * 2 + Math.min(cnt, 10), laws: t.laws, q: t.q });
  }
  out.sort((a, b) => b.score - a.score);
  /* موضوع بكلمة دالّة واحدة عابرة (مثل «شركة» في اسم صاحب العمل) لا يُعرض إلا إن كان الوحيد */
  return out.filter((t, i) => i === 0 || t.score >= 4).slice(0, 5);
}
/* الكلمات الأثقل في النص: التكرار مع طول الكلمة، بعد حذف العام */
function keyterms(text, k = 8) {
  const ws = norm(text).split(' ').filter(w => w.length >= 3 && !/^\d+$/.test(w) && !GENERIC.has(w));
  const f = new Map(); for (const w of ws) f.set(w, (f.get(w) || 0) + 1);
  /* «بمكافاه» و«مكافاه» كلمة واحدة: حرف الجر أو العطف الملتصق يُحذف إن وردت الكلمة دونه */
  for (const [w, c] of [...f]) { const b = w.length > 4 && /^[وبلفك]/.test(w) ? w.slice(1) : ''; if (b && f.has(b)) { f.set(b, f.get(b) + c); f.delete(w) } }
  const bi = new Map(); for (let i = 0; i + 1 < ws.length; i++) { const b = ws[i] + ' ' + ws[i + 1]; bi.set(b, (bi.get(b) || 0) + 1) }
  const terms = [...f.entries()].map(([w, c]) => ({ w, s: c * Math.min(w.length, 7) })).sort((a, b) => b.s - a.s).slice(0, k).map(x => x.w);
  const phrases = [...bi.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([b]) => b);
  return { terms, phrases };
}

/* ── مواد التشريع: تقسيم النص المخزّن إلى مواد كما هي ── */
const ART_LINE = /^\s*(?:ال)?ماد[ةه]\s*(?:رقم\s*)?[(\[]?\s*(\d{1,4})\s*[)\]]?\s*((?:مكرر(?:ة|ا)?)(?:\s*\d+)?)?/;
const RULING_COUNT = /\s*(?:\d+\s+)?(?:حكم\s+قضائي(?:\s+واحد)?|حكمان\s+قضائيان|أحكام\s+قضائية)\s*$/;
function splitArticles(body) {
  const lines = String(body || '').split('\n'), out = []; let cur = null;
  for (const raw of lines) {
    const ln = flat(raw).trim(), m = ln.length < 140 ? ART_LINE.exec(ln) : null;
    if (m) { if (cur) out.push(cur); const n = m[1] + (m[2] ? ' ' + m[2].trim() : ''); cur = { n, label: 'المادة (' + n + ')', text: '' }; const after = raw.trim().replace(/^[^)\]]*[)\]]\s*/, '').replace(RULING_COUNT, '').trim(); if (after && !RULING_COUNT.test(' ' + after)) cur.text = after }
    else if (cur && raw.trim()) cur.text += (cur.text ? '\n' : '') + raw.trim();
  }
  if (cur) out.push(cur);
  return out.map(a => ({ ...a, repealed: /^(?:ال)?[اأإ]?لغيت هذه الماد/.test(flat(a.text).trim()) }));
}

/* أنسب فقرة في نص طويل: أكثر الكلمات المطلوبة تنوعاً، مقصوصة حول أول تطابق */
function bestPassage(body, terms, len = 520) {
  const ws = terms.filter(w => w.length > 2); if (!ws.length) return '';
  const lines = String(body || '').split('\n').map(x => x.replace(/\s+/g, ' ').trim()).filter(x => x.length > 40);
  let best = null;
  lines.forEach((ln, i) => { if (i < 6) return; const t = ' ' + norm(ln) + ' '; const hit = ws.filter(w => t.includes(' ' + w) || t.includes(w + ' ')); const s = new Set(hit).size * 10 + hit.reduce((a, w) => a + w.length, 0) / 10; if (s > 0 && (!best || s > best.s)) best = { s, ln } });
  if (!best) return '';
  const ln = best.ln; if (ln.length <= len) return ln;
  const n = norm(ln); const w = ws.find(x => n.includes(x)); let at = 0;
  if (w) { const words = ln.split(' '); let acc = 0; for (const x of words) { if (norm(x).includes(w)) { at = acc; break } acc += x.length + 1 } }
  const st = Math.max(0, at - Math.floor(len / 3)); return (st > 0 ? '… ' : '') + ln.slice(st, st + len) + (st + len < ln.length ? ' …' : '');
}

function createLocal({ misbar, now = () => new Date() } = {}) {
  if (!misbar) throw new Error('misbar required');
  const lawCache = new Map(), docCache = new Map();
  async function getDoc(id) {
    if (docCache.has(id)) return docCache.get(id);
    const d = await misbar.doc(id); if (docCache.size > 40) docCache.delete(docCache.keys().next().value); docCache.set(id, d); return d;
  }
  /* يحدد التشريع الأصلي في القاعدة: العنوان يحوي كل كلمات الاسم، ويُقدَّم القانون على قرارات التعديل واللوائح، والساري على الملغى */
  async function resolveLaw(key) {
    if (lawCache.has(key)) return lawCache.get(key);
    const L = LAWN.find(l => l.key === key); if (!L) return null;
    const r = typeof misbar.byTitle === 'function' ? { results: await misbar.byTitle(L.title, 'PS_LEGISLATION', 200) } : await misbar.search({ q: '"' + L.title + '"', src: 'PS_LEGISLATION', per: 30, facets: '0', has_text: '1' });
    const need = L.n.split(' ');
    const sc = x => { const t = norm(x.title); if (!need.every(w => t.includes(w))) return -1; let s = 10;
      if (/تعديل|معدل/.test(t)) s -= 6; if (/لايحه|نظام|تعليمات|مجلس الوزراء|وزير/.test(t)) s -= 5; if (/^قانون/.test(t)) s += 2; if (x.status_code === 'repealed' || /ملغ/.test(x.status || '')) s -= 4; s -= t.length / 200; return s };
    const best = r.results.map(x => ({ x, s: sc(x) })).filter(y => y.s > 0).sort((a, b) => b.s - a.s)[0];
    const v = best ? { id: best.x.id, title: best.x.title, status: best.x.status || '', key } : null;
    lawCache.set(key, v); return v;
  }
  async function articlesOf(lawId) { const d = await getDoc(lawId); return d ? splitArticles(d.body) : [] }

  /* المواد الأقرب لنص المستخدم داخل تشريع: تطابق الكلمات الثقيلة، والمادة الملغاة لا تُقترح */
  function rankArticles(arts, terms, n = 3) {
    if (!terms.length) return [];
    const seen = new Set(), DEF = /^(?:لغايات|التعاريف|تعاريف|يسمى هذا|يعمل بهذا|على جميع الجهات|يلغى|يُلغى)/;
    return arts.filter(a => !a.repealed && !seen.has(a.n) && seen.add(a.n)).map(a => { const t = ' ' + norm(a.text) + ' '; const hit = terms.filter(w => w.length <= 3 ? t.includes(' ' + w + ' ') : t.includes(' ' + w) || t.includes(w + ' ')); return { a, hit, s: hit.reduce((x, w) => x + Math.min(w.length, 7), 0) * (DEF.test(flat(a.text).trim()) || a.n === '1' ? 0.4 : 1) } })
      .filter(x => x.hit.length >= Math.min(2, terms.length)).sort((a, b) => b.s - a.s).slice(0, n).map(x => ({ n: x.a.n, label: x.a.label, text: x.a.text, why: 'تطابقت فيها: ' + x.hit.slice(0, 5).join('، ') }));
  }

  async function cited(cs) {
    const out = [];
    for (const c of cs.slice(0, 25)) {
      if (!c.law) { out.push({ ...c, found: false, note: c.phrase ? 'لم يُحدَّد التشريع «' + c.phrase + '» في القاعدة؛ اكتب اسمه كاملاً.' : 'لم يُذكر اسم التشريع بجانب المادة.' }); continue }
      const L = await resolveLaw(c.law); if (!L) { out.push({ ...c, found: false, note: 'التشريع غير موجود في القاعدة المحلية.' }); continue }
      const a = (await articlesOf(L.id)).find(x => x.n === c.article);
      out.push({ ...c, found: !!a, lawId: L.id, lawTitle: L.title, status: L.status, label: 'المادة (' + c.article + ')' + (c.para ? ' فقرة ' + c.para : ''), text: a ? a.text : '', repealed: a ? a.repealed : false, note: a ? '' : 'لم تُعثر على المادة في نص التشريع المخزّن.' });
    }
    return out;
  }

  /* أحكام بدمج عدة استعلامات بترتيب تبادلي (RRF): الحكم الذي يظهر في أكثر من استعلام يتقدّم */
  async function rulings(queries, src, per = 8, take = 8) {
    const pool = new Map();
    for (const [qi, q] of queries.entries()) {
      if (!q.q) continue;
      let r; try { r = await misbar.search({ q: q.q, src, per, facets: '0', mode: q.mode || 'any', has_text: '1' }) } catch { continue }
      r.results.forEach((x, i) => { const p = pool.get(x.id) || { x, s: 0, why: [] }; p.s += 1 / (8 + i) * (q.w || 1); p.why.push(q.label); pool.set(x.id, p) });
    }
    return [...pool.values()].sort((a, b) => b.s - a.s).slice(0, take).map(p => ({ id: p.x.id, title: p.x.title, court: p.x.court, case_no: p.x.case_no, date: p.x.date || p.x.year, source: p.x.source, primary: p.x.primary, excerpt: p.x.excerpt, why: [...new Set(p.why)] }));
  }

  function timeline(ds) {
    const today = now().toISOString().slice(0, 10), D = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
    /* التاريخ المكرر يُعرض مرة بأول سياق ورد فيه مع عدد مرات وروده */
    const uniq = []; for (const d of ds) { const u = uniq.find(x => x.date === d.date); if (u) u.times++; else uniq.push({ ...d, times: 1 }) }
    return uniq.slice(0, 60).map((d, i) => ({ date: d.date, ctx: d.ctx, times: d.times, sincePrev: i ? D(uniq[i - 1].date, d.date) : null, fromToday: D(d.date, today) }));
  }

  async function analyze({ text = '', title = '' } = {}) {
    const src = String(text || '').slice(0, 200000);
    if (src.replace(/\s/g, '').length < 15) return { status: 400, body: { error: 'اكتب السؤال أو الوقائع (15 حرفاً على الأقل).' } };
    const t0 = Date.now();
    const cs = citations(src), tp = topics(src), kt = keyterms(src), ds = dates(src);
    const law = await cited(cs);
    /* كلمات البحث: كلمات الموضوعات الدالّة أولاً ثم الأثقل في النص، دون كلمات أسماء التشريعات المذكورة (تملأ النتائج بكل حكم ذكر القانون) */
    const titleW = new Set(law.filter(c => c.lawTitle).flatMap(c => norm(c.lawTitle).split(' ')).concat(['قانون', 'فلسطيني']));
    const topicW = tp.flatMap(t => t.hits.flatMap(h => norm(h).split(' '))).filter(w => w.length >= 3 && !GENERIC.has(w));
    const terms = [...new Set([...topicW, ...kt.terms])].filter(w => !titleW.has(w)).slice(0, 14);
    /* التشريعات المعنية بالموضوعات، وأقرب موادها لنص المستخدم */
    const lawKeys = [...new Set(tp.flatMap(t => t.laws))].slice(0, 5), related = [];
    for (const k of lawKeys) {
      const L = await resolveLaw(k); if (!L || related.some(r => r.lawId === L.id)) continue;
      /* قانون العقوبات لسنة 1960 يكتب «شك» لا «شيك» */
      const arts = rankArticles(await articlesOf(L.id), k === 'penal' && terms.includes('شيك') ? [...terms, 'شك'] : terms, 3).filter(a => !law.some(c => c.lawId === L.id && c.article === a.n));
      related.push({ lawId: L.id, title: L.title, status: L.status, topic: (tp.find(t => t.laws.includes(k)) || {}).label || '', articles: arts });
    }
    /* استعلامات الأحكام: الكلمات الدالّة، ثم كل موضوع، ثم كل مادة مذكورة (الأحكام التي ورد فيها رقمها مع اسم قانونها) */
    const Q = [], q6 = terms.slice(0, 6);
    if (q6.length) Q.push({ q: q6.join(' '), label: 'كلمات النص: ' + q6.join('، '), w: 1.4 });
    for (const p of kt.phrases) Q.push({ q: '"' + p + '"', label: 'عبارة متكررة: ' + p, w: 1.2, mode: 'all' });
    for (const t of tp.slice(0, 3)) Q.push({ q: t.q, label: 'موضوع: ' + t.label });
    const artQ = [];
    for (const c of law.filter(x => x.found).slice(0, 4)) { const lw = norm(c.lawTitle).split(' ').filter(w => w.length >= 3 && !/\d/.test(w) && !['قانون', 'لسنه', 'رقم', 'بشان', 'فلسطيني', 'قرار', 'بقانون'].includes(w)).slice(0, 2); const q = { q: '"ماده ' + c.article + '" ' + lw.join(' '), label: 'ورد فيه ' + c.label + ' من ' + c.lawTitle, w: 1.6, mode: 'all', art: c.article, lw }; Q.push(q); artQ.push(q) }
    let ps = await rulings(Q, 'PS_JUDGMENT', 10, 12);
    /* مقتطف من صلب الحكم لا من ترويسته، والتحقق من ورود المادة فعلاً بجانب اسم قانونها */
    const out = [];
    for (const r of ps) {
      const d = await getDoc(r.id); if (!d || !d.body) { out.push(r); continue }
      const body = flat(d.body), why = [];
      for (const w of r.why) { const q = artQ.find(x => x.label === w); if (!q) { why.push(w); continue }
        const rx = new RegExp('(?<![ء-ي0-9])(?:ال)?ماد[ةه]\\s*(?:رقم\\s*)?[(\\[]?\\s*' + q.art + '(?!\\d)[^\\n.،؛]{0,80}', 'g'); let ok = false;
        /* اسم القانون يجب أن يلي رقم المادة قبل ذكر مادة أخرى: «المادة 42 من قانون الأصول … قانون العمل» لا تُحسب */
        for (const m of body.matchAll(rx)) { const tail = m[0].replace(/^[^)\]\d]*[)\]]?\s*\d+/, '').split(/ماد[ةه]/)[0].split(/(?=قانون)/).slice(0, 2).join(''), t = norm(tail); if (q.lw.every(x => t.includes(x))) { ok = true; break } } if (ok) why.push(w) }
      if (!why.length) continue;
      /* الحكم نفسه منشور أحياناً بأكثر من رقم (استئنافان متقابلان): يكفي ظهوره مرة */
      const ex = bestPassage(d.body, terms) || r.excerpt; if (out.some(o => o.title === r.title || (ex && o.excerpt === ex))) continue;
      out.push({ ...r, why, excerpt: ex, cites: (d.cites || []).slice(0, 8).map(c => c.title) });
      if (out.length >= 8) break;
    }
    ps = out;
    /* المواد التي استندت إليها الأحكام المعروضة (كما سجّلتها القاعدة لكل حكم): تُضاف إلى تشريعها مع عدد الأحكام */
    const relied = new Map();
    for (const r of ps) for (const c of r.cites || []) { const m = /^المادة رقم (\d+) من (.+)$/.exec(c); if (!m) continue; const k = m[2].trim(); if (!relied.has(k)) relied.set(k, new Map()); const a = relied.get(k); a.set(m[1], (a.get(m[1]) || 0) + 1) }
    for (const [title, arts] of [...relied].sort((a, b) => [...b[1].values()].reduce((x, y) => x + y, 0) - [...a[1].values()].reduce((x, y) => x + y, 0)).slice(0, 4)) {
      let L = related.find(r => norm(r.title) === norm(title));
      /* تشريع خارج موضوع المسألة لا يُضاف إلا إن استندت إلى مادة منه ثلاثة أحكام فأكثر (يستبعد مواد الإجراءات العامة) */
      if (!L && Math.max(...arts.values()) < 3) continue;
      if (!L) { const hit = (typeof misbar.byTitle === 'function' ? await misbar.byTitle(title, 'PS_LEGISLATION', 20) : []).find(x => norm(x.title) === norm(title)); if (!hit) continue; L = { lawId: hit.id, title: hit.title, status: hit.status || '', topic: 'استندت إليه الأحكام أدناه', articles: [] }; related.push(L) }
      const all = await articlesOf(L.lawId);
      for (const [n, c] of [...arts].sort((a, b) => b[1] - a[1]).slice(0, 3)) {
        if (law.some(x => x.lawId === L.lawId && x.article === n)) continue;
        const ex = L.articles.find(a => a.n === n), why = `استند إليها ${c === 1 ? 'حكم واحد' : c === 2 ? 'حكمان' : c + ' أحكام'} من الأحكام أدناه`;
        if (ex) { ex.why = why + ' · ' + ex.why; ex.relied = c; continue }
        /* مادة استند إليها حكم واحد فقط ولا تطابق كلمات المسألة: عابرة، لا تُضاف */
        if (c < 2) continue;
        const a = all.find(x => x.n === n); if (a) L.articles.push({ n, label: a.label, text: a.text, why, relied: c });
      }
      L.articles.sort((a, b) => (b.relied || 0) - (a.relied || 0));
    }
    /* المقارن: الموضوعات وكلماتها المشتركة فقط، فالكلمات المفردة في أحكام غير فلسطينية تجلب نتائج بعيدة */
    const cq = tp.slice(0, 3).map(t => ({ q: t.q, label: 'موضوع: ' + t.label })).concat(terms.length >= 2 ? [{ q: terms.slice(0, 3).join(' '), label: 'كلمات النص: ' + terms.slice(0, 3).join('، '), mode: 'all' }] : []);
    /* المقارن يُعرض فقط إن ورد في عنوانه أو مقتطفه كلمة دالّة من موضوع المسألة أو كلمتان من كلماتها */
    const rel = x => { const t = ' ' + norm((x.title || '') + ' ' + (x.excerpt || '')) + ' '; return topicW.some(w => t.includes(' ' + w)) || terms.filter(w => t.includes(' ' + w)).length >= 2 };
    const cmp = cq.length ? [...(await rulings(cq, 'JO_CASSATION', 8, 6)).filter(rel).slice(0, 3), ...(await rulings(cq, 'EG_CASSATION', 8, 6)).filter(rel).slice(0, 3)] : [];
    const am = amounts(src), cn = caseNos(src);
    const total = am.reduce((a, x) => { a[x.currency] = (a[x.currency] || 0) + x.value; return a }, {});
    return { status: 200, body: {
      title: clip(title, 160), at: now().toISOString(), ms: Date.now() - t0, offline: true,
      topics: tp.map(({ q, laws, ...t }) => t), keyterms: { terms, phrases: kt.phrases },
      citations: law, laws: related, rulings: ps, comparative: cmp,
      timeline: timeline(ds), amounts: am.slice(0, 40), amountTotals: total, caseNos: cn.slice(0, 30),
      notice: 'نتائج بحث آلي من القاعدة المحلية دون إنترنت: النصوص منقولة حرفياً، والمدد والمبالغ محسوبة من النص المُدخل. لا يتضمن رأياً قانونياً؛ راجع كل نتيجة قبل الاعتماد عليها.',
    } };
  }

  /* ── تشريح الحكم بالقواعد: البنية المعتادة للأحكام الفلسطينية (الهيئة، الأطراف، الحكم المطعون فيه، الأسباب، «لذلك»، المنطوق) ── */
  const ROLES = ['المستأنف عليهما', 'المستأنف عليهم', 'المستأنف عليها', 'المستأنف عليه', 'المستأنفة', 'المستأنفون', 'المستأنفان', 'المستأنف', 'المستدعى ضدهم', 'المستدعى ضدها', 'المستدعى ضده', 'المستدعية', 'المستدعون', 'المستدعي', 'المطعون ضدهم', 'المطعون ضدها', 'المطعون ضده', 'الطاعنة', 'الطاعنون', 'الطاعنان', 'الطاعن', 'المدعى عليهم', 'المدعى عليها', 'المدعى عليه', 'المدعية', 'المدعون', 'المدعي', 'المشتكي', 'المشتكى عليه', 'المتهم', 'المتهمة', 'النيابة العامة', 'المعترض', 'المعترض عليه'];
  const ROLE_RX = new RegExp('^(' + ROLES.map(r => r.replace(/\s+/g, '\\s*')).join('|') + ')\\s*(?:[:：]|$)');
  const tidy = s => flat(s).replace(/\s+/g, ' ').trim();
  function structure(body) {
    const raw = String(body || ''), lines = raw.split('\n').map(x => x.trim()), L = lines.map(tidy);
    const nextVal = i => { const same = L[i].replace(/^[^:：]*[:：]\s*/, ''); if (same && same !== L[i] && same.length > 1) return same; for (let j = i + 1; j < Math.min(L.length, i + 4); j++) { if (!L[j] || /^[:：]$/.test(L[j])) continue; return L[j].replace(/^[:：]\s*/, '') } return '' };
    const parties = [], counsel = []; let panel = '', appealed = '';
    for (let i = 0; i < Math.min(L.length, 80); i++) {
      const l = L[i]; if (!l) continue;
      const m = ROLE_RX.exec(l);
      if (m) { const v = nextVal(i); if (v && !ROLE_RX.test(v)) parties.push({ role: m[1].replace(/\s+/g, ' '), name: clip(v, 300) }); continue }
      if (/^وكيل(?:ه|ها|هم|هما|اه|تها|تهم)?(?:\s|$|[:：])/.test(l)) { const inl = l.replace(/^وكيل\S*\s*(?:المحامي|المحامية|المحاميان|المحامون|المحاميين)?\s*[:：]?\s*/, '').trim(); const v = inl || nextVal(i); if (v && !ROLE_RX.test(v)) counsel.push(clip(v.replace(/^(?:المحامي|المحامية|المحاميان)\s*/, ''), 200)); continue }
      if (!panel && /الهيئ[ةه]\s*الحاكم[ةه]/.test(l)) { panel = clip((l.replace(/.*الحاكم[ةه]\s*[:：]?\s*/, '') || nextVal(i)), 400) }
      if (!appealed && /^(?:الحكم|القرار)\s*(?:المستأنف|المطعون\s*فيه|المطعون\s*به)/.test(l)) appealed = clip(nextVal(i), 600);
    }
    /* «لذلك» أو «لهذه الأسباب» الأخيرة: ما بعدها منطوق حتى سطر الختم «حكماً/قراراً ... صدر» */
    let opAt = -1;
    for (let i = L.length - 1; i >= 0; i--) if (/^(?:ل\s*ذلك|ل\s*هذه\s*الأسباب|ل\s*هذه\s*الاسباب|وعليه|وتأسيسا\s*على\s*ما\s*تقدم|وبناء\s*على\s*ما\s*تقدم)\s*(?:[،,:]|فإن|فان|نقرر|تقرر|وعملا|$)/.test(L[i].replace(/\s+/g, ' '))) { opAt = i; break }
    let endAt = L.length;
    for (let i = L.length - 1; i > Math.max(opAt, 0); i--) if (/^(?:حكما|قرارا|حكماً|قراراً)\s*(?:حضوري|غيابي|وجاهي|صدر|تدقيق|بمثابة)/.test(L[i]) || /صدر\s*(?:و\s*)?تلي\s*علنا/.test(L[i]) || /^قراراً?\s*صدر/.test(L[i])) endAt = i;
    const operative = opAt >= 0 ? lines.slice(opAt, endAt).join('\n').trim() : '';
    const closing = endAt < L.length ? lines.slice(endAt, Math.min(L.length, endAt + 2)).join(' ').trim() : '';
    /* بدء أسباب المحكمة: «المحكمة» وحدها في سطر، أو «بعد التدقيق والمداولة» */
    let rsAt = -1;
    for (let i = 0; i < (opAt >= 0 ? opAt : L.length); i++) if (/^ال\s*م\s*ح\s*ك\s*م\s*[ةه]\s*$/.test(L[i].replace(/\s/g, '')) || /^و?\s*بعد\s*(?:التدقيق|الاطلاع|المداولة)/.test(L[i]) || /^(?:و\s*)?بعد\s*التدقيق\s*والمداولة/.test(L[i].replace(/^.*?\.\s*(?=و?بعد\s*التدقيق)/, ''))) { rsAt = i; break }
    const reasoning = rsAt >= 0 ? lines.slice(rsAt, opAt >= 0 ? opAt : L.length).join('\n').trim() : '';
    /* أسباب الطعن: من «أسباب الاستئناف/الطعن» حتى بدء أسباب المحكمة */
    let grAt = -1; for (let i = 0; i < (rsAt >= 0 ? rsAt : L.length); i++) if (/(?:أسباب|اسباب)\s*(?:ال)?(?:استئناف|طعن|الاستئناف|الطعن|الاعتراض)|وتتلخص\s*أسباب|تتلخص\s*اسباب|وقد\s*بني\s*الطعن|ويستند\s*الطعن/.test(L[i])) { grAt = i; break }
    const grounds = grAt >= 0 ? lines.slice(grAt, rsAt >= 0 ? rsAt : grAt + 40).join('\n').trim() : '';
    /* نص ليس حكماً كاملاً (ملخص وقائع مثلاً): آخر جملة تذكر ما قضت به المحكمة تُعرض «منطوقاً مستخرجاً» */
    let opGuess = '';
    if (opAt < 0) { const sents = String(raw).replace(/\r/g, '').split(/(?<=[.؟!])\s+|\n+/).map(x => x.trim()).filter(Boolean); for (let i = sents.length - 1; i >= 0; i--) if (/(?:أصدرت|اصدرت|قضت|حكمت|قررت|تقرر|نقرر)\s+(?:المحكمة|المحكمه|محكمة)?/.test(sents[i]) || /الحكم\s+عليه/.test(sents[i])) { opGuess = sents[i]; break } }
    const op = tidy(operative || opGuess), result = [];
    if (/رد\s*(?:ال)?(?:استئناف|طعن|اعتراض|الاستئناف|الطعن)\s*(?:موضوعا|موضوعاً)/.test(op) || /تأييد\s*(?:الحكم|القرار)/.test(op)) result.push('رُدّ الطعن موضوعاً وأُيّد الحكم');
    if (/رد\s*(?:ال)?(?:استئناف|طعن|الاستئناف|الطعن)\s*شكلا/.test(op)) result.push('رُدّ الطعن شكلاً');
    if (/قبول\s*(?:ال)?(?:استئناف|طعن|الاستئناف|الطعن)/.test(op)) result.push('قُبل الطعن');
    if (/(?:الغاء|إلغاء)\s*(?:الحكم|القرار)/.test(op)) result.push('أُلغي الحكم المطعون فيه');
    if (/نقض\s*(?:الحكم|القرار)/.test(op)) result.push('نُقض الحكم المطعون فيه');
    if (/إعادة\s*(?:الأوراق|الاوراق|الملف|القضية)|اعادة\s*(?:الاوراق|الملف)/.test(op)) result.push('أُعيدت الأوراق إلى مصدرها');
    if (/رفض\s*الطلب|رد\s*الطلب/.test(op)) result.push('رُدّ الطلب');
    if (/عدم\s*قبول/.test(op)) result.push('عدم القبول');
    if (/براء[ةه]/.test(op)) result.push('البراءة');
    if (/إدانة|ادانة|بالحبس|بالسجن|الأشغال/.test(op)) result.push('الإدانة/عقوبة');
    if (/فسخ/.test(op)) result.push('الفسخ');
    if (/(?:إلزام|الزام)\s*/.test(op)) result.push('إلزام بمبلغ أو أداء');
    if (/غيابي/.test(op)) result.push('غيابياً'); else if (/حضوري|وجاهي/.test(op)) result.push('حضورياً');
    return { opGuess, judgmentLike: opAt >= 0 || parties.length > 0, panel, parties, counsel: [...new Set(counsel)].slice(0, 8), appealed, grounds, reasoning, operative, /* النص القانوني كاملاً كما ورد، دون اختصار */ closing: clip(closing, 300), result: [...new Set(result)], found: { operative: opAt >= 0, reasoning: rsAt >= 0, grounds: grAt >= 0 } };
  }
  async function dissect({ id, text = '' } = {}) {
    let d = null;
    if (id) { d = await getDoc(Number(id)); if (!d) return { status: 404, body: { error: 'الحكم غير موجود في القاعدة.' } }; if (d.kind !== 'ruling') return { status: 400, body: { error: 'المستند ليس حكماً.' } } }
    const body = d ? d.body : String(text || '').slice(0, 300000);
    if (String(body).replace(/\s/g, '').length < 200) return { status: 400, body: { error: 'نص الحكم قصير أو غير متوفر.' } };
    const st = structure(body), cs = await cited(citations(body));
    /* المواد التي سجّلتها القاعدة للحكم مع نصوصها كما هي */
    const dbCites = d ? (d.cites || []).slice(0, 40).map(c => ({ title: c.title, text: c.text })) : [];
    const ds = dates(body);
    return { status: 200, body: {
      id: d ? d.id : null, title: d ? d.title : '', court: d ? d.court : '', case_no: d ? d.case_no : (caseNos(body)[0] || {}).no || '', date: d ? (d.date || d.year) : (ds.at(-1) || {}).date || '',
      source: d ? d.source : 'نص مُدخل', primary: d ? d.primary : true, ...st, citations: cs, dbCites, amounts: amounts(st.operative).slice(0, 20), dates: timeline(ds).slice(0, 30), offline: true,
      notice: 'تقسيم آلي للحكم بحسب بنيته المعتادة دون إنترنت: كل قسم مقتطع حرفياً من نصه، و«النتيجة» تصنيف آلي لكلمات المنطوق يحتاج تحققاً.',
    } };
  }

  async function handle(action, b, me, audit) {
    try {
      if (action === 'analyze') { const r = await analyze(b); audit && audit({ user_id: me && me.id, user_name: me && me.name, action: 'misbar.local.analyze', entity: 'misbar', detail: { chars: String(b.text || '').length, laws: r.body.citations ? r.body.citations.length : 0 } }); return r }
      if (action === 'dissect') return await dissect(b);
      return { status: 404, body: { error: 'غير موجود' } };
    } catch (e) {
      const m = String(e && e.message || e);
      if (/no such table|SQLITE_CANTOPEN|unable to open/i.test(m)) return { status: 503, body: { error: 'قاعدة المسبار غير مثبتة على هذا الجهاز بعد', code: 'NO_INDEX' } };
      throw e;
    }
  }
  return { analyze, dissect, handle, resolveLaw };
}

module.exports = { createLocal, citations, dates, amounts, caseNos, topics, keyterms, splitArticles, matchLaw, LAWS, TOPICS };
