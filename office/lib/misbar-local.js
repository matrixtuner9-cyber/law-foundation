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
  { id: 'appeal', label: 'الطعن ومواعيده', w: ['استئناف', 'الاستئناف', 'استئنافه', 'المستأنف', 'نقض', 'الطعن', 'رد الدعوى', 'رد الاستئناف', 'ميعاد الطعن', 'مدة الطعن', 'لائحة الاستئناف', 'لائحة الطعن', 'اعتراض الغير', 'إعادة المحاكمة'], laws: ['usul'], q: 'ميعاد الطعن رد الطعن شكلا' },
  { id: 'evidence', label: 'الإثبات والبينات', w: ['بينة', 'البينات', 'شاهد', 'الشهود', 'شهادة', 'اليمين', 'إقرار', 'الإقرار', 'خبرة', 'خبير', 'سند عادي', 'سند رسمي', 'إنكار التوقيع', 'الادعاء بالتزوير', 'قرينة'], laws: ['bayyinat'], q: 'عبء الاثبات البينة الشخصية' },
  { id: 'tort', label: 'التعويض عن الضرر', w: ['تعويض', 'ضرر', 'الضرر', 'إهمال', 'الإهمال', 'مسؤولية تقصيرية', 'مخالفة مدنية', 'عطل وضرر'], laws: ['tort'], q: 'التعويض عن الضرر الاهمال' },
  { id: 'accident', label: 'حوادث الطرق والتأمين', w: ['حادث سير', 'حادث طرق', 'مركبة', 'سيارة', 'شركة التأمين', 'تأمين إلزامي', 'صندوق تعويض مصابي', 'مصاب', 'إصابة جسدية', 'عجز', 'دهس', 'الدهس', 'سائق', 'السائق'], laws: ['insurance', 'traffic'], q: 'تعويض مصابي حوادث الطرق شركة التامين' },
  { id: 'trafficcrime', label: 'جرائم السير', w: ['دهس', 'الدهس', 'دون رخصة', 'بدون رخصة', 'بلا رخصة', 'رخصة قيادة', 'رخصة سياقة', 'لا يحمل رخصة', 'لا يملك رخصة', 'تحت تأثير', 'السرعة الزائدة', 'سرعة زائدة', 'هرب من مكان الحادث', 'عدم مراعاة القوانين والأنظمة'], laws: ['traffic', 'penal'], q: 'حادث سير التسبب بالوفاة قلة احتراز رخصة', aw: ['سبب موت', 'قلة احتراز', 'إهمال', 'عدم مراعاة القوانين', 'رخصة قيادة', 'سياقة'] },
  { id: 'labour', label: 'العمل والعمال', w: ['عامل', 'العامل', 'العمال', 'فصل تعسفي', 'فصلاً تعسفياً', 'فصله تعسفياً', 'تعسفياً', 'تعسفي', 'فُصل', 'فصله', 'استقالة', 'راتب', 'رواتب', 'صاحب العمل', 'مكافأة نهاية الخدمة', 'نهاية الخدمة', 'فصل تعسفي', 'الفصل التعسفي', 'أجور', 'الأجر', 'بدل إشعار', 'إجازة سنوية', 'ساعات العمل', 'إصابة عمل'], laws: ['labour'], q: 'مكافاة نهاية الخدمة الفصل التعسفي' },
  { id: 'rent', label: 'الإيجار والإخلاء', w: ['مستأجر', 'المستأجر', 'المأجور', 'مأجور', 'بدل الإيجار', 'الأجرة', 'إخلاء', 'الإخلاء', 'عقد إيجار', 'إيجار', 'المؤجر'], laws: ['rent'], q: 'اخلاء الماجور عدم دفع الاجرة' },
  { id: 'exec', label: 'التنفيذ', w: ['تنفيذ', 'دائرة التنفيذ', 'قاضي التنفيذ', 'حجز', 'الحجز', 'حبس المدين', 'سند تنفيذي', 'إخطار تنفيذي', 'ملف تنفيذي'], laws: ['exec'], q: 'دائرة التنفيذ حبس المدين' },
  { id: 'cheque', label: 'الشيكات والأوراق التجارية', w: ['شيك', 'الشيك', 'شيكات', 'كمبيالة', 'سند سحب', 'سند لأمر', 'الرصيد', 'عدم كفاية الرصيد', 'بدون رصيد', 'لا يقابله رصيد', 'شيك مرتجع'], laws: ['trade', 'penal'], q: 'شيك عدم كفاية الرصيد' },
  { id: 'companies', label: 'الشركات والشراكة', w: ['شركة', 'الشركة', 'شريك', 'الشركاء', 'مساهم', 'تصفية الشركة', 'مدير الشركة', 'شركة تضامن', 'محدودة المسؤولية'], laws: ['companies', 'trade'], q: 'الشركاء تصفية الشركة' },
  { id: 'contract', label: 'العقود والالتزامات', w: ['عقد', 'العقد', 'فسخ', 'الفسخ', 'بطلان العقد', 'إخلال', 'الإخلال', 'شرط جزائي', 'الشرط الجزائي', 'التزام', 'الالتزام', 'تعهد', 'بيع', 'البيع', 'ثمن'], laws: ['majalla'], q: 'فسخ العقد الاخلال بالالتزام' },
  { id: 'limitation', label: 'التقادم ومرور الزمن', w: ['تقادم', 'التقادم', 'مرور الزمن', 'سقوط الحق', 'مضي المدة', 'عدم سماع الدعوى', 'ميعاد رفع الدعوى', 'مدة رفع الدعوى', 'مدة التقادم'], laws: ['majalla'], q: 'مرور الزمن عدم سماع الدعوى' },
  { id: 'urgent', label: 'القضاء المستعجل والطلبات', w: ['مستعجل', 'المستعجلة', 'قاضي الأمور المستعجلة', 'وقف التنفيذ', 'حجز تحفظي', 'منع سفر', 'طلب مستعجل'], laws: ['usul'], q: 'قاضي الامور المستعجلة الضرر المحدق' },
  { id: 'arbitration', label: 'التحكيم', w: ['تحكيم', 'التحكيم', 'محكم', 'قرار التحكيم', 'شرط التحكيم'], laws: ['arbitration'], q: 'قرار التحكيم بطلان' },
  { id: 'crimproc', label: 'الإجراءات الجزائية', w: ['شكوى جزائية', 'الشكوى', 'شكوى', 'دعوى جزائية', 'الحق الشخصي', 'المدعي بالحق الشخصي', 'توقيف', 'التوقيف', 'الكفالة', 'النيابة العامة', 'النيابة', 'التحقيق', 'لائحة اتهام', 'القبض', 'التفتيش', 'إخلاء سبيل', 'متهم', 'المتهم', 'المشتكي'], laws: ['crimproc'], q: 'بطلان اجراءات التفتيش التوقيف' },
  { id: 'penal', label: 'الجرائم والعقوبات', w: ['جريمة', 'الجريمة', 'جنحة', 'جناية', 'سرقة', 'احتيال', 'إيذاء', 'قتل', 'تزوير', 'إساءة الأمانة', 'التسبب بالوفاة', 'سبب موت', 'قلة احتراز', 'أدى إلى وفاة', 'أدت إلى وفاة', 'أفضى إلى الوفاة', 'أفضى إلى موت', 'تسبب بوفاة', 'التسبب بوفاة', 'وفاته', 'دهس', 'الذم', 'القدح', 'تهديد', 'الشروع', 'عقوبة', 'العقوبة', 'يعاقب', 'الحبس', 'السجن', 'الغرامة', 'إدانة'], laws: ['penal'], q: 'اركان الجريمة القصد الجرمي' },
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
const GENERIC = new Set(['تشريع', 'تشريعات', 'وتشريعات', 'قرارات', 'وقرارات', 'احكام', 'واحكام', 'اجتهاد', 'اجتهادات', 'قضاييه', 'نصوص', 'موضوع', 'بحث', 'ابحث', 'ابحثوا', 'قانون', 'ماده', 'مواد', 'محكمه', 'دعوي', 'قضيه', 'حكم', 'قرار', 'تاريخ', 'رقم', 'سنه', 'لسنه', 'مدعي', 'عليه', 'عليها', 'جهه', 'طرف', 'طرفين', 'فان', 'وان', 'ولا', 'كان', 'كانت', 'يكون', 'تكون', 'هذا', 'هذه', 'تلك', 'ذلك', 'التي', 'الذي', 'الذين', 'وقد', 'لقد', 'بعد', 'قبل', 'عند', 'حيث', 'كما', 'اما', 'الا', 'غير', 'بين', 'اذا', 'لدي', 'منذ', 'حتي', 'ضمن', 'خلال', 'وذلك', 'بان', 'ايضا', 'جميع', 'تم', 'يتم', 'قام', 'قامت', 'عن', 'الي', 'علي', 'في', 'من', 'مع', 'او', 'ان', 'لا', 'ما', 'هو', 'هي', 'لم', 'لن', 'قد', 'كل', 'اي', 'وهو', 'وهي', 'لها', 'له', 'لهم', 'بها', 'به', 'فيه', 'فيها', 'منه', 'منها', 'وكيل', 'وكيله', 'محامي', 'المحامي', 'السيد', 'السيده', 'شيكل', 'دينار', 'دولار', 'مبلغ', 'وقيمه', 'قيمه', 'يوم', 'شهر', 'عام', 'اول', 'ثاني', 'الاول', 'الثاني', 'موكل', 'موكلي', 'موكلنا', 'بتاريخ', 'استنادا', 'استناد', 'مستانف', 'مستانفه', 'مستانفين', 'مستدعي', 'مستدعيه', 'طاعن', 'طاعنه', 'مطعون', 'ضده', 'ضدها', 'ضدهم', 'يطالب', 'يستحق', 'تستحق', 'بموجب', 'المذكور', 'مذكور', 'المذكوره', 'وعليه', 'فقره', 'بند', 'لايحه', 'وقدمنا', 'قدمنا', 'ونريد', 'بقيمته', 'بقيمه', 'قيمته', 'واعيد', 'اعيد', 'رغم', 'منذ', 'الان', 'حاليا', 'يدعي', 'تدعي', 'ويدعي', 'كذلك', 'ايضا', 'بخصوص', 'يتعلق', 'تتعلق', 'بدون', 'دون', 'نريد', 'اريد', 'هل', 'يجوز', 'يحق', 'كيف', 'ماذا', 'لماذا', 'متي', 'نحن', 'انا', 'انه', 'انها', 'لكن', 'ولكن', 'فقط', 'جدا', 'اخر', 'احد', 'نفس', 'بشان', 'وفق', 'وفقا', 'حسب', 'لدى', 'مستند', 'مستندات', 'ملف', 'جلسه', 'جلسات']);

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
    out.push({ id: t.id, label: t.label, hits: t.w.filter(w => hits.includes(norm(w))).slice(0, 6), score: hits.length * 2 + Math.min(cnt, 10), laws: t.laws, q: t.q, aw: t.aw || [] });
  }
  out.sort((a, b) => b.score - a.score);
  /* موضوع بكلمة دالّة واحدة عابرة (مثل «شركة» في اسم صاحب العمل) لا يُعرض إلا إن كان الوحيد */
  return out.filter((t, i) => i === 0 || t.score >= 4).slice(0, 5);
}
/* النفي يقلب المعنى: «القتل غير العمد» ليس «القتل العمد». تُحذف «غير» من كلمات البحث كعامة، فتُعاد صياغة العبارة
   أولاً بألفاظ النص القانوني نفسه (م 343 ع 1960: «من سبب موت أحد عن إهمال أو قلة احتراز…»، و«التسبب بالوفاة» في لوائح الاتهام) */
