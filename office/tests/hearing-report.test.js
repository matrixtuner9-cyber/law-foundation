const test=require('node:test'),assert=require('node:assert');
const R=require('../hearing-report.js');
test('نص الموكل: تأجيل وجلسة قادمة ومطلوب، بلا ملاحظة داخلية',()=>{const t=R.clientText({no:'5/2026'},{date:'2026-10-20'},{kind:'adj',reason:'لعدم تبليغ الخصم',summary:'',next:{date:'2026-11-10',time:'10:00',purpose:'سماع الشهود',attend:true},asks:'إحضار الشاهد',asksDue:'2026-11-05',internal:'سرّي',by:'سعد'});
 assert.match(t,/أُجّلت الجلسة لعدم تبليغ الخصم/);assert.match(t,/2026-11-10 الساعة 10:00 — سماع الشهود \(حضوركم شخصياً مطلوب\)/);assert.match(t,/المطلوب منكم قبل 2026-11-05: إحضار الشاهد/);assert.doesNotMatch(t,/سرّي/)});
test('طلب شاهد بلا جلسة قادمة',()=>{const t=R.clientText({no:'1'},{date:'2026-10-20'},{kind:'wreq',summary:'طلب القاضي شاهد المدعي'});assert.match(t,/طلبت المحكمة تقديم شاهد/);assert.match(t,/طلب القاضي شاهد المدعي/)});
