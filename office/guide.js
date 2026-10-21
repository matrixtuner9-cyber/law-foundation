/* ── دليل ميثاق: مساعد داخل التطبيق لتعلّم استخدامه ──
   1) دليل مكتوب لكل شاشة: ما الذي تفعله، وخطوات المهام الشائعة، ونصائح عملية.
   2) جولة مرئية «أرني» تُبرز عناصر الشاشة واحداً واحداً مع شرح.
   3) «اسأل عن التطبيق»: سؤال حر يجيب عنه الذكاء الاصطناعي من هذا الدليل فقط (إن كان المفتاح مضبوطاً).
   يفتح الدليل على موضوع الشاشة الحالية تلقائياً. يعمل دون إنترنت ما عدا السؤال الحر. */
(function(){
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const N=v=>`[data-act="nav"][data-v="${v}"]`;

/* المواضيع: id، العنوان، الشاشة (للانتقال والجولة)، الخلاصة، خطوات، نصائح، جولة [محدد، شرح] */
const T=[
 {id:'start',g:'البداية',t:'جولة سريعة في ميثاق',v:'dash',s:'ميثاق يجمع ملفات المكتب كلها حول القضية: الموكل، والجلسات والمهل، والمستندات، والأتعاب، والبحث القانوني والصياغة.',
  steps:['القائمة الجانبية فيها كل الشاشات، مقسّمة إلى العمل اليومي والأدوات والإدارة.','الشاشة الرئيسية تعرض جلسات اليوم والمهل القريبة والرسائل الجديدة واختصارات المساعد الذكي.','البحث الشامل في الأعلى يجد أي قضية أو موكل أو خصم برقم أو اسم.','أي شاشة فيها زر طباعة تُطبع بترويسة المكتب، ويمكن حفظها PDF.'],
  tips:['اضغط Ctrl+K للانتقال إلى البحث الشامل.','زر «؟» في الأعلى يفتح هذا الدليل على موضوع الشاشة التي أنت فيها.'],
  tour:[['#nav','القائمة الجانبية: انتقل منها بين الشاشات.'],['#gq','البحث الشامل: اكتب رقم قضية أو اسم موكل أو خصم.'],['.as-home','اختصارات المساعد الذكي: ملخص قبل الجلسة، سؤال قانوني، تحليل مستند، أسباب الطعن، والحاسبات.'],['#tbPrint','زر الطباعة: يطبع الشاشة الحالية بترويسة المكتب.']]},
 {id:'clients',g:'العمل اليومي',t:'الموكلون وملف الموكل',v:'clients',s:'ملف كل موكل يجمع قضاياه وأتعابه وقناة تواصله المفضلة وحالة دخوله للبوابة. يُعرض بطاقاتٍ أو سجلات (جدول).',
  steps:['لإضافة موكل: «+ موكل جديد»، املأ البيانات، ثم يُجري التطبيق فحص تعارض المصالح تلقائياً قبل الحفظ.','للتبديل إلى عرض الجدول اضغط «سجلات»: فرز بأي عمود، بحث، وتصفية (عليهم متبقٍ، البوابة مفعّلة…).','افتح الموكل لترى رسائله ومرفقاته وقضاياه وأتعابه.','«طباعة السجل» يطبع جدول الموكلين بالأتعاب والمتبقي.'],
  tips:['التطبيق يتذكّر طريقة العرض التي اخترتها.','الدائرة الحمراء بجانب الاسم تعني رسائل غير مقروءة من الموكل.'],
  tour:[['[data-act="newClient"]','إضافة موكل جديد مع فحص تعارض المصالح.'],['.seg','التبديل بين البطاقات والسجلات.'],['#crQ','البحث في الموكلين بالاسم أو الهاتف أو رقم القضية.'],['.cr-t thead','اضغط عنوان أي عمود للفرز.']]},
 {id:'fees',g:'العمل اليومي',t:'الأتعاب والدفعات وسندات القبض',v:'clients',s:'تُسجَّل الدفعات من ملف الموكل، تبويب الأتعاب. لكل دفعة سند قبض برقم متسلسل، ويُطبع كشف الحساب بالمتبقي.',
  steps:['افتح الموكل ثم اضغط «متبقٍ من الأتعاب».','اكتب المبلغ واختر طريقة الدفع: نقداً، شيك، تحويل بنكي، بطاقة.','للشيك: رقم الشيك والبنك وتاريخ الاستحقاق. للتحويل: البنك ورقم الحوالة. للبطاقة: آخر 4 أرقام ورقم العملية.','اضغط «تسجيل»؛ إن كان «إصدار سند قبض» مفعّلاً يُفتح السند وكشف الحساب للطباعة.','«طباعة كشف الدفعات والمتبقي» يطبع كل الحركات والرصيد المستحق رقماً وكتابة.'],
  tips:['لا تُسجَّل الدفعة قبل تعبئة الحقول الإلزامية لطريقة الدفع.','اضغط رقم أي سند في جدول الدفعات لإعادة طباعته.']},
 {id:'cases',g:'العمل اليومي',t:'القضايا وملف القضية',v:'cases',s:'كل قضية لها ملف فيه الأطراف والمحكمة والمرحلة والجلسات والمهل والمستندات والأحكام وسجل ما جرى.',
  steps:['«قضية جديدة» من شاشة القضايا: اختر الموكل والمحكمة والنوع والخصم.','داخل القضية: تبويبات الجلسات والمهل والمستندات والأحكام والملاحظات.','عند تسجيل حكم تُحسب مدة الطعن تلقائياً وتُضاف مهلة بتاريخها.','زر «طباعة» يطبع ملف القضية أو جدول جلساتها.'],
  tips:['صنّف القضايا (مدني، عمالي، تجاري…) لتصفيتها بسرعة.','المساعد الذكي يقرأ سجل القضية: افتحه من داخل القضية ليعمل عليها مباشرة.'],
  tour:[[N('cases'),'شاشة القضايا.'],['[data-act="newCase"]','فتح قضية جديدة.']]},
 {id:'agenda',g:'العمل اليومي',t:'الجلسات والمهل ومدد الطعن',v:'agenda',s:'تقويم موحّد لجلسات المكتب ومهله. مدد الطعن تُحسب من قواعد قابلة للتعديل في الإعدادات.',
  steps:['أضف الجلسة من داخل القضية: التاريخ والوقت والغاية، و«يلزم حضور الموكل» إن لزم.','يمكن إبلاغ الموكل تلقائياً بموعد الجلسة عبر قناته المفضلة.','المهل القريبة تظهر في الرئيسية بلون التنبيه.','«جدول الجلسات» يُطبع لأسبوع أو شهر.'],
  tips:['راجع جدول مدد الطعن في الإعدادات وعدّله حسب ممارستك؛ كل تعديل يُسجَّل في سجل التدقيق.']},
 {id:'assistant',g:'الذكاء الاصطناعي',t:'المساعد القانوني الذكي',v:'dash',s:'يجيب ويحلّل مستنداً إلى نصوص التشريعات والأحكام فقط، ويُخفي أسماء الأطراف قبل الإرسال، ويُعلِّم ما يحتاج تحققاً.',
  steps:['افتحه من اختصارات الرئيسية أو من داخل القضية.','اختر المهمة: ملخص قبل الجلسة، الدفوع والمهل، سؤال قانوني، مراجعة عقد، تحليل مستند للخصم، ثغرات مستند، أسباب الطعن، أحكام مشابهة، رسالة للموكل، محضر اجتماع، ترجمة.','ارفع المستند (Word أو PDF أو صورة) أو أملِ بالميكروفون.','راجع الجواب: كل ملاحظة مسنودة بمرجع [R1]، وافتح المرجع لترى نصه.','احفظه في مستندات القضية، أو اطبعه، أو حوّله إلى لائحة.'],
  tips:['«أسباب الطعن» ينتهي بزرّي «صياغة لائحة استئناف» و«صياغة لائحة نقض».','لا يُرسل اسم الموكل ولا الخصوم ولا أرقام الهواتف إلى خدمة الذكاء الاصطناعي.'],
  tour:[['.as-home','اختصارات المساعد في الرئيسية؛ كل زر يفتح مهمة.']]},
 {id:'drafting',g:'الذكاء الاصطناعي',t:'الصياغة بالصوت',v:'dash',s:'أملِ الوقائع والطلبات فتُصاغ اللائحة أو المذكرة أو العقد بلغة قانونية، مع المراجع المستخدمة.',
  steps:['اختر نوع المستند: لائحة دعوى، جوابية، مذكرة، استئناف، نقض، إنذار، عقد، وكالة…','اضغط الميكروفون وتكلّم، أو اكتب.','للرد على لائحة الخصم: ارفعها فتُستخرج ادعاءاته بنداً بنداً، وأملِ ردك على كل بند.','راجع المسودة ثم احفظها في مستندات القضية أو اطبعها.'],
  tips:['المسودة تبقى مسودة: راجعها قبل تقديمها، خاصة ما ورد تحت «يحتاج تحقق».']},
 {id:'calc',g:'الذكاء الاصطناعي',t:'الحاسبات القانونية',v:'calc',s:'تعويضات حوادث الطرق (قانون التأمين 20/2005)، والحقوق العمالية (قانون العمل 7/2000)، ورسوم المحاكم، والفائدة.',
  steps:['اختر الحاسبة.','اسرد الوقائع واضغط «استخراج المعطيات» ليملأ الذكاء الاصطناعي الحقول، أو املأها بنفسك.','اضغط «احسب» لترى كل بند بمادته القانونية.','احفظ النتيجة في مستندات القضية أو حوّلها إلى لائحة.'],
  tips:['الحساب نفسه حتمي بالقواعد القانونية؛ الذكاء الاصطناعي يستخرج المعطيات فقط.','الحقول المعلّمة «تقدير» يحددها المحامي.']},
 {id:'laws',g:'البحث القانوني',t:'التشريعات والمكتبة القانونية',v:'laws',s:'نصوص التشريعات الفلسطينية مع البحث في المواد، ومكتبة النماذج والمراجع الخاصة بالمكتب.',
  steps:['ابحث باسم القانون أو بكلمة في نص المادة.','افتح التشريع لقراءة مواده، وانسخ نص المادة أو اطبعه.','المكتبة القانونية: نماذج المكتب ومراجعه.'],tips:[]},
 {id:'rulings',g:'البحث القانوني',t:'الاجتهادات القضائية (مكتبة المكتب)',v:'rulings',s:'أرشيف المكتب للأحكام والمبادئ: المبدأ ونص الحكم والمصدر، مربوطاً بالقضايا، ويعمل دون إنترنت.',
  steps:['«إضافة حكم» يدوياً، أو احفظ الأحكام من «البحث في الأحكام» و«مصادر الأحكام».','ابحث بالموضوع أو المبدأ أو رقم الحكم، وصفِّ بالمحكمة والفرع.','زر «طباعة» على الحكم يطبعه كاملاً، و«طباعة النتائج» يطبع عدة أحكام: مذكرة استشهاد، ملف أحكام، أو كشف مراجع.','«نسخ الاستشهاد» يضع صيغة الاستشهاد جاهزة للصق.'],
  tips:['عند حفظ حكم بنصه دون مبدأ، استعمل «استخراج المبدأ والملخص بالذكاء الاصطناعي» في نموذج الإضافة.'],
  tour:[[N('rulings'),'مكتبة الاجتهادات.'],['[data-act="rNew"]','إضافة حكم.'],['[data-act="rPrint"]','طباعة النتائج أو المحدد.']]},
 {id:'search',g:'البحث القانوني',t:'البحث في الأحكام (مقام)',v:'maqamsearch',s:'بحث مباشر في أحكام الموسوعة القانونية لجامعة النجاح، وحفظ النتائج في مكتبة المكتب.',
  steps:['اكتب الموضوع (مثل: إخلاء المأجور)، أو السنة ورقم القضية.','اضغط اسم المحكمة أو التصنيف في أي نتيجة لحصر البحث.','«عرض النص الكامل» لقراءة الحكم، و«استيراد للمكتبة» لحفظه.','«حفظ في المكتبة» أعلى النتائج يحفظ صفحة كاملة بنصوصها.'],tips:[]},
 {id:'sources',g:'البحث القانوني',t:'مصادر الأحكام: المكتب الفني والمقتفي',v:'sources',s:'مبادئ المكتب الفني في مجلس القضاء الأعلى (عامة)، وأحكام المقتفي في جامعة بيرزيت (باشتراك المكتب).',
  steps:['المصدر الأول (المكتب الفني): اختر القانون (التجاري، العمل، التأمين…) أو اكتب كلمة، ثم «حفظ في المكتبة» فيُرفق ملف الحكم PDF.','المصدر الثاني (المقتفي): يضبط مدير المكتب الاشتراك مرة واحدة من الإعدادات.','ابحث بعبارة وحدّد المحكمة والمجال وتاريخ الفصل؛ المقتفي يعرض أول 30 نتيجة فضيّق البحث.','«البطاقة والنص الكامل» يعرض المبادئ والنصوص المطبّقة والكشاف والتسبيب، و«طباعة» يطبعه.'],
  tips:['بعض الأحكام القديمة في المقتفي نصّها محمي؛ تُحفظ بطاقتها ومبادئها ويُقرأ النص في الموقع.'],
  tour:[[N('sources'),'شاشة مصادر الأحكام.'],['.src-tabs','«المصدر الأول» هو مبادئ المكتب الفني، و«المصدر الثاني» هو المقتفي.']]},
 {id:'docs',g:'المستندات',t:'المستندات والعقود والنماذج',v:'tpls',s:'مستندات كل قضية في مكان واحد، ونماذج المكتب تُملأ من بيانات القضية تلقائياً.',
  steps:['اختر النموذج والقضية فتُملأ الأسماء والأرقام والتواريخ.','عدّل النص ثم اطبعه أو احفظه في مستندات القضية.','شارك أي مستند مع الموكل في البوابة بمفتاح «في بوابة الموكل».'],tips:[]},
 {id:'portal',g:'الموكل',t:'بوابة الموكل والتطبيق',v:'portal',s:'يتابع الموكل قضاياه وجلساته والمستندات المشتركة، ويراسل المكتب نصاً وصوتاً، من هاتفه.',
  steps:['فعّل البوابة من ملف الموكل؛ يُرسل رمز الدخول عبر قناته المفضلة.','راسل الموكل من شاشة البوابة، وتظهر رسائله الجديدة في الرئيسية.','المستند يظهر للموكل فقط بعد مشاركته.'],
  tips:['جدّد رموز الدخول الضعيفة من الإعدادات قبل استعمال البوابة مع موكلين حقيقيين.']},
 {id:'finance',g:'الإدارة',t:'المالية والتقارير',v:'finance',s:'الأتعاب والمحصّل والمتبقي على مستوى المكتب، والفواتير، والتقارير.',steps:['راجع المتبقي على الموكلين من «سجلات الموكلين» مصفّاة بـ«عليهم أتعاب متبقية».','التقارير تُطبع بترويسة المكتب.'],tips:[]},
 {id:'mizan',g:'الموكل',t:'ميزان: حساب المحامي وحساب الموكل',v:'mizan',s:'تظهر القضية في حساب المحامي على ميزان بعد إدراج وكالته على الملف، وتظهر في حساب الموكل (برقم هويته) بمجرد إدراجه طرفاً. ميثاق يربط الحسابين بملفات المكتب.',
  steps:['حساب المحامي: من شاشة «الربط مع ميزان» يحفظ مدير المكتب رقم العضوية وكلمة المرور على جهاز المكتب ويجرّب الدخول.','في حقيبة الموكل، تبويب «ميزان»: سجّل رقم هوية الموكل وهاتفه كما في ميزان.','لكل قضية: رقمها في ميزان، وصفة الموكل فيها، وحالة وكالة المحامي (قُدّمت للقلم، أُدرجت).','حساب الموكل (اختياري): بموافقته الموثّقة، يُحفظ مشفّراً على جهاز المكتب، ويفيد قبل إدراج الوكالة.','التحديثات المقروءة من ميزان تُعرض للمراجعة، ولا يُضاف شيء لملف القضية دون اعتماد المحامي.'],
  tips:['بعد تقديم صك الوكالة للقلم غيّر الحالة إلى «قُدّمت»، وبعد ظهور القضية في حسابك اجعلها «أُدرجت».','كلمات المرور لا تُعرض بعد حفظها، وكل دخول يُسجَّل في سجل التدقيق.']},
 {id:'settings',g:'الإدارة',t:'الإعدادات والمستخدمون والأمان',v:'settings',s:'بيانات المكتب، ومدد الطعن، والنسخ الاحتياطي، واشتراكات المصادر، ومفتاح الذكاء الاصطناعي واستهلاكه، والمستخدمون والصلاحيات.',
  steps:['«المستخدمون والصلاحيات»: أضف مستخدماً بدور مدير أو محامٍ أو سكرتاريا.','«اشتراكات المصادر والخدمات الخارجية»: اشتراك المقتفي ومفتاح الذكاء الاصطناعي، واستهلاك الشهر لكل محامٍ.','«النسخ الاحتياطي»: نسخة يومية تلقائية، و«نسخ احتياطي الآن» عند الحاجة.','«سجل التدقيق»: كل عملية مسجّلة بتوقيع لا يُعدَّل.'],
  tips:['ضع سقفاً شهرياً للإنفاق في لوحة Anthropic بالإضافة إلى متابعة الاستهلاك هنا.'],
  tour:[[N('settings'),'شاشة الإعدادات (لمدير المكتب).'],['#srcSetPanel','الاشتراكات ومفتاح الذكاء الاصطناعي واستهلاك الشهر.']]},
];
const VIEW2T={dash:'start',clients:'clients',client:'fees',cases:'cases',case:'cases',agenda:'agenda',calc:'calc',laws:'laws',lawlib:'laws',rulings:'rulings',maqamsearch:'search',sources:'sources',docs:'docs',tpls:'docs',portal:'portal',finance:'finance',reports:'finance',mizan:'mizan',settings:'settings',users:'settings',audit:'settings'};
const G={open:false,t:'start',q:'',ans:null,busy:false,err:'',aiOk:null};

/* نص الدليل كاملاً (يُرسل مع السؤال الحر ليجيب منه فقط) */
const guideText=()=>T.map(x=>`## ${x.t}\n${x.s}\n${x.steps.map((s,i)=>(i+1)+'. '+s).join('\n')}${x.tips.length?'\nنصائح: '+x.tips.join(' · '):''}`).join('\n\n');

function body(){
 const x=T.find(z=>z.id===G.t)||T[0],groups=[...new Set(T.map(z=>z.g))];
 return `<div class="gd-head"><div><b>دليل ميثاق</b><small>تعلّم التطبيق خطوة بخطوة</small></div><button class="btn sm" data-act="gdClose" aria-label="إغلاق الدليل">إغلاق</button></div>
 ${G.aiOk?`<form class="gd-ask" id="gdAsk"><input class="field" id="gdQ" value="${e(G.q)}" placeholder="اسأل عن التطبيق: كيف أسجّل دفعة بشيك؟" aria-label="سؤال عن التطبيق"><button class="btn pri sm" ${G.busy?'disabled':''}>${G.busy?'…':'اسأل'}</button></form>`:''}
 ${G.err?`<div class="gd-err">${e(G.err)}</div>`:''}
 ${G.ans?`<div class="gd-ans">${G.ans.map(s=>`${s.heading?`<b>${e(s.heading)}</b>`:''}<ul>${s.items.map(i=>`<li>${e(i)}</li>`).join('')}</ul>`).join('')}<button class="link" data-act="gdAnsX">إخفاء الجواب</button></div>`:''}
 <div class="gd-cols"><nav class="gd-toc" aria-label="مواضيع الدليل">${groups.map(g=>`<div class="gd-g">${e(g)}</div>${T.filter(z=>z.g===g).map(z=>`<button class="${z.id===x.id?'on':''}" data-act="gdTopic" data-v="${z.id}">${e(z.t)}</button>`).join('')}`).join('')}</nav>
 <article class="gd-art"><h2>${e(x.t)}</h2><p class="gd-s">${e(x.s)}</p>
  <div class="gd-acts">${x.v?`<button class="btn sm" data-act="gdGo" data-v="${x.v}">اذهب إلى الشاشة</button>`:''}${x.tour&&x.tour.length?`<button class="btn pri sm" data-act="gdTour" data-v="${x.id}">أرني على الشاشة</button>`:''}</div>
  <h3>الخطوات</h3><ol class="gd-steps">${x.steps.map(s=>`<li>${e(s)}</li>`).join('')}</ol>
  ${x.tips.length?`<h3>نصائح</h3><ul class="gd-tips">${x.tips.map(s=>`<li>${e(s)}</li>`).join('')}</ul>`:''}</article></div>`;
}
function draw(){let el=document.getElementById('gdPanel');if(!G.open){if(el)el.remove();return}
 if(!el){el=document.createElement('aside');el.id='gdPanel';el.className='gd';el.setAttribute('role','dialog');el.setAttribute('aria-label','دليل ميثاق');document.body.appendChild(el)}
 el.innerHTML=body()}
async function aiCheck(){if(G.aiOk!==null)return;G.aiOk=false;try{const r=await fetch('/api/admin/ai/status');if(r.ok){const j=await r.json();G.aiOk=!!j.configured}}catch(x){}draw()}
A.gdOpen=v=>{G.open=true;G.t=v&&T.some(z=>z.id===v)?v:(VIEW2T[S.view]||'start');G.ans=null;G.err='';draw();aiCheck()};
A.gdClose=()=>{G.open=false;tourEnd();draw()};
A.gdTopic=v=>{G.t=v;G.ans=null;draw();const a=document.querySelector('.gd-art');if(a)a.scrollTop=0};
A.gdGo=v=>{tourEnd();if(v==='client'&&S.clientId){S.view='client'}else S.view=v;render()};
A.gdAnsX=()=>{G.ans=null;draw()};
document.addEventListener('submit',async ev=>{if(ev.target.id!=='gdAsk')return;ev.preventDefault();const q=(document.getElementById('gdQ').value||'').trim();G.q=q;if(q.length<5){G.err='اكتب سؤالك بوضوح';return draw()}
 G.busy=true;G.err='';G.ans=null;draw();
 try{const r=await fetch('/api/admin/ai/assist',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode:'howto',question:q,text:guideText(),web:false})});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'تعذّر الجواب');G.ans=j.sections||[]}
 catch(x){G.err=x.message}G.busy=false;draw()});