const NEGQ = [
  [/(?:ال)?قتل\s+(?:(?:ال)?غير\s+(?:ال)?(?:عمد[يى]?|مقصود|قصد[يى])|(?:ال)?خط[أا]ء?|(?:بال|عن\s+)?[إا]همال)/g, ' التسبب بالوفاة سبب موت عن إهمال أو قلة احتراز '],
  [/(?:ال)?[إا]يذاء\s+(?:(?:ال)?غير\s+(?:ال)?(?:عمد[يى]?|مقصود|قصد[يى])|(?:ال)?خط[أا]ء?|(?:بال|عن\s+)?[إا]همال)/g, ' إيذاء عن إهمال أو قلة احتراز '],
  [/(?:ال)?غير\s+(?:ال)?(?:عمد[يى]?|مقصود|قصد[يى])/g, ' عن إهمال أو قلة احتراز '],
];
function rewriteNeg(text) { let t = String(text || ''); for (const [rx, to] of NEGQ) t = t.replace(rx, to); return t }

/* ── لغة الموكّل: عبارات عامية تُترجم إلى المصطلح القانوني الذي تُكتب به النصوص، فيُبحث بالاثنين معاً.
   تُضاف إلى ما يُبحث به فقط، ويُعرض للمحامي ما فُهم من سؤاله. الأنماط على نص مطبّع (ا/ه/ي، دون تشكيل) ── */
const LAY = [
  [/ورقه (?:دفع|بنكيه)|حسابي (?:فارغ|فاضي)|ما في (?:رصيد|مصاري)|ما فيه رصيد|رجع (?:الشيك|من البنك)|ارتجع/, 'شيك بدون رصيد'],
  [/طردني|طردوني|طردتني|فصلني|فصلوني|استغنوا عني|استغني عني|انهوا خدمتي|انهي خدمتي|مشوني من الشغل|وقفوني عن الشغل/, 'فصل العامل فصلاً تعسفياً تعويض'],
  [/سنوات (?:خدمتي|الخدمه|شغلي|عملي)|عن خدمتي|تعويض نهايه|حقوقي (?:من|عند) (?:الشركه|صاحب العمل|المشغل)/, 'مكافأة نهاية الخدمة'],
  [/(?:الشغل|شغلي|المشغل|الوظيفه|وظيفتي|المصنع|الورشه|صاحب الشركه|مدير الشركه)/, 'العامل صاحب العمل'],
  [/اصبت (?:اثناء|خلال|في|وانا في) (?:عملي|العمل|الشغل|المصنع|الورشه)|انصبت في الشغل|اصابتي في (?:العمل|الشغل)/, 'إصابة العمل'],
  [/(?:اترك|تركت|ترك) (?:عملي|الشغل|شغلي|الوظيفه|وظيفتي)|يسيء معاملتي|يهينني|يضربني|يشتمني/, 'ترك العامل العمل بعد إشعار صاحب العمل'],
  [/(?:الساكن|المستاجر|الساكنه|اللي ساكن)|ما (?:بيدفع|يدفع) (?:الايجار|الاجره)|لا يدفع (?:الايجار|الاجره)|اطلعه من (?:الشقه|البيت|المحل)|اخراجه/, 'إخلاء المأجور المستأجر'],
  [/المحكمه الادني|محكمه (?:صغيره|اصغر)|قيمه المطالبه|المبلغ اللي تنظره|حد (?:محكمه )?الصلح/, 'الاختصاص القيمي محكمة الصلح'],
  [/(?:وانا|وهو|وكنت|كنت|وموكلي) (?:غايب|غائب)|غايب عن (?:الجلسه|المحكمه)|دون حضوري|بدون حضوري|ما حضرت|لم احضر/, 'حكم غيابي اعتراض المحكوم عليه غيابياً'],
  [/المحكمه الاعلي|اعلي محكمه|اكبر محكمه|محكمه النقض/, 'الطعن بالنقض'],
  [/المرحله الثانيه|الدرجه الثانيه|محكمه الاستيناف|استانف|استينافه|استئنافه/, 'الاستئناف'],
  [/(?:اعترض|الاعتراض|اطعن|الطعن) (?:عليه|علي الحكم|في الحكم)|مده الاعتراض|اعترض امام/, 'ميعاد الطعن'],
  [/كم (?:يوم|يوما|المده|مده|شهر|وقت)|ما المده|ما هي المده|المده المتاحه|كم معي وقت|لدي (?:مده|وقت)/, 'ميعاد مدة'],
  [/من اي يوم|من متي (?:تبدا|تحسب)|تبدا (?:المده|مده)|متي (?:تبدا|يبدا) (?:المده|العد)/, 'يبدأ ميعاد الطعن من تاريخ'],
  [/(?:يسكن|ساكن|مقيم|يقيم) (?:في )?مدينه|مدينه (?:اخري|ثانيه)|(?:وين|اين|في اي (?:مدينه|محكمه)) ارفع/, 'الاختصاص المحلي موطن المدعى عليه'],
  [/متاخرا|متاخر|بعد (?:انتهاء|فوات) (?:المده|الميعاد)|فاتت (?:المده|المهله)|تاخرت (?:في|عن)/, 'بعد الميعاد رد الطعن شكلاً'],
  [/حكم جزايي|قضيه جزاييه|القضيه الجزاييه|جنحه|جنايه|حكم بالحبس|حبسوه|انحبس/, 'الدعوى الجزائية'],
  [/(?:يتوقف|توقف|يوقف|وقف) (?:تنفيذ|التنفيذ)|(?:يوقف|يوقفوا) الحكم/, 'وقف التنفيذ'],
  [/(?:جاري|جارنا|الجار|شريكي|شريكنا) باع|الارض الملاصقه|الملاصقه لارضي|ملاصق(?:ه)? لارضي|دون ان يعرض علي الشراء|احق بالشراء/, 'الشفعة حق الشفعة'],
  [/(?:سايق|سائق|يسوق|ساق) (?:تكسي|تاكسي|عمومي|باص|عموميه)|سياره (?:عموميه|اجره|تكسي)|تكسي/, 'مركبة عمومية رخصة سياقة'],
];
const lnorm = s => ' ' + flat(s).replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ئ/g, 'ي').replace(/ؤ/g, 'و').replace(/[^ء-ي0-9]+/g, ' ').replace(/\s+/g, ' ') + ' ';
function layTerms(text) { const t = lnorm(text), add = []; for (const [rx, to] of LAY) if (rx.test(t) && !t.includes(' ' + lnorm(to).trim() + ' ')) add.push(to); return [...new Set(add)] }