/* ── الجولة المرئية ── */
let TR=null;
function tourEnd(){TR=null;const o=document.getElementById('gdTour');if(o)o.remove()}
function tourShow(){const o=document.getElementById('gdTour')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'gdTour',className:'gd-tour'}));
 while(TR&&TR.i<TR.steps.length&&!document.querySelector(TR.steps[TR.i][0]))TR.i++;
 if(!TR||TR.i>=TR.steps.length){tourEnd();toast('انتهت الجولة');return}
 const [sel,txt]=TR.steps[TR.i],el=document.querySelector(sel);el.scrollIntoView({block:'center',behavior:'smooth'});
 setTimeout(()=>{if(!TR)return;const r=el.getBoundingClientRect(),pad=6,W=innerWidth,H=innerHeight,bw=Math.min(320,W-24);
  let top=r.bottom+12;if(top+150>H)top=Math.max(12,r.top-162);let left=Math.min(Math.max(12,r.left+r.width/2-bw/2),W-bw-12);
  o.innerHTML=`<div class="gd-spot" style="top:${r.top-pad}px;left:${r.left-pad}px;width:${r.width+pad*2}px;height:${r.height+pad*2}px"></div>
  <div class="gd-tip" role="dialog" aria-live="polite" style="top:${top}px;left:${left}px;width:${bw}px"><div class="m">${TR.i+1} من ${TR.steps.length}</div><p>${e(txt)}</p>
  <div class="gd-tipb"><button class="btn sm" data-act="gdTourX">إنهاء</button>${TR.i>0?'<button class="btn sm" data-act="gdTourP">السابق</button>':''}<button class="btn pri sm" data-act="gdTourN">${TR.i+1<TR.steps.length?'التالي':'تم'}</button></div></div>`},260)}
A.gdTour=v=>{const x=T.find(z=>z.id===v);if(!x||!x.tour)return;if(x.v&&S.view!==x.v&&!(x.v==='clients'&&S.view==='client')){S.view=x.v;render()}
 G.open=false;draw();TR={steps:x.tour,i:0};setTimeout(tourShow,350)};
A.gdTourN=()=>{if(!TR)return;TR.i++;tourShow()};A.gdTourP=()=>{if(!TR)return;TR.i=Math.max(0,TR.i-1);tourShow()};A.gdTourX=()=>{tourEnd()};
addEventListener('resize',()=>{if(TR)tourShow()});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'){if(TR)tourEnd();else if(G.open){G.open=false;draw()}}else if(TR&&(ev.key==='ArrowLeft'))A.gdTourN();else if(TR&&ev.key==='ArrowRight')A.gdTourP()});

/* زر «؟» في الشريط العلوي، وموضوع «دليل الاستخدام» في القائمة */
function inject(){const host=document.getElementById('topIcons')||document.querySelector('.top .who');if(host&&!document.getElementById('tbHelp'))host.insertAdjacentHTML('afterbegin',`<button class="ib" id="tbHelp" data-act="gdOpen" title="دليل الاستخدام (F1)" aria-label="دليل الاستخدام"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg></button>`)}
const r0=render;render=function(){r0();try{inject()}catch(x){}if(TR)tourEnd()};
document.addEventListener('keydown',ev=>{if(ev.key==='F1'){ev.preventDefault();G.open?A.gdClose():A.gdOpen()}});
window.MQ_guide={topics:T,text:guideText};