/* ── العقوبة: إن سأل المستخدم عن العقوبة تُستخرج جمل العقوبة من نص المادة حرفياً، مع أنواعها ومقاديرها كما وردت ── */
const PEN_Q = /عقوب|عقاب|يعاقب|يعاقَب|الجزاء|جزاء|حبس|سجن|غرام|[اأ]شغال|[اإ]عدام|كم سن[ةه]|كم سنوات|ما حكم|العقوبه/;
const PEN_W = new Set(['عقوبه', 'العقوبه', 'عقوبات', 'العقوبات', 'يعاقب', 'عقاب', 'العقاب', 'جزاء', 'الجزاء', 'حبس', 'الحبس', 'سجن', 'السجن', 'غرامه', 'الغرامه', 'اشغال', 'الاشغال', 'اعدام', 'الاعدام', 'حكم', 'سنه', 'سنوات']);
const PEN_RX = /يعاق[َب]|يُعاقب|عوقب|يعاقبون|العقوب[ةه]|عقوبت|بالحبس|بالسجن|بالغرام|بالأشغال|بالاشغال|بالإعدام|بالاعدام|بالاعتقال|الأشغال الشاقة|الاشغال الشاقه|بغرامة|الحبس|الغرامة/;
const PEN_KINDS = [['الإعدام', /[اإ]عدام/], ['الأشغال الشاقة المؤبدة', /[اأ]شغال الشاق[ةه] المؤبد[ةه]|[اأ]شغال الشاق[ةه] مؤبد/], ['الأشغال الشاقة المؤقتة', /[اأ]شغال الشاق[ةه](?! المؤبد)(?! مؤبد)/], ['الاعتقال', /اعتقال/], ['الحبس', /حبس/], ['السجن', /سجن/], ['الغرامة', /غرام[ةه]|بغرامة/]];
function penaltyOf(text) {
  const t = String(text || ''); if (!PEN_RX.test(flat(t))) return null;
  /* جمل كاملة كما وردت: تُقسم عند السطر الجديد والنقطة والفاصلة المنقوطة فقط */
  const clauses = t.split(/\n|(?<=[.؛])\s+/).map(x => x.trim()).filter(x => x && PEN_RX.test(flat(x)));
  if (!clauses.length) return null;
  const all = flat(clauses.join(' '));
  const kinds = PEN_KINDS.filter(([, rx]) => rx.test(all)).map(([k]) => k);
  const U = '(?:أيام|ايام|يوماً|يوما|يوم|أسابيع|اسابيع|أسبوع|اسبوع|أشهر|اشهر|شهرين|شهراً|شهرا|شهر|سنوات|سنتين|سنةً|سنة|سنه|دنانير|ديناراً|دينارا|دينار|جنيهاً|جنيها|جنيه|شواقل|شيكل)';
  const N = '(?:\\d{1,3}(?![\\d)])(?!\\s*\\))|واحد|اثن|ثلاث|اربع|أربع|خمس|ست|سبع|ثمان|تسع|عشر|مائ|مئ|الف|ألف|آلاف|الاف)', PRE = '(?:من|لا تقل عن|لا تزيد على|لا تتجاوز|لا تنقص عن|مدة|حتى)', RNG = '(?:\\s(?:إلى|الى|حتى)\\s[^،.؛\\n]{0,25}?' + U + ')?';
  /* مقدار يبدأ بعدد (أو بحرف مثل «حتى» يليه اسم المدة مباشرة: «حتى سنة»)، ولا يُعدّ رقم قانون أو سنة إصداره مقداراً */
  const mrx = new RegExp('(?<![\\u0621-\\u064A\\d])(?:' + PRE + '\\s' + U + '(?![\\u0621-\\u064A])' + RNG + '|(?:' + PRE + '\\s)?(?:ال)?' + N + '[^،.؛\\n]{0,22}?' + U + RNG + ')', 'g');
  const measures = [...new Set(clauses.flatMap(c => [...c.matchAll(mrx)].map(m => m[0].trim())))].filter(m => !/لسن[ةه]|\)/.test(m)).slice(0, 6);
  const refs = [...new Set(clauses.flatMap(c => [...flat(c).matchAll(/(?:المنصوص عليها|المذكورة|المقررة)\s+في\s+(?:ال)?ماد[ةه]\s*\(?\s*(\d+)/g)].map(m => m[1])))].slice(0, 3);
  return { clauses, kinds, measures, refs };
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

/* ── محرك السريان: ملاحظات التعديل والإلغاء المكتوبة في نص كل مادة كما في القاعدة ──
   «عدلت بموجب المادة رقم (3) من القرار بقانون رقم(24) لسنة2024م بشأن …»، «ألغيت هذه المادة بموجب …»، «أضيفت المادة رقم(5) بموجب …» */
const NOTE_RX = /(عُ?دّ?لت|ع?دلت|أُ?لغيت|الغيت|أُ?ضيفت|اضيفت)((?:\s+الفقرة\s*(?:رقم)?\s*\(?\s*\d+\s*\)?)?(?:\s+هذه\s+المادة|\s+المادة\s*(?:رقم)?\s*\(?\s*\d+\s*\)?)?)\s*بموجب\s+(?:ال)?مادة\s*(?:رقم)?\s*\(?\s*(\d+)\s*\)?\s*(?:من|م)?\s*/g;
function amendNotes(text) {
  const t = flat(text).slice(0, 2500), out = [];
  const ms = [...t.matchAll(NOTE_RX)];
  ms.forEach((m, i) => {
    const seg = t.slice(m.index + m[0].length, i + 1 < ms.length ? ms[i + 1].index : Math.min(t.length, m.index + m[0].length + 260));
    const type = /لغيت/.test(m[1]) ? 'repealed' : /ضيفت/.test(m[1]) ? 'added' : 'amended';
    const kind = /^\s*(?:ال)?أمر|^\s*امر/.test(seg) ? 'order' : /^\s*(?:ال)?قرار\s*بقانون/.test(seg) ? 'decree' : /^\s*(?:ال)?قانون/.test(seg) ? 'law' : 'other';
    let no = '', year = '';
    const mo = kind === 'order' && /\(\s*رقم\s*(\d+)\s*\)\s*لس\S*\s*(\d{4})/.exec(seg);
    const md = mo || /رقم\s*\(?\s*(\d+)\s*\)?\s*لسن[ةه]\s*(\d{4})/.exec(seg);
    if (md) { no = md[1]; year = md[2] }
    const para = (/الفقرة\s*(?:رقم)?\s*\(?\s*(\d+)/.exec(m[2] || '') || [])[1] || '';
    const label = (kind === 'order' ? 'الأمر' : kind === 'decree' ? 'القرار بقانون' : kind === 'law' ? 'القانون' : 'التشريع') + (no ? ' رقم (' + no + ')' : '') + (year ? ' لسنة ' + year : '');
    out.push({ type, para, byArticle: m[3], kind, no, year: year ? Number(year) : null, label });
  });
  return out;
}
/* مواعيد واختصاص من نصوص بعينها: يُحسب الموعد فقط إذا وُجدت العبارة المتوقعة حرفياً في نص المادة المخزّن */
const RULES = [
  { id: 'civ-appeal', group: 'civil', label: 'ميعاد الطعن بالاستئناف (حقوقي)', law: 'usul', art: '205', must: 'ثلاثين يوماً', days: 30 },
  { id: 'civ-appeal-urgent', group: 'civil', label: 'ميعاد الاستئناف في المواد المستعجلة', law: 'usul', art: '205', must: 'خمسة عشرة يوماً', days: 15 },
  { id: 'civ-cassation', group: 'civil', label: 'ميعاد الطعن بالنقض (حقوقي)', law: 'usul', art: '227', must: 'أربعين يوماً', days: 40 },
  { id: 'civ-retrial', group: 'civil', label: 'ميعاد الطعن بإعادة المحاكمة', law: 'usul', art: '252', must: 'ثلاثين يوماً', days: 30 },
  { id: 'admin', group: 'admin', label: 'ميعاد تقديم الاستدعاء إلى محكمة العدل العليا', law: 'usul', art: '284', must: 'ستين يوماً', days: 60 },
  { id: 'crim-objection', group: 'crim', label: 'اعتراض المحكوم عليه غيابياً (جنح ومخالفات)', law: 'crimproc', art: '314', must: 'العشرة أيام', days: 10 },
  { id: 'crim-appeal', group: 'crim', label: 'ميعاد الاستئناف (جزائي)', law: 'crimproc', art: '328', must: 'خمسة عشر يوماً', days: 15 },
  { id: 'crim-cassation', group: 'crim', label: 'ميعاد الطعن بالنقض (جزائي)', law: 'crimproc', art: '355', must: 'أربعين يوماً', days: 40 },
  { id: 'labour-injury', group: 'labour', label: 'سقوط حق المصاب في التعويض عن إصابة العمل', law: 'labour', art: '124', must: 'انقضاء سنتين', days: 730, years: 2 },
];
const CIVIL_TOPICS = new Set(['notice', 'jurisdiction', 'appeal', 'evidence', 'tort', 'accident', 'labour', 'rent', 'exec', 'cheque', 'companies', 'contract', 'limitation', 'urgent', 'arbitration', 'land', 'fees', 'consumer']);
const CRIM_TOPICS = new Set(['crimproc', 'penal', 'cyber', 'drugs', 'juvenile', 'trafficcrime']);

function createLocal({ misbar, now = () => new Date(), kv = null, sem = null } = {}) {
  /* ── تعليم المسبار: تقييمات طاقم المكتب وقاموسه، محفوظة في بيانات المكتب على الجهاز ── */
  const FB = 'mbl:fb', DICT = 'mbl:dict';
  const mem = new Map(), store = kv || { get: (k, d) => mem.has(k) ? mem.get(k) : d, set: (k, v) => mem.set(k, v) };
  const dict = () => { const d = store.get(DICT, null) || {}; return { syn: Array.isArray(d.syn) ? d.syn : [], pins: Array.isArray(d.pins) ? d.pins : [] } };
  const fbs = () => { const f = store.get(FB, null); return Array.isArray(f) ? f : [] };
  const wordsOf = s => [...new Set(norm(s).split(' ').filter(w => w.length >= 3 && !GENERIC.has(w)))];
  /* سؤالان متشابهان: نصف كلمات الأقصر منهما على الأقل مشتركة */
  const similar = (a, b) => { const A = new Set(a), sh = b.filter(w => A.has(w)).length; return sh >= 1 && sh / Math.min(a.length, b.length) >= 0.5 };
  /* حصيلة تقييمات النتيجة في الأسئلة المشابهة: موجب يرفعها، سالب يخفيها */
  /* التقييم: 1 مهم، -1 غير مرتبط، 2 مخالف يستحق الدراسة (لا يُخفى ولا يُرفع: يُعرض في «الرأي المعارض»)؛ ربط مرجع بقضية تقييم «مهم» بوزن مضاعف */
  function verdicts(terms) { const out = new Map(); for (const f of fbs()) if (similar(terms, f.terms || [])) { const v = out.get(f.key) || { sum: 0, up: 0, down: 0, contra: 0, linked: 0, f }; if (f.vote === 2) v.contra++; else { const w = f.src === 'link' ? 2 : 1; v.sum += f.vote * w; f.vote > 0 ? v.up++ : v.down++; if (f.src === 'link') v.linked++ } out.set(f.key, v) } return out }
  /* مرادفات القاموس: إن ورد أحد الطرفين في النص يُضاف الآخر إلى ما يُبحث به (لا إلى النص المعروض) */
  function expand(text) { const n = ' ' + norm(text) + ' ', add = []; for (const x of dict().syn) { const a = norm(x.a), b = norm(x.b); if (a && b) { if (n.includes(' ' + a + ' ') && !n.includes(' ' + b + ' ')) add.push(x.b); else if (n.includes(' ' + b + ' ') && !n.includes(' ' + a + ' ')) add.push(x.a) } } return add }
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
  /* أداة التعديل في القاعدة (لفتحها): عنوانها يحوي نوعها ورقمها وسنتها */
  const instCache = new Map();
  async function instrumentDoc(n) {
    if (!n.no) return null;
    const k = n.kind + ':' + n.no + ':' + (n.year || ''); if (instCache.has(k)) return instCache.get(k);
    let hit = null;
    try {
      /* بالرقم والسنة من العنوان مباشرة؛ الأمر العسكري يُعرف برقمه فقط */
      const cands = typeof misbar.byNumber === 'function' ? await misbar.byNumber(n.kind, n.no, n.kind === 'order' ? '' : n.year) : [];
      hit = cands.find(x => /تعديل|بتعديل/.test(x.title)) || cands[0] || null;
    } catch { hit = null }
    const v = hit ? { id: hit.id, title: hit.title, hasText: hit.has_text !== 0 } : null; instCache.set(k, v); return v;
  }
  /* فحص سريان مادة (أو تشريع إن لم تُذكر مادة) بالنسبة لمكان الواقعة وتاريخها */
  async function validity(lawId, artText, ctx) {
    const d = await getDoc(lawId), flags = []; if (!d) return { flags };
    const ey = ctx.eventDate ? Number(String(ctx.eventDate).slice(0, 4)) : null;
    const code = d.status_code || '', st = d.status || '';
    if (code === 'repealed' || /ملغ/.test(st)) flags.push({ level: 'bad', text: 'التشريع ملغى حسب القاعدة' + (ey ? '؛ تحقق هل كان نافذاً سنة ' + ey : '') });
    else if (code === 'suspended' || /موقوف/.test(st)) flags.push({ level: 'bad', text: 'التشريع موقوف النفاذ حسب القاعدة' });
    if (ctx.region === 'gaza' && (code === 'partial' || (/الضفة/.test(st) && !/غزة/.test(st)))) flags.push({ level: 'bad', text: 'ساري في الضفة الغربية فقط حسب القاعدة، والواقعة في قطاع غزة' });
    const ly = Number(d.year) || null;
    if (ey && ly && ly > ey && ctx.lawLevel !== false) flags.push({ level: 'warn', text: `صدر التشريع سنة ${ly} بعد تاريخ الواقعة (${ey}): تحقق من سريانه زمنياً على الواقعة` });
    const notes = artText ? amendNotes(artText) : [];
    for (const n of notes) {
      const inst = await instrumentDoc(n); if (inst) { n.instTitle = inst.title; if (inst.hasText) n.instId = inst.id; else n.instNoText = true }
      const verb = n.type === 'repealed' ? 'أُلغيت' : n.type === 'added' ? 'أُضيفت' : 'عُدّلت' + (n.para ? ' الفقرة (' + n.para + ')' : '');
      const by = `${verb} بموجب المادة (${n.byArticle}) من ${n.label}`;
      if (!n.year) { flags.push({ level: 'info', text: by, note: n }); continue }
      if (!ey) flags.push({ level: n.type === 'repealed' ? 'bad' : 'info', text: by, note: n });
      else if (n.year > ey) flags.push({ level: 'warn', note: n, text: n.type === 'repealed' ? `${by} — بعد الواقعة (${ey})؛ كانت قائمة وقتها حسب القاعدة` : n.type === 'added' ? `${by} — بعد الواقعة (${ey})؛ لم تكن موجودة وقتها` : `${by} — بعد الواقعة (${ey})؛ النص المعروض هو النص بعد التعديل وقد يختلف عن النص النافذ وقت الواقعة` });
      else flags.push({ level: n.type === 'repealed' ? 'bad' : 'info', note: n, text: `${by} — قبل الواقعة (${ey})` });
    }
    return { flags, notes, lawYear: ly, statusCode: code };
  }

  /* المواد الأقرب لنص المستخدم داخل تشريع: تطابق الكلمات الثقيلة، والمادة الملغاة لا تُقترح */
  /* ترتيب مواد التشريع (على نهج BM25F): عنوان المادة أثقل من متنها، والكلمة النادرة في القانون أثقل من الشائعة فيه،
     والمادة الطويلة لا تتقدم لمجرد طولها؛ وعبارة «خلال … يوماً» تُعدّ ميعاداً */
  function rankArticles(arts, terms, n = 3) {
    if (!terms.length) return [];
    const seen = new Set(), DEF = /^(?:لغايات|التعاريف|تعاريف|يسمى هذا|يعمل بهذا|على جميع الجهات|يلغى|يُلغى)/;
    const live = arts.filter(a => !a.repealed && !seen.has(a.n) && seen.add(a.n));
    const has = (t, w) => w.length <= 3 ? t.includes(' ' + w + ' ') : t.includes(' ' + w) || t.includes(w + ' ');
    const docs = live.map(a => {
      const body = flat(a.text).replace(/^(?:\s*\d+\s*-\s*)?(?:عدلت|عُدلت|ألغيت|الغيت|أضيفت)[\s\S]*?وتعديلاته\s*/, '');
      let t = ' ' + norm(body) + ' ';
      if (/خلال\s+\S+(?:\s+عشر)?\s+(?:يوم|يوما|ايام|اسبوع|شهر|اشهر|سنه|سنتين)/.test(t) || /(?:يوما|ايام|اشهر|سنتين)\s/.test(t)) t += ' ميعاد مده ';
      const head = ' ' + norm(body.split(/\s\d+\s*-|\s[أا]-\s/)[0].slice(0, 90)) + ' ';
      return { a, t, head, len: t.split(' ').length };
    });
    const N = docs.length || 1, avg = docs.reduce((x, d) => x + d.len, 0) / N;
    const idf = new Map(terms.map(w => { const df = docs.filter(d => has(d.t, w)).length; return [w, Math.log(1 + (N - df + 0.5) / (df + 0.5))] }));
    return docs.map(d => {
      const hit = terms.filter(w => has(d.t, w)), hh = terms.filter(w => has(d.head, w));
      const norm1 = 0.25 + 0.75 * d.len / avg;
      const s = hit.reduce((x, w) => x + idf.get(w) * 2.2 / (1 + 1.2 * norm1), 0) + hh.reduce((x, w) => x + idf.get(w) * 2, 0);
      return { a: d.a, hit, s: s * (DEF.test(flat(d.a.text).trim()) || d.a.n === '1' ? 0.4 : 1) };
    }).filter(x => x.hit.length >= Math.min(2, terms.length)).sort((a, b) => b.s - a.s).slice(0, n).map(x => ({ n: x.a.n, label: x.a.label, text: x.a.text, why: 'تطابقت فيها: ' + x.hit.slice(0, 5).join('، ') }));
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

  /* ── خريطة القضية: جمل من الأحكام نفسها (حرفياً) تذكر الأركان أو الشروط، وجمل تذكر الدفوع؛ تُعرض كما وردت مع حكمها، لا استنتاجاً ── */
  const REQ_RX = /(?:أركان|اركان|عناصر|يشترط|يُشترط|تشترط|شروط|يتعين لقيام|لقيام (?:جريمة|جنحة|جناية|المسؤولية|الدعوى))/;
  const DEF_RX = /(?:الدفع ب|دفع ب|انتفاء|انعدام|سقوط (?:الحق|الدعوى)|عدم (?:قبول|مسؤولية|توافر)|قوة قاهرة|القوة القاهرة|خطأ المضرور|مشاركة المضرور|مساهمة المصاب|التقادم|حسن النية|سوء النية|الإكراه|الدفاع الشرعي)/;
  function mapFrom(d, r, terms, REQ, DEF) {
    const sents = String(d.body || '').replace(/\r/g, '').split(/(?<=[.؛؟!])\s+|\n+/).map(x => x.replace(/\s+/g, ' ').trim()).filter(x => x.length >= 40 && x.length <= 600);
    const rel = x => { const t = ' ' + norm(x) + ' '; return terms.filter(w => t.includes(' ' + w) || t.includes(w + ' ')).length };
    const ref = { id: d.id, title: d.title, court: d.court, case_no: d.case_no, date: d.date || d.year };
    let nr = 0, nd = 0;
    for (const x of sents) {
      const f = flat(x);
      if (nr < 2 && REQ_RX.test(f) && rel(x) >= 1 && !REQ.some(q => q.text === x)) { REQ.push({ text: x, ...ref }); nr++; continue }
      if (nd < 2 && DEF_RX.test(f) && rel(x) >= 1 && !DEF.some(q => q.text === x)) { DEF.push({ text: x, ...ref }); nd++ }
    }
  }
  async function analyze({ text = '', title = '', region = '', eventDate = '' } = {}) {
    const src = String(text || '').slice(0, 200000);
    if (src.replace(/\s/g, '').length < 10) return { status: 400, body: { error: 'اكتب السؤال أو الوقائع (10 أحرف على الأقل).' } };
    const t0 = Date.now();
    const srcN = rewriteNeg(src), synAdd = expand(srcN), layAdd = layTerms(srcN), plus = [...synAdd, ...layAdd], srch = plus.length ? srcN + '\n' + plus.join('\n') : srcN;
    const cs = citations(src), tp = topics(srch), kt = keyterms(srch), ds = dates(src);
    const law = await cited(cs);
    /* كلمات البحث: كلمات الموضوعات الدالّة أولاً ثم الأثقل في النص، دون كلمات أسماء التشريعات المذكورة (تملأ النتائج بكل حكم ذكر القانون) */
    const titleW = new Set(law.filter(c => c.lawTitle).flatMap(c => norm(c.lawTitle).split(' ')).concat(['قانون', 'فلسطيني']));
    const topicW = tp.flatMap(t => t.hits.flatMap(h => norm(h).split(' '))).filter(w => w.length >= 3 && !GENERIC.has(w));
    const penQ = PEN_Q.test(flat(src));
    /* سؤال العقوبة: كلمات العقوبة هي غرض السؤال لا موضوعه، فلا تُرتَّب بها المواد (وإلا تقدّمت مواد العقوبات العامة) */
    const terms = [...new Set([...topicW, ...kt.terms])].filter(w => !titleW.has(w) && !(penQ && PEN_W.has(w))).slice(0, 14);
    /* التشريعات المعنية بالموضوعات، وأقرب موادها لنص المستخدم */
    const lawKeys = [...new Set(tp.flatMap(t => t.laws))].slice(0, 5), related = [];
    for (const k of lawKeys) {
      const L = await resolveLaw(k); if (!L || related.some(r => r.lawId === L.id)) continue;
      /* قانون العقوبات لسنة 1960 يكتب «شك» لا «شيك» */
      /* كلمات مواد إضافية يحددها الموضوع لقانون بعينه («دهس» ← «سبب موت، قلة احتراز» في العقوبات) */
      const aw = [...new Set(tp.filter(t => t.laws.includes(k)).flatMap(t => (t.aw || []).flatMap(x => norm(x).split(' '))).filter(w => w.length >= 3))];
      const rt = [...terms, ...aw.filter(w => !terms.includes(w))];
      const rk = rankArticles(await articlesOf(L.id), k === 'penal' && rt.includes('شيك') ? [...rt, 'شك'] : rt, penQ ? 6 : 3);
      /* سؤال العقوبة: أعلى ثلاث مواد، ثم ما بعدها إن كان فيه نص عقوبة */
      const arts = (penQ ? rk.filter((a, i) => i < 3 || penaltyOf(a.text)) : rk).slice(0, penQ ? 5 : 3).filter(a => !law.some(c => c.lawId === L.id && c.article === a.n));
      related.push({ lawId: L.id, title: L.title, status: L.status, topic: (tp.find(t => t.laws.includes(k)) || {}).label || '', articles: arts });
    }
    /* ── البحث الدلالي (إن توفّر نموذجه على الجهاز): أقرب المواد في المعنى. لا يُستعمل وحده:
       (1) هنا: إن لم يجد البحث النصي مادتين على الأقل تُضاف حتى أربع مواد قريبة المعنى موسومة (مادتان لكل تشريع، وتشريعان جديدان على الأكثر)؛
       (2) في آخر التحليل: يُعاد ترتيب المواد المعروضة بدمج ترتيبها مع ترتيب المعنى (RRF) داخل تشريعاتها فقط، دون تقديم ما ثبّته المكتب أو قيّمه ── */
    let semUsed = null, semHits = [];
    const skey = (l, n) => l + ':' + n;
    if (sem && src.length <= 1500) {
      try { semHits = await sem.search(srcN, { k: 30, getDoc }) } catch { semHits = [] }
      const baseN = law.filter(c => c.found).length + related.reduce((n, L) => n + L.articles.length, 0);
      if (semHits.length) semUsed = { added: 0, agreed: 0 };
      if (semHits.length && baseN < 2) {
        let newLaws = 0; const perLaw = new Map();
        for (const h of semHits.slice(0, 10)) {
          if (semUsed.added >= 4) break;
          if (law.some(c => c.lawId === h.lawId && c.article === h.n) || related.some(L => L.lawId === h.lawId && L.articles.some(a => a.n === h.n))) continue;
          if ((perLaw.get(h.lawId) || 0) >= 2) continue;
          let Lr = related.find(r => r.lawId === h.lawId);
          if (!Lr) { if (newLaws >= 2) continue; const d = await getDoc(h.lawId); if (!d) continue; Lr = { lawId: h.lawId, title: d.title, status: d.status || '', topic: 'قريب في المعنى من السؤال', articles: [] }; related.push(Lr); newLaws++ }
          const a = (await articlesOf(h.lawId)).find(x => x.n === h.n); if (!a || a.repealed) continue;
          Lr.articles.push({ n: a.n, label: a.label, text: a.text, why: 'قريبة في معناها من السؤال (بحث دلالي على الجهاز)', sem: true });
          perLaw.set(h.lawId, (perLaw.get(h.lawId) || 0) + 1); semUsed.added++;
        }
      }
    }
    /* استعلامات الأحكام: الكلمات الدالّة، ثم كل موضوع، ثم كل مادة مذكورة (الأحكام التي ورد فيها رقمها مع اسم قانونها) */
    const Q = [], q6 = terms.slice(0, 6);
    if (q6.length) Q.push({ q: q6.join(' '), label: 'كلمات النص: ' + q6.join('، '), w: 1.4 });
    for (const p of kt.phrases) Q.push({ q: '"' + p + '"', label: 'عبارة متكررة: ' + p, w: 1.2, mode: 'all' });
    for (const t of tp.slice(0, 3)) Q.push({ q: t.q, label: 'موضوع: ' + t.label });
    const artQ = [];
    for (const c of law.filter(x => x.found).slice(0, 4)) { const lw = norm(c.lawTitle).split(' ').filter(w => w.length >= 3 && !/\d/.test(w) && !['قانون', 'لسنه', 'رقم', 'بشان', 'فلسطيني', 'قرار', 'بقانون'].includes(w)).slice(0, 2); const q = { q: '"ماده ' + c.article + '" ' + lw.join(' '), label: 'ورد فيه ' + c.label + ' من ' + c.lawTitle, w: 1.6, mode: 'all', art: c.article, lw }; Q.push(q); artQ.push(q) }
    let ps = await rulings(Q, 'PS_JUDGMENT', 10, 12);
    const REQ = [], DEF = [];
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
      out.push({ ...r, why, excerpt: ex, cites: (d.cites || []).slice(0, 8).map(c => c.title), outcome: structure(d.body).result });
      mapFrom(d, r, terms, REQ, DEF);
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
      if (!L) { const hit = (typeof misbar.byTitle === 'function' ? await misbar.byTitle(title, 'PS_LEGISLATION', 20) : []).find(x => norm(x.title) === norm(title)); if (!hit) continue;
        /* تشريع أظهرته الأحكام: تُضاف أيضاً أقرب مواده لكلمات المسألة */
        L = { lawId: hit.id, title: hit.title, status: hit.status || '', topic: 'استندت إليه الأحكام أدناه', articles: rankArticles(await articlesOf(hit.id), terms, 2).filter(a => !law.some(c => c.lawId === hit.id && c.article === a.n)) }; related.push(L) }
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
    /* ── ما تعلّمه المسبار من المكتب ── */
    const qw = [...new Set([...terms, ...wordsOf(src)])].slice(0, 24), V = verdicts(qw), learned = { hidden: 0, boosted: 0, pinned: 0, synonyms: synAdd, lay: layAdd, sem: semUsed };
    const vOf = k => V.get(k);
    /* مواد ثبّتها المكتب لهذا الموضوع: كل كلمات العبارة موجودة في السؤال */
    for (const p of dict().pins) {
      const pw = wordsOf(p.phrase); if (!pw.length || !pw.every(w => qw.includes(w) || norm(srch).includes(w))) continue;
      if (law.some(c => c.lawId === p.lawId && c.article === p.n)) continue;
      let L = related.find(r => r.lawId === p.lawId);
      if (!L) { const d = await getDoc(p.lawId); if (!d) continue; L = { lawId: p.lawId, title: d.title, status: d.status || '', topic: 'قاموس المكتب', articles: [] }; related.unshift(L) }
      const a = (await articlesOf(p.lawId)).find(x => x.n === p.n); if (!a) continue;
      const ex = L.articles.find(x => x.n === p.n), why = 'مثبّتة في قاموس المكتب لـ«' + p.phrase + '»';
      if (ex) { ex.why = why + ' · ' + ex.why; ex.pinned = true } else L.articles.unshift({ n: p.n, label: a.label, text: a.text, why, pinned: true });
      learned.pinned++;
    }
    /* تقييمات المواد والأحكام في الأسئلة المشابهة */
    for (const L of related) {
      L.articles = L.articles.filter(a => { const v = vOf('A:' + L.lawId + ':' + a.n); if (v && v.sum < 0 && !a.pinned) { learned.hidden++; return false } if (v && v.sum > 0) { a.why = `قيّمها المكتب مفيدة (${v.up}) · ` + a.why; a.liked = v.up; learned.boosted++ } return true });
      L.articles.sort((a, b) => (b.pinned ? 2 : 0) + (b.liked ? 1 : 0) - (a.pinned ? 2 : 0) - (a.liked ? 1 : 0) || (b.relied || 0) - (a.relied || 0));
    }
    ps = ps.filter(r => { const v = vOf('R:' + r.id); if (v && v.sum < 0) { learned.hidden++; return false } if (v && v.sum > 0) { r.why = [`قيّمه المكتب مفيداً (${v.up})`, ...r.why]; r.liked = v.up; learned.boosted++ } return true });
    /* حكم قيّمه المكتب مفيداً لسؤال مشابه ولم يظهر هذه المرة: يُضاف */
    for (const [k, v] of V) { if (!k.startsWith('R:') || v.sum <= 0 || ps.some(r => 'R:' + r.id === k)) continue; const d = await getDoc(Number(k.slice(2))); if (!d || d.src !== 'PS_JUDGMENT') continue;
      ps.push({ id: d.id, title: d.title, court: d.court, case_no: d.case_no, date: d.date || d.year, source: d.source, primary: d.primary, excerpt: bestPassage(d.body, terms), cites: (d.cites || []).slice(0, 8).map(c => c.title), why: [`قيّمه المكتب مفيداً (${v.up}) لسؤال مشابه`], liked: v.up }); learned.boosted++ }
    for (const r of ps) { const v = vOf('R:' + r.id); if (v && v.contra) r.contra = v.contra; if (v && v.linked) r.linked = v.linked }
    ps.sort((a, b) => (b.liked ? 1 : 0) - (a.liked ? 1 : 0));
    /* (2) إعادة الترتيب بالمعنى: ترتيب المواد الحالي (بعد ما استندت إليه الأحكام وتقييمات المكتب) مدموجاً مع ترتيب المعنى داخل التشريعات المعروضة */
    if (semHits.length) {
      const here = new Set(related.map(L => L.lawId)), baseL = related.flatMap(L => L.articles.map(a => skey(L.lawId, a.n)));
      const semL = semHits.filter(h => here.has(h.lawId)).map(h => skey(h.lawId, h.n)), fz = new Map();
      [baseL, semL].forEach(l => l.forEach((k, i) => fz.set(k, (fz.get(k) || 0) + 1 / (60 + i + 1))));
      const rk = (l, n) => -(fz.get(skey(l, n)) || 0), top = a => (a.pinned ? 2 : 0) + (a.liked ? 1 : 0);
      for (const L of related) { L.articles.sort((x, y) => top(y) - top(x) || rk(L.lawId, x.n) - rk(L.lawId, y.n)); for (const a of L.articles) if (!a.sem && semL.includes(skey(L.lawId, a.n))) { a.why = 'أكّدها البحث الدلالي · ' + a.why; a.semAgree = true; semUsed.agreed++ } }
      const best = L => Math.min(...L.articles.map(a => rk(L.lawId, a.n)), 0), pin = L => L.articles.some(a => a.pinned) ? 1 : 0;
      related.sort((x, y) => pin(y) - pin(x) || best(x) - best(y));
    }
    const cmp2 = cmp.filter(r => { const v = vOf('R:' + r.id); if (v && v.sum < 0) { learned.hidden++; return false } return true });
    /* ── فحص السريان والاختصاص ── */
    const evs = dates(src), evUser = /^\d{4}-\d{2}-\d{2}$/.test(String(eventDate)) ? String(eventDate) : '';
    const ctx = { region: ['wb', 'gaza'].includes(region) ? region : '', eventDate: evUser || (evs[0] && evs[0].date) || '', eventFrom: evUser ? 'user' : evs[0] ? 'text' : '' };
    for (const c of law) if (c.found) c.valid = await validity(c.lawId, c.text, ctx);
    for (const L of related) { L.valid = await validity(L.lawId, '', ctx); for (const a of L.articles) a.valid = await validity(L.lawId, a.text, { ...ctx, lawLevel: false }) }
    /* قاعدة سريان قانون الأصول من حيث الزمان (المادة 1) تُعرض حين يكون في النتائج نص منه عُدّل بعد الواقعة */
    let timeRule = null; const usul = await resolveLaw('usul');
    const usulLate = usul && [...law.filter(c => c.lawId === usul.id && c.valid), ...related.filter(L => L.lawId === usul.id).flatMap(L => L.articles)].some(a => a.valid && a.valid.flags.some(f => f.level === 'warn' && f.note));
    if (usulLate) { const a1 = (await articlesOf(usul.id)).find(a => a.n === '1'); if (a1) timeRule = { lawId: usul.id, lawTitle: usul.title, label: a1.label, text: a1.text } }
    /* المواعيد ذات الصلة بموضوع المسألة، مع نص مادتها والتحقق من عبارة المدة فيه */
    const ids = new Set(tp.map(t => t.id)), groups = new Set();
    const crimText = /جزائي|جزائية|جنح|جناي|المتهم|النيابة العامة|بإدانة|إدانة|الحبس|غيابي|غيابياً/.test(flat(src));
    if ([...ids].some(i => CRIM_TOPICS.has(i)) || crimText) groups.add('crim');
    if ([...ids].some(i => CIVIL_TOPICS.has(i)) && !(crimText && !ids.has('appeal') && !ids.has('jurisdiction') && ![...ids].some(i => ['tort', 'accident', 'labour', 'rent', 'contract', 'exec'].includes(i)))) groups.add('civil');
    /* شيك مع سياق جزائي: مواعيد الجزاء وحدها إلا إن ذُكرت مطالبة مدنية */
    if (ids.has('cheque') && crimText && !/مدني|حقوقي|مطالبة بقيمة|دعوى مدنية/.test(flat(src))) groups.delete('civil'); if (ids.has('labour') || ids.has('accident')) groups.add('labour'); if (ids.has('civilservice')) groups.add('admin');
    const deadlines = [];
    for (const R of RULES.filter(r => groups.has(r.group))) {
      const L = await resolveLaw(R.law); if (!L) continue; const a = (await articlesOf(L.id)).find(x => x.n === R.art); if (!a) continue;
      const ok = flat(a.text).includes(flat(R.must));
      deadlines.push({ id: R.id, label: R.label, lawId: L.id, lawTitle: L.title, article: R.art, articleLabel: a.label, text: a.text, days: ok ? R.days : null, years: ok ? R.years || null : null, verified: ok, valid: await validity(L.id, a.text, { ...ctx, lawLevel: false }) });
    }
    let countRule = null; if (deadlines.length && usul) { const a21 = (await articlesOf(usul.id)).find(a => a.n === '21'); if (a21) countRule = { lawId: usul.id, label: a21.label, lawTitle: usul.title, text: a21.text } }
    /* الاختصاص القيمي (حقوقي): يُقارن بالحد المكتوب في نص المادة 39 من قانون الأصول كما هو مخزّن */
    let jurisdiction = null;
    if (groups.has('civil') && usul && (ids.has('jurisdiction') || amounts(src).length)) {
      const a39 = (await articlesOf(usul.id)).find(a => a.n === '39'), a41 = (await articlesOf(usul.id)).find(a => a.n === '41');
      const lim = a39 && /\(\s*([\d,٬]+)\s*\)\s*عشرة\s*ال[اآ]ف\s*دينار/.exec(flat(a39.text));
      const jod = amounts(src).filter(x => x.currency === 'دينار أردني'), other = amounts(src).filter(x => x.currency !== 'دينار أردني');
      if (a39) {
        const limit = lim ? Number(lim[1].replace(/[,٬]/g, '')) : null, max = jod.length ? Math.max(...jod.map(x => x.value)) : null;
        jurisdiction = { lawId: usul.id, lawTitle: usul.title, articles: [{ label: a39.label, text: a39.text }, ...(a41 ? [{ label: a41.label, text: a41.text }] : [])], limit, claim: max,
          verdict: limit && max != null ? (max <= limit ? `أكبر مبلغ بالدينار في النص (${max.toLocaleString('en')}) لا يتجاوز حد محكمة الصلح في المادة 39 (${limit.toLocaleString('en')})` : `أكبر مبلغ بالدينار في النص (${max.toLocaleString('en')}) يتجاوز حد محكمة الصلح في المادة 39 (${limit.toLocaleString('en')})، فالولاية العامة لمحكمة البداية (المادة 41)`) : '',
          note: other.length && !jod.length ? 'المبالغ في النص بغير الدينار؛ قدّر ما يعادلها بالدينار للمقارنة بحد المادة 39.' : '', valid: await validity(usul.id, a39.text, ctx) };
      }
    }
    /* خانات العقوبة: من المواد المذكورة في النص ثم مواد التشريعات المعنية؛ والمادة التي تحيل عقوبتها إلى مادة أخرى من القانون نفسه تُعرض معها */
    const penalties = [], penShow = penQ || groups.has('crim');
    if (penShow) {
      const cand = [...law.filter(c => c.found).map(c => ({ lawId: c.lawId, lawTitle: c.lawTitle, n: c.article, label: c.label, text: c.text, from: 'cite' })),
        ...related.flatMap(L => L.articles.map(a => ({ lawId: L.lawId, lawTitle: L.title, n: a.n, label: a.label, text: a.text, from: 'law' })))];
      for (const c of cand) {
        if (penalties.length >= 8 || penalties.some(p => p.lawId === c.lawId && p.n === c.n)) continue;
        const P = penaltyOf(c.text); if (!P || !P.kinds.length) continue;
        const refs = [];
        for (const n of P.refs) { const a = (await articlesOf(c.lawId)).find(x => x.n === n); const RP = a && penaltyOf(a.text); if (RP) refs.push({ n, label: a.label, clauses: RP.clauses, kinds: RP.kinds, measures: RP.measures }) }
        penalties.push({ lawId: c.lawId, lawTitle: c.lawTitle, n: c.n, label: c.label, from: c.from, clauses: P.clauses, kinds: P.kinds, measures: P.measures, refs });
      }
    }
    /* «الرأي المعارض»: أحكام طبّقت المادة نفسها وانتهت إلى نتائج مختلفة، وما وسمه المكتب «مخالفاً يستحق الدراسة» — لا تقدير فيه، تصنيف المنطوق آلي */
    const OUTC = o => /قُبل الطعن|نُقض|أُلغي|البراءة/.test(o) ? 'for' : /رُدّ الطعن|رُدّ الطلب|عدم القبول|الإدانة/.test(o) ? 'against' : '';
    const byArt = new Map();
    for (const r of ps) { const side = [...new Set((r.outcome || []).map(OUTC).filter(Boolean))]; if (side.length !== 1) continue; for (const c of r.cites || []) { const m = /^المادة رقم (\d+) من (.+)$/.exec(c); if (!m) continue; const k = c; if (!byArt.has(k)) byArt.set(k, { cite: c, for: [], against: [] }); byArt.get(k)[side[0]].push({ id: r.id, case_no: r.case_no, court: r.court, date: r.date, outcome: (r.outcome || []).join('، ') }) } }
    const opposing = { split: [...byArt.values()].filter(x => x.for.length && x.against.length).slice(0, 6), contra: ps.filter(r => r.contra).map(r => ({ id: r.id, title: r.title, case_no: r.case_no, court: r.court, date: r.date, excerpt: r.excerpt, contra: r.contra })) };
    const am = amounts(src), cn = caseNos(src);
    const total = am.reduce((a, x) => { a[x.currency] = (a[x.currency] || 0) + x.value; return a }, {});
    return { status: 200, body: {
      title: clip(title, 160), at: now().toISOString(), ms: Date.now() - t0, offline: true,
      topics: tp.map(({ q, laws, aw, ...t }) => t), keyterms: { terms, phrases: kt.phrases },
      citations: law, laws: related, penQ, penShow, penalties, rulings: ps, requisites: REQ.slice(0, 8), defenses: DEF.slice(0, 8), opposing, outcomes: (() => { const c = {}; for (const x of ps) for (const o of x.outcome || []) c[o] = (c[o] || 0) + 1; return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n })) })(), comparative: cmp2, learned, qterms: qw, ctx, timeRule, deadlines, countRule, jurisdiction,
      timeline: timeline(ds), amounts: am.slice(0, 40), amountTotals: total, caseNos: cn.slice(0, 30),
      notice: 'نتائج بحث آلي من القاعدة المحلية دون إنترنت: النصوص منقولة حرفياً، والمدد والمبالغ محسوبة من النص المُدخل. لا يتضمن رأياً قانونياً؛ راجع كل نتيجة قبل الاعتماد عليها.',
    } };
  }


  /* ── «اكتشف ما فاتك»: ما استشهدت به الأحكام الفلسطينية في المسألة نفسها ولم يذكره المحامي في مذكرته ──
     يُستخرج ما ذكره (مواد وأحكام)، ثم تُجمع استشهادات الأحكام الأقرب لموضوعه، ويُعرض الفارق بوصفه فرصاً للفحص لا استنتاجات */
  async function gaps({ text = '', title = '', region = '', eventDate = '' } = {}) {
    const src = String(text || '').slice(0, 200000);
    if (src.replace(/\s/g, '').length < 80) return { status: 400, body: { error: 'الصق المذكرة أو اللائحة كاملة (80 حرفاً على الأقل).' } };
    const t0 = Date.now();
    const r = await analyze({ text: src, title, region, eventDate }); if (r.status !== 200) return r;
    const b = r.body;
    /* ما ذكره المحامي */
    const citedKeys = new Set(b.citations.filter(c => c.found).map(c => c.lawId + ':' + c.article));
    const citedLaws = new Set(b.citations.filter(c => c.found).map(c => c.lawId));
    const mentionedCases = new Set(caseNos(src).map(c => c.no));
    /* استشهادات الأحكام الأقرب: تُعدّ كل مادة بعدد الأحكام التي استندت إليها، مع الأحكام نفسها */
    const pool = b.rulings.filter(x => x.primary);
    const byArt = new Map();
    for (const x of pool) for (const c of x.cites || []) { const m = /^المادة رقم (\d+) من (.+)$/.exec(c); if (!m) continue; const k = m[2].trim() + '|' + m[1]; const v = byArt.get(k) || { lawTitle: m[2].trim(), n: m[1], rulings: [] }; if (!v.rulings.some(y => y.id === x.id)) v.rulings.push({ id: x.id, title: x.title, case_no: x.case_no, date: x.date }); byArt.set(k, v) }
    const missed = [], covered = [];
    for (const v of [...byArt.values()].sort((a, c) => c.rulings.length - a.rulings.length)) {
      const hit = (typeof misbar.byTitle === 'function' ? await misbar.byTitle(v.lawTitle, 'PS_LEGISLATION', 20) : []).find(x => norm(x.title) === norm(v.lawTitle));
      if (!hit) continue;
      const key = hit.id + ':' + v.n;
      const a = (await articlesOf(hit.id)).find(x => x.n === v.n);
      const item = { lawId: hit.id, lawTitle: hit.title, status: hit.status || '', n: v.n, label: a ? a.label : 'المادة (' + v.n + ')', text: a ? a.text : '', repealed: a ? a.repealed : false, rulings: v.rulings.slice(0, 6), count: v.rulings.length, valid: await validity(hit.id, a ? a.text : '', { region: b.ctx.region, eventDate: b.ctx.eventDate, lawLevel: false }) };
      if (citedKeys.has(key)) covered.push(item); else if (v.rulings.length >= 2 || citedLaws.has(hit.id)) missed.push(item);
      if (missed.length >= 12) break;
    }
    /* أحكام في المسألة نفسها لم يذكرها: بترتيب الصلة، مع ما يؤيد الموكل وما قد يعارضه حسب صفته */
    const role = /المدعى عليه|المستأنف عليه|المطعون ضده|المشتكى عليه|المتهم/.test(flat(src).slice(0, 1500)) && !/بصفتي وكيلاً عن المدعي|موكلي المدعي|وكيل المدعي/.test(flat(src)) ? 'defendant' : 'plaintiff';
    const unseen = []; for (const x of pool.filter(x => !mentionedCases.has(x.case_no)).slice(0, 8)) { const d = await getDoc(x.id); unseen.push({ ...x, stance: stanceOf(d ? structure(d.body) : null, role) }) }
    /* دفوع شكلية متوقعة في موضوعه لم ترد في مذكرته: تُقترح من المواد لا من عندنا */
    const DEF = [
      { id: 'notice', words: ['تبليغ', 'بطلان التبليغ'], law: 'usul', arts: ['13', '20', '22'], label: 'بطلان التبليغ' },
      { id: 'jurisdiction', words: ['عدم الاختصاص', 'الاختصاص القيمي', 'الاختصاص المكاني'], law: 'usul', arts: ['39', '42'], label: 'الدفع بعدم الاختصاص' },
      { id: 'appeal', words: ['ميعاد', 'بعد الميعاد', 'شكلاً'], law: 'usul', arts: ['193', '195', '205'], label: 'رد الطعن شكلاً لفوات الميعاد' },
      { id: 'interest', words: ['المصلحة', 'الصفة'], law: 'usul', arts: ['3'], label: 'انتفاء المصلحة أو الصفة' },
      { id: 'resjudicata', words: ['حاز قوة الأمر المقضي', 'سبق الفصل'], law: 'usul', arts: ['226'], label: 'سبق الفصل في النزاع' },
    ];
    const defenses = [];
    const n = ' ' + norm(src) + ' ', topicIds = new Set(b.topics.map(t => t.id));
    for (const D of DEF) {
      if (D.words.some(w => n.includes(' ' + norm(w) + ' ') || n.includes(norm(w)))) continue;
      const L = await resolveLaw(D.law); if (!L) continue; const arts = await articlesOf(L.id);
      const found = D.arts.map(k => arts.find(a => a.n === k)).filter(Boolean).map(a => ({ label: a.label, text: a.text }));
      if (found.length) defenses.push({ id: D.id, label: D.label, lawId: L.id, lawTitle: L.title, articles: found, why: 'لم ترد عبارة «' + D.words[0] + '» في المذكرة؛ يُعرض للفحص فقط' });
    }
    return { status: 200, body: { title: clip(title, 160), at: now().toISOString(), ms: Date.now() - t0, offline: true, ctx: b.ctx, topics: b.topics,
      cited: b.citations, coveredCount: covered.length, missed, unseenRulings: unseen, defenses, role,
      notice: 'فرص للفحص لا استنتاجات: ما يلي هو ما استشهدت به الأحكام الفلسطينية الأقرب لموضوع مذكرتك ولم يرد فيها، مع نصوصه كما في القاعدة. صلته بوقائعك يقدّرها المحامي.' } };
  }
  /* يؤيد أم يعارض؟ تصنيف آلي لمنطوق الحكم بالنسبة لصفة الموكل (مدعٍ/طاعن أم مدعى عليه)، يُعرض كاحتمال لا حكم */
  function stanceOf(st, role) {
    if (!st || !st.result || !st.result.length) return '';
    const won = st.result.some(r => /قُبل الطعن|نُقض|أُلغي/.test(r)), lost = st.result.some(r => /رُدّ الطعن/.test(r));
    if (!won && !lost) return '';
    const forAppellant = won && !lost;
    return role === 'plaintiff' ? (forAppellant ? 'قد يؤيد (قُبل الطعن)' : 'قد يعارض (رُدّ الطعن)') : (forAppellant ? 'قد يعارض (قُبل الطعن)' : 'قد يؤيد (رُدّ الطعن)');
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


  /* ── تنبيهات التشريع على مراجع القضايا: مادة مربوطة بقضية عُدّلت أو أُلغيت بعد ربطها، أو صدر تعديل لقانونها بعد الربط ── */
  async function refAlerts(b) {
    const refs = (Array.isArray(b.refs) ? b.refs : []).slice(0, 600), out = [], lawAm = new Map();
    for (const r of refs) {
      const id = Number(r.docId) || 0; if (!id) continue; const at = String(r.at || '').slice(0, 10), ay = Number(at.slice(0, 4)) || 0;
      const d = await getDoc(id); if (!d || d.kind === 'ruling') continue;
      const items = [];
      if (r.art) { const a = (await articlesOf(id)).find(x => x.n === String(r.art)); if (a) { const v = await validity(id, a.text, { eventDate: at, lawLevel: false }); for (const f of v.flags) if (f.level === 'warn' || f.level === 'bad') items.push({ level: f.level, text: f.text.replace('بعد الواقعة', 'بعد ربطها بالقضية').replace('قبل الواقعة', 'قبل ربطها').replace('وقت الواقعة', 'وقت ربطها'), instId: f.note && f.note.instId || null }) } }
      if (d.status_code === 'repealed' || /ملغ/.test(d.status || '')) items.push({ level: 'bad', text: 'التشريع ملغى حسب القاعدة' });
      /* تعديلات القانون كله الصادرة بعد الربط (بعنوانها: «بتعديل <القانون>») */
      if (!lawAm.has(id)) {
        const core = norm(d.title).replace(/م$/, '').replace(/^(?:ال)?/, ''), found = [];
        if (typeof misbar.byTitle === 'function') for (const x of await misbar.byTitle('تعديل ' + d.title, 'PS_LEGISLATION', 60)) { const t = norm(x.title); if (x.id !== id && /تعديل|معدل/.test(t) && t.includes(core.slice(0, Math.min(core.length, 60)))) found.push({ id: x.id, title: x.title, year: Number(x.year) || 0 }) }
        lawAm.set(id, found.sort((a, b) => b.year - a.year));
      }
      for (const x of lawAm.get(id)) if (ay && x.year > ay) items.push({ level: 'warn', text: 'صدر بعد ربطه بالقضية: ' + x.title, instId: x.id });
      if (items.length) out.push({ key: r.key || '', caseId: r.caseId || '', docId: id, art: r.art || '', title: d.title, at, items: items.slice(0, 6) });
    }
    return { status: 200, body: { alerts: out, checked: refs.length } };
  }
  /* ── أرقام نافذة: قيم يحسب بها المحامي، كل منها بنص مصدرها حرفياً من القاعدة؛ وما ليس له مصدر تشريعي يحدده المكتب ── */
  const VALS = 'mbl:vals';
  const REFV = [
    { key: 'minwage', label: 'الحد الأدنى للأجور', kind: 'cabinet', no: '4', year: '2021', kw: 'الاجور', art: '1', pick: [[/\(\s*([\d,.]+)\s*\)[^.\n]{0,40}شهري/, 'شهرياً', 'شيكل'], [/\(\s*([\d,.]+)\s*\)[^.\n]{0,40}يومي/, 'يومياً لعمال المياومة', 'شيكل'], [/ساع[ةه][\s\S]*?قدره\s*\(\s*([\d,.]+)\s*\)/, 'للساعة', 'شيكل']] },
    { key: 'courtfees', label: 'جدول رسوم المحاكم النظامية (آخر تعديل)', kind: 'cabinet', no: '6', year: '2023', kw: 'رسوم المحاكم' },
    { key: 'courtfeeslaw', label: 'قانون رسوم المحاكم النظامية', kind: 'law', no: '1', year: '2003', kw: 'رسوم المحاكم' },
    { key: 'interest', label: 'الفائدة القانونية', kind: 'law', title: 'قانون معدل الفائدة القانوني' },
    { key: 'appealjur', label: 'الاختصاص المكاني لمحاكم الاستئناف', kind: 'cabinet', no: '1', year: '2021', kw: 'الاختصاص المكاني', group: 'courts' },
    { key: 'courts', label: 'تشكيل المحاكم النظامية', kind: 'decree', no: '39', year: '2020', kw: 'تشكيل المحاكم', group: 'courts' },
    { key: 'notary', label: 'الكاتب العدل', kind: 'law', no: '11', year: '1952', kw: 'الكاتب العدل', group: 'courts' },
  ];
  /* التشريع المقصود بعينه: النوع والرقم والسنة وكلمة من موضوعه («قرار مجلس الوزراء» لا «قرار رئيس مجلس الوزراء») */
  async function refDoc(R) {
    if (R.title) return typeof misbar.byTitle === 'function' ? (await misbar.byTitle(R.title, 'PS_LEGISLATION', 10))[0] || null : null;
    if (typeof misbar.byNumber !== 'function') return null;
    const xs = await misbar.byNumber(R.kind === 'cabinet' ? '' : R.kind, R.no, R.year);
    return xs.find(x => { const t = flat(x.title); return (R.kind !== 'cabinet' || (/مجلس\s*الوزراء/.test(t) && !/رئيس\s*مجلس\s*الوزراء/.test(t))) && (!R.kw || norm(x.title).includes(norm(R.kw))) }) || null;
  }
  async function refValues() {
    const out = [];
    for (const R of REFV) {
      const hit = await refDoc(R);
      if (!hit) { out.push({ ...R, pick: undefined, missing: true }); continue }
      const d = await getDoc(hit.id), arts = d ? splitArticles(d.body) : [], a = R.art ? arts.find(x => x.n === R.art) : null;
      const text = a ? a.text : '', values = [];
      for (const [rx, unit, cur] of R.pick || []) { const m = rx.exec(flat(text)); if (m) values.push({ value: m[1], unit, currency: cur }) }
      out.push({ key: R.key, label: R.label, group: R.group || 'values', docId: hit.id, title: hit.title, status: hit.status || '', hasText: !!(d && d.body && d.body.length > 50), art: a ? a.label : '', text, values });
    }
    const v = store.get(VALS, null) || {};
    return { status: 200, body: { items: out, office: { fxJod: v.fxJod || '', fxUsd: v.fxUsd || '', fxDate: v.fxDate || '', interest: v.interest || '', barFees: v.barFees || '', by: v.by || '', at: v.at || '' } } };
  }
  /* بحث في نصوص المحاكم عن بلدة أو منطقة: الأسطر التي ورد فيها الاسم كما هي */
  async function courtFind(b) {
    const q = norm(String(b.q || '')).trim(); if (q.length < 2) return { status: 400, body: { error: 'اكتب اسم البلدة أو المنطقة.' } };
    const hits = [];
    for (const R of REFV.filter(r => r.group === 'courts')) {
      const x = await refDoc(R); if (!x) continue;
      const d = await getDoc(x.id); if (!d || !d.body) continue;
      for (const a of splitArticles(d.body)) { if (norm(a.text).includes(q)) hits.push({ docId: x.id, title: x.title, art: a.label, text: a.text }) }
    }
    return { status: 200, body: { q: b.q, hits: hits.slice(0, 30) } };
  }


  /* ── «افحص ملف القضية»: دورة محدودة شبه مستقلة دون نموذج لغوي ──
     1) يقرأ وقائع القضية ومستنداتها  2) يستخرج المسائل (كل موضوع مع جمله الدالّة حرفياً) وأسئلة المحامي
     3) يبحث لكل مسألة، ويعيد البحث بكلمات الموضوع إن لم يجد (حد محاولتين)  4) يفحص السريان والمواعيد (داخل analyze)
     5) يقارن مستندات القضية بقائمة أدلة الموضوع  6) يجمع كل شيء في نتيجة واحدة ويقول «لم أجد» حيث لم يجد. لا يكتب رأياً. */
  const EVID = {
    accident: ['المخطط المروري (كروكي الحادث)', 'ضبط الشرطة / تقرير الحادث', 'تقرير الخبير الفني للمركبة', 'التقرير الطبي أو تقرير الطب الشرعي', 'شهادة الوفاة (إن وُجدت وفاة)', 'إفادات الشهود', 'وثيقة التأمين', 'رخصة القيادة ورخصة المركبة'],
    trafficcrime: ['المخطط المروري (كروكي الحادث)', 'ضبط الشرطة / تقرير الحادث', 'تقرير الخبير الفني للمركبة', 'تقرير الطب الشرعي', 'إفادات الشهود', 'رخصة القيادة ورخصة المركبة', 'لائحة الاتهام أو قرار النيابة'],
    labour: ['عقد العمل', 'كشوف الرواتب أو قسائم الأجر', 'كتاب إنهاء الخدمة أو الفصل', 'إثبات مدة الخدمة', 'سجل الحضور والإجازات', 'الإنذار أو الإشعار'],
    cheque: ['صورة الشيك (وجهاً وظهراً)', 'إشعار الرجوع من البنك', 'كشف الحساب', 'الإنذار العدلي'],
    rent: ['عقد الإيجار', 'إيصالات الأجرة', 'الإنذار العدلي أو إخطار الإخلاء', 'سند ملكية العقار أو ما يثبت صفة المؤجر'],
    contract: ['العقد', 'المراسلات بين الطرفين', 'الإنذار العدلي', 'إثبات الدفع أو التنفيذ'],
    tort: ['تقرير الخبرة بتقدير الضرر', 'الفواتير والمستندات المالية', 'التقارير الطبية', 'إفادات الشهود'],
    penal: ['ضبط الشرطة', 'إفادات الشهود', 'التقرير الطبي', 'تقرير الأدلة الجنائية', 'لائحة الاتهام'],
    crimproc: ['ضبط الشرطة', 'قرار النيابة', 'محضر التبليغ', 'لائحة الاتهام'],
    land: ['سند التسجيل (الطابو)', 'مخطط الأرض', 'كشف الحدود', 'عقد البيع أو حجة الوكالة'],
    personal: ['عقد الزواج', 'شهادة الولادة', 'حجة حصر الإرث', 'شهادة الوفاة'],
    exec: ['السند التنفيذي', 'محضر التبليغ', 'كشف الذمة', 'قرار دائرة التنفيذ'],
    companies: ['عقد التأسيس والنظام', 'شهادة التسجيل', 'محاضر الاجتماعات', 'الميزانيات'],
    notary: ['الوكالة العدلية', 'ما يثبت استمرار الوكالة أو عزلها'],
  };
  const EVK = { 'المخطط المروري (كروكي الحادث)': ['مخطط', 'كروكي'], 'ضبط الشرطة / تقرير الحادث': ['ضبط', 'الشرطة', 'تقرير الحادث'], 'تقرير الخبير الفني للمركبة': ['خبير', 'خبرة', 'فني'], 'التقرير الطبي أو تقرير الطب الشرعي': ['طبي', 'الطب الشرعي', 'تشريح'], 'تقرير الطب الشرعي': ['الطب الشرعي', 'تشريح', 'طبي'], 'شهادة الوفاة (إن وُجدت وفاة)': ['شهادة وفاة', 'الوفاة'], 'إفادات الشهود': ['إفادة', 'افادة', 'شاهد', 'شهود'], 'وثيقة التأمين': ['تأمين', 'بوليصة', 'وثيقة'], 'رخصة القيادة ورخصة المركبة': ['رخصة'], 'لائحة الاتهام أو قرار النيابة': ['اتهام', 'النيابة'], 'عقد العمل': ['عقد'], 'كشوف الرواتب أو قسائم الأجر': ['راتب', 'رواتب', 'أجر', 'قسيمة'], 'كتاب إنهاء الخدمة أو الفصل': ['إنهاء', 'فصل', 'انهاء'], 'إثبات مدة الخدمة': ['خدمة', 'خبرة'], 'سجل الحضور والإجازات': ['حضور', 'إجازة', 'دوام'], 'الإنذار أو الإشعار': ['إنذار', 'انذار', 'إشعار'], 'صورة الشيك (وجهاً وظهراً)': ['شيك'], 'إشعار الرجوع من البنك': ['رجوع', 'مرتجع', 'البنك'], 'كشف الحساب': ['كشف حساب', 'كشف'], 'الإنذار العدلي': ['إنذار', 'انذار', 'عدلي'], 'عقد الإيجار': ['إيجار', 'ايجار', 'عقد'], 'إيصالات الأجرة': ['إيصال', 'ايصال', 'أجرة'], 'الإنذار العدلي أو إخطار الإخلاء': ['إنذار', 'انذار', 'إخلاء'], 'سند ملكية العقار أو ما يثبت صفة المؤجر': ['ملكية', 'طابو', 'سند'], 'العقد': ['عقد', 'اتفاقية'], 'المراسلات بين الطرفين': ['مراسلة', 'رسالة', 'كتاب'], 'إثبات الدفع أو التنفيذ': ['دفع', 'وصل', 'حوالة'], 'تقرير الخبرة بتقدير الضرر': ['خبرة', 'خبير', 'تقدير'], 'الفواتير والمستندات المالية': ['فاتورة', 'فواتير'], 'التقارير الطبية': ['طبي', 'تقرير طبي'], 'ضبط الشرطة': ['ضبط', 'الشرطة'], 'التقرير الطبي': ['طبي'], 'تقرير الأدلة الجنائية': ['أدلة', 'ادلة', 'بصمات', 'مختبر'], 'لائحة الاتهام': ['اتهام'], 'قرار النيابة': ['النيابة'], 'محضر التبليغ': ['تبليغ', 'محضر'], 'سند التسجيل (الطابو)': ['طابو', 'تسجيل', 'سند'], 'مخطط الأرض': ['مخطط', 'خارطة'], 'كشف الحدود': ['حدود', 'كشف'], 'عقد البيع أو حجة الوكالة': ['بيع', 'وكالة'], 'عقد الزواج': ['زواج', 'قران'], 'شهادة الولادة': ['ولادة', 'ميلاد'], 'حجة حصر الإرث': ['حصر', 'إرث', 'ارث', 'وراثة'], 'شهادة الوفاة': ['وفاة'], 'السند التنفيذي': ['سند', 'تنفيذي'], 'كشف الذمة': ['ذمة'], 'قرار دائرة التنفيذ': ['التنفيذ'], 'عقد التأسيس والنظام': ['تأسيس', 'نظام'], 'شهادة التسجيل': ['تسجيل'], 'محاضر الاجتماعات': ['محضر', 'اجتماع'], 'الميزانيات': ['ميزانية', 'مالية'], 'الوكالة العدلية': ['وكالة'], 'ما يثبت استمرار الوكالة أو عزلها': ['عزل', 'وكالة'] };
  const SENT = t => String(t || '').replace(/\r/g, '').split(/(?<=[.؛؟!])\s+|\n+/).map(x => x.replace(/\s+/g, ' ').trim()).filter(x => x.length >= 12);
  async function inspect(b) {
    const t0 = Date.now(), src = String(b.text || '').slice(0, 200000);
    if (src.replace(/\s/g, '').length < 15) return { status: 400, body: { error: 'لا وقائع تُفحص: اكتب وقائع القضية أو اقرأ مستنداتها أولاً.' } };
    const log = [], ci = b.caseInfo || {};
    /* 1) القراءة */
    const facts = src.split(/\n==== مستند:/)[0], sents = SENT(src);
    log.push({ step: 'قراءة', text: `قُرئت الوقائع${ci.docs != null ? ` و${ci.read || 0} من ${ci.docs} مستنداً` : ''} (${sents.length} جملة)` });
    /* 2) المسائل: لكل موضوع الجمل التي ذكرته حرفياً؛ وأسئلة المحامي */
    /* موضوع لم يُطابَق إلا بكلمة هي جزء من عبارة موضوع آخر («شركة» من «شركة التأمين») يُستبعد */
    const tp0 = topics(rewriteNeg(src)), tp = tp0.filter(t => { const others = tp0.filter(o => o !== t).flatMap(o => o.hits.map(norm)).filter(h => h.includes(' ')); return !t.hits.every(h => others.some(o => o.split(' ').includes(norm(h)))) }).slice(0, 4), issues = [];
    for (const t of tp) {
      const hits = t.hits.map(norm), qs = sents.filter(x => { const n = ' ' + norm(x) + ' '; return hits.some(h => n.includes(' ' + h + ' ') || (h.includes(' ') && n.includes(h))) }).slice(0, 6);
      issues.push({ id: t.id, label: t.label, hits: t.hits, facts: qs, attempts: 0, found: false });
    }
    const questions = sents.filter(x => /[؟?]\s*$/.test(x) || /^(?:هل|ما|كم|متى|من|أين|كيف)\s/.test(x)).slice(0, 10);
    log.push({ step: 'استخراج', text: issues.length ? `استُخرجت ${issues.length} مسألة: ${issues.map(i => i.label).join('، ')}${questions.length ? ` — و${questions.length} سؤال في النص` : ''}` : 'لم يُتعرَّف على موضوع قانوني من كلمات النص؛ سيُبحث بالنص كله' });
    /* 3) البحث لكل مسألة مع إعادة محدودة */
    const runs = [], merged = { opposing: { split: [], contra: [] }, laws: [], rulings: [], comparative: [], penalties: [], requisites: [], defenses: [], deadlines: [], citations: [], outcomes: {} };
    const key = (L, a) => L.lawId + ':' + a.n;
    const absorb = (r, iss) => {
      for (const L of r.laws || []) { let M = merged.laws.find(x => x.lawId === L.lawId); if (!M) { M = { ...L, articles: [] }; merged.laws.push(M) } for (const a of L.articles || []) if (!M.articles.some(x => x.n === a.n)) M.articles.push({ ...a, issue: iss && iss.label }) }
      for (const c of r.citations || []) if (!merged.citations.some(x => x.lawId === c.lawId && x.article === c.article)) merged.citations.push(c);
      for (const x of r.rulings || []) if (!merged.rulings.some(y => y.id === x.id)) { merged.rulings.push({ ...x, issue: iss && iss.label }); for (const o of x.outcome || []) merged.outcomes[o] = (merged.outcomes[o] || 0) + 1 }
      for (const x of r.comparative || []) if (!merged.comparative.some(y => y.id === x.id)) merged.comparative.push(x);
      for (const x of r.penalties || []) if (!merged.penalties.some(y => y.lawId === x.lawId && y.n === x.n)) merged.penalties.push(x);
      for (const x of r.requisites || []) if (!merged.requisites.some(y => y.text === x.text)) merged.requisites.push(x);
      for (const x of r.defenses || []) if (!merged.defenses.some(y => y.text === x.text)) merged.defenses.push(x);
      for (const x of r.deadlines || []) if (!merged.deadlines.some(y => y.id === x.id)) merged.deadlines.push(x);
      for (const x of (r.opposing || {}).split || []) if (!merged.opposing.split.some(y => y.cite === x.cite)) merged.opposing.split.push(x);
      for (const x of (r.opposing || {}).contra || []) if (!merged.opposing.contra.some(y => y.id === x.id)) merged.opposing.contra.push(x);
      return (r.laws || []).some(L => (L.articles || []).length) || (r.rulings || []).length > 0;
    };
    let base = null;
    const targets = issues.length ? issues : [{ id: 'all', label: 'النص كله', facts: [], hits: [], attempts: 0, found: false }];
    for (const iss of targets) {
      let text = iss.id === 'all' ? src : (iss.facts.join('\n') || src.slice(0, 4000));
      for (let k = 0; k < 2 && !iss.found; k++) {
        iss.attempts++;
        const r = (await analyze({ text, title: iss.label, region: b.region, eventDate: b.eventDate })).body;
        if (!base) base = r;
        iss.found = absorb(r, iss); iss.laws = (r.laws || []).map(L => ({ title: L.title, n: (L.articles || []).map(a => a.n) })); iss.rulings = (r.rulings || []).length;
        runs.push({ issue: iss.label, attempt: iss.attempts, found: iss.found, ms: r.ms });
        if (!iss.found) { const T = TOPICS.find(t => t.id === iss.id); text = (iss.facts.join('\n') || '') + '\n' + (T ? T.q + ' ' + T.w.slice(0, 6).join(' ') : src.slice(0, 2000)) }
      }
    }
    log.push({ step: 'بحث', text: `${runs.length} عملية بحث${runs.filter(x => x.attempt > 1).length ? `، منها ${runs.filter(x => x.attempt > 1).length} إعادة بحث بكلمات الموضوع` : ''}؛ وُجدت مراجع لـ${targets.filter(i => i.found).length} من ${targets.length} مسألة` });
    /* 4) الفحص: السريان والتعديل داخل analyze؛ هنا يُحصى */
    const flagged = merged.laws.flatMap(L => L.articles.filter(a => a.valid && a.valid.flags.some(f => f.level !== 'info'))).length + merged.citations.filter(c => c.valid && c.valid.flags.some(f => f.level !== 'info')).length;
    log.push({ step: 'تمحيص', text: `فُحص سريان ${merged.laws.reduce((s, L) => s + L.articles.length, 0) + merged.citations.length} مادة${flagged ? `؛ ${flagged} منها عليها تنبيه تعديل أو إلغاء أو سريان` : '؛ لا تنبيهات'}، و${merged.deadlines.length} ميعاد` });
    /* 5) الأدلة: قائمة الموضوع مقابل مستندات القضية (بعناوينها ونصوصها) */
    const titles = (ci.titles || []).map(x => norm(x)), body = norm(src);
    const evidence = [];
    for (const iss of issues.filter(i => i.found)) for (const item of EVID[iss.id] || []) {
      const kws = (EVK[item] || []).map(norm);
      if (evidence.some(x => x.label === item || x.kws.some(k => kws.includes(k)))) continue;
      const inTitle = titles.find(t => kws.some(k => t.includes(k))), inText = !inTitle && kws.some(k => body.includes(' ' + k)) ;
      evidence.push({ label: item, issue: iss.label, kws, status: inTitle ? 'doc' : inText ? 'text' : 'missing', doc: inTitle ? (ci.titles || [])[titles.indexOf(inTitle)] : '' });
    }
    log.push({ step: 'أدلة', text: evidence.length ? `قائمة أدلة الموضوع: ${evidence.filter(x => x.status === 'doc').length} مرفقة، ${evidence.filter(x => x.status === 'text').length} مذكورة في النص دون مرفق، ${evidence.filter(x => x.status === 'missing').length} غير موجودة` : 'لا قائمة أدلة لهذا الموضوع' });
    /* 6) النتيجة: مسائل بلا مراجع تُذكر صراحة */
    const notFound = targets.filter(i => !i.found).map(i => i.label);
    const r = { ...(base || {}), title: b.title || 'فحص ملف القضية', ms: Date.now() - t0, offline: true,
      topics: tp.map(({ q, laws, aw, ...t }) => t), laws: merged.laws, citations: merged.citations, rulings: merged.rulings, comparative: merged.comparative.slice(0, 6), penalties: merged.penalties, penShow: merged.penalties.length > 0,
      requisites: merged.requisites.slice(0, 8), defenses: merged.defenses.slice(0, 8), opposing: merged.opposing, deadlines: merged.deadlines, outcomes: Object.entries(merged.outcomes).sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n })),
      inspect: { log, issues: targets.map(i => ({ id: i.id, label: i.label, facts: i.facts, attempts: i.attempts, found: i.found, laws: i.laws || [], rulings: i.rulings || 0 })), questions, evidence, notFound, runs },
      notice: 'فحص آلي من القاعدة المحلية دون إنترنت ودون نموذج لغوي: المسائل مستخرجة من كلمات الوقائع، والمراجع منقولة حرفياً، وقائمة الأدلة قائمة تحقق عامة للموضوع لا نص قانوني. حيث لم يجد المسبار مراجع قال ذلك ولم يكتب بديلاً. القرار للمحامي.' };
    return { status: 200, body: r };
  }

  async function handle(action, b, me, audit) {
    try {
      if (action === 'analyze') { const r = await analyze(b); audit && audit({ user_id: me && me.id, user_name: me && me.name, action: 'misbar.local.analyze', entity: 'misbar', detail: { chars: String(b.text || '').length, laws: r.body.citations ? r.body.citations.length : 0 } }); return r }
      if (action === 'dissect') return await dissect(b);
      if (action === 'inspect') { const r = await inspect(b); audit && audit({ user_id: me && me.id, user_name: me && me.name, action: 'misbar.local.inspect', entity: 'misbar', detail: { chars: String(b.text || '').length, issues: r.body.inspect ? r.body.inspect.issues.length : 0 } }); return r }
      if (action === 'gaps') { const r = await gaps(b); audit && audit({ user_id: me && me.id, user_name: me && me.name, action: 'misbar.local.gaps', entity: 'misbar', detail: { chars: String(b.text || '').length, missed: r.body.missed ? r.body.missed.length : 0 } }); return r }
      const who = { user_id: me && me.id, user_name: me && me.name };
      if (action === 'dict') return { status: 200, body: dict() };
      if (action === 'learned') return { status: 200, body: { items: fbs().map((f, i) => ({ i, key: f.key, vote: f.vote, src: f.src || 'vote', terms: f.terms || [], title: f.title || '', by: f.byName || '', at: f.at || '', ref: f.ref || '' })).reverse(), dict: dict() } };
      if (action === 'learned-del') { const at = String(b.at || ''), key = String(b.key || ''); const all = fbs().filter(f => !(f.key === key && f.at === at)); store.set(FB, all); audit && audit({ ...who, action: 'misbar.local.unlearn', entity: 'misbar', detail: { key } }); return { status: 200, body: { ok: true, count: all.length } } }
      if (action === 'learned-reset') { if (b.confirm !== 'reset') return { status: 400, body: { error: 'تأكيد مطلوب.' } }; const n = fbs().length; store.set(FB, []); audit && audit({ ...who, action: 'misbar.local.reset', entity: 'misbar', detail: { removed: n } }); return { status: 200, body: { ok: true, removed: n } } }
      if (action === 'refalerts') return await refAlerts(b);
      if (action === 'refvalues') return await refValues();
      if (action === 'courtfind') return await courtFind(b);
      if (action === 'vals-save') {
        const v = { fxJod: clip(b.fxJod, 20), fxUsd: clip(b.fxUsd, 20), fxDate: clip(b.fxDate, 10), interest: clip(b.interest, 20), barFees: clip(b.barFees, 4000), by: me && me.name, at: now().toISOString() };
        store.set(VALS, v); audit && audit({ ...who, action: 'misbar.local.vals', entity: 'misbar', detail: { fxJod: v.fxJod, interest: v.interest } }); return await refValues();
      }
      if (action === 'feedback') {
        const key = String(b.key || ''); if (!/^(?:R:\d+|A:\d+:\d+(?: مكرر\S*)?)$/.test(key)) return { status: 400, body: { error: 'نتيجة غير معروفة.' } };
        const vote = Number(b.vote), terms = wordsOf((Array.isArray(b.terms) ? b.terms : []).join(' ')).slice(0, 24);
        if (!terms.length) return { status: 400, body: { error: 'لا كلمات للسؤال.' } };
        /* تقييم الشخص نفسه للنتيجة نفسها في سؤال مشابه يُستبدل، و0 يلغيه */
        const src = b.src === 'link' ? 'link' : 'vote', ref = clip(b.ref, 80);
        const all = fbs().filter(f => !(f.key === key && (f.src || 'vote') === src && (src === 'link' ? f.ref === ref : f.by === (me && me.id) && similar(terms, f.terms || []))));
        if (vote === 1 || vote === -1 || vote === 2) all.push({ key, vote, terms, title: clip(b.title, 200), by: me && me.id, byName: me && me.name, at: now().toISOString(), src, ...(ref ? { ref } : {}) });
        store.set(FB, all.slice(-3000)); audit && audit({ ...who, action: 'misbar.local.feedback', entity: 'misbar', detail: { key, vote } });
        return { status: 200, body: { ok: true, count: all.length } };
      }
      if (action === 'dict-save') {
        const syn = (Array.isArray(b.syn) ? b.syn : []).map(x => ({ a: clip(x && x.a, 80), b: clip(x && x.b, 80) })).filter(x => norm(x.a) && norm(x.b) && norm(x.a) !== norm(x.b)).slice(0, 500);
        const pins = (Array.isArray(b.pins) ? b.pins : []).map(x => ({ phrase: clip(x && x.phrase, 120), lawId: Number(x && x.lawId) || 0, n: clip(x && x.n, 20), title: clip(x && x.title, 200), label: clip(x && x.label, 60) })).filter(x => wordsOf(x.phrase).length && x.lawId && x.n).slice(0, 500);
        store.set(DICT, { syn, pins, at: now().toISOString(), by: me && me.name }); audit && audit({ ...who, action: 'misbar.local.dict', entity: 'misbar', detail: { syn: syn.length, pins: pins.length } });
        return { status: 200, body: dict() };
      }
      return { status: 404, body: { error: 'غير موجود' } };
    } catch (e) {
      const m = String(e && e.message || e);
      if (/no such table|SQLITE_CANTOPEN|unable to open/i.test(m)) return { status: 503, body: { error: 'قاعدة المسبار غير مثبتة على هذا الجهاز بعد', code: 'NO_INDEX' } };
      throw e;
    }
  }
  return { analyze, dissect, gaps, handle, resolveLaw };
}

module.exports = { layTerms, LAY, penaltyOf, PEN_Q, rewriteNeg, createLocal, amendNotes, RULES, citations, dates, amounts, caseNos, topics, keyterms, splitArticles, matchLaw, LAWS, TOPICS };