const css=document.createElement('style');css.textContent=`
.gd{position:fixed;top:calc(12px + env(safe-area-inset-top,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));left:calc(12px + env(safe-area-inset-left,0px));width:min(560px,calc(100vw - 24px));background:var(--panel,#fff);color:var(--ink);border:1px solid var(--line);border-radius:18px;box-shadow:0 18px 48px rgba(11,27,43,.22);z-index:60;display:flex;flex-direction:column;overflow:hidden;direction:rtl}
.gd-head{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--line)}.gd-head b{font-size:18px;display:block}.gd-head small{color:var(--muted)}
.gd-ask{display:flex;gap:8px;padding:10px 18px;border-bottom:1px solid var(--line)}.gd-ask .field{flex:1;min-width:0}
.gd-err{margin:8px 18px 0;color:var(--danger,#B42318);font-size:14px}
.gd-ans{margin:10px 18px 0;padding:10px 14px;border:1px solid var(--brass);border-radius:12px;background:var(--brass-soft,#F3E8D3);font-size:14.5px;line-height:1.8;max-height:34vh;overflow:auto}.gd-ans ul{margin:4px 0 8px;padding-inline-start:18px}
.gd-cols{display:grid;grid-template-columns:170px minmax(0,1fr);flex:1;min-height:0}
.gd-toc{border-inline-end:1px solid var(--line);overflow:auto;padding:8px 6px;display:flex;flex-direction:column;gap:2px}
.gd-toc .gd-g{font-size:12px;color:var(--brass);font-weight:700;padding:8px 8px 2px}
.gd-toc button{all:unset;cursor:pointer;padding:6px 8px;border-radius:8px;font-size:13.5px;line-height:1.5}.gd-toc button:hover{background:var(--sunk)}.gd-toc button.on{background:var(--accent-soft,#efe6d3);font-weight:600}.gd-toc button:focus-visible{outline:2px solid var(--brass)}
.gd-art{overflow:auto;padding:14px 18px 22px}.gd-art h2{margin:0 0 6px;font-size:20px}.gd-art h3{margin:14px 0 6px;font-size:15px;color:var(--brass)}
.gd-s{color:var(--muted);line-height:1.8;margin:0}.gd-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.gd-steps,.gd-tips{margin:0;padding-inline-start:20px;line-height:1.9;font-size:14.5px}.gd-steps li{margin-bottom:4px}
@media(max-width:640px){.gd-cols{grid-template-columns:1fr}.gd-toc{flex-direction:row;flex-wrap:nowrap;overflow-x:auto;border-inline-end:0;border-bottom:1px solid var(--line)}.gd-toc .gd-g{display:none}.gd-toc button{white-space:nowrap}}
.gd-tour{position:fixed;inset:0;z-index:70;pointer-events:none}
.gd-spot{position:fixed;border-radius:12px;box-shadow:0 0 0 9999px rgba(11,27,43,.55);outline:2px solid #D4AF37;transition:all .25s}
.gd-tip{position:fixed;pointer-events:auto;background:var(--panel,#fff);color:var(--ink);border:1px solid var(--brass);border-radius:14px;padding:12px 14px;box-shadow:0 14px 34px rgba(0,0,0,.25);direction:rtl}
.gd-tip p{margin:4px 0 10px;line-height:1.8;font-size:15px}.gd-tipb{display:flex;gap:6px;justify-content:flex-end}
@media(prefers-reduced-motion:reduce){.gd-spot{transition:none}}
`;document.head.appendChild(css);
})();
