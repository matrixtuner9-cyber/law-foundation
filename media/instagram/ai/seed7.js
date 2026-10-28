const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/tmp/igdata/mithaq.db');
const at='2026-10-27T11:20:00', by='demo', byName='المحامي سامر الخطيب';
const L1={id:'pl-evid',ref:'M1',title:'قانون البينات في المواد المدنية والتجارية رقم (4) لسنة 2001',source:'فلسطين · تشريعات',primary:true};
const L2={id:'pl-proc',ref:'M2',title:'قانون أصول المحاكمات المدنية والتجارية رقم (2) لسنة 2001',source:'فلسطين · تشريعات',primary:true};
const L3={id:'pl-majalla',ref:'M3',title:'مجلة الأحكام العدلية',source:'فلسطين · تشريعات',primary:true};
const DC={tag:'D1.1',title:'لائحة الدعوى المقدّمة من المدعي'}, DT={tag:'D2.1',title:'محضر تسليم الأرض'};
const rb={id:'frb1',task:'rebut',kind:'rebuttal',status:'proposed',at,by,byName,docTitle:'لائحة دعوى فسخ عقد البيع',
 title:'الرد على لائحة دعوى فسخ عقد البيع',summary:'5 بنود ومطلبان — دفع شكلي واحد',
 formal:[{defense:'الدفع بانتفاء الخصومة',strength:'قوي',basis:'الدعوى مقامة على رئيس الجمعية بصفته الشخصية، والبائع هو الجمعية بشخصيتها الاعتبارية.',law:[L2]}],
 points:[
  {n:1,claim:'أبرم الطرفان عقد بيع قطعة الأرض بتاريخ 10/5/2023.',position:'تسليم',reply:'مسلَّم بإبرام العقد وتاريخه، مع التمسك بشروطه كما وردت فيه.',law:[],evidence:[DC]},
  {n:2,claim:'لم تسلّم المدعى عليها الأرض للمدعي.',position:'إنكار',reply:'منكر؛ جرى التسليم بموجب محضر تسليم موقّع من المدعي، ويقع عليه عبء إثبات ما يدّعيه.',law:[L1],evidence:[DT],needed:'أصل محضر التسليم'},
  {n:3,claim:'دفع المدعي كامل الثمن.',position:'تسليم جزئي',reply:'يُسلَّم بدفع جزء من الثمن فقط، والباقي لم يُدفع حتى تاريخه.',law:[L1],evidence:[],needed:'كشف الدفعات وإيصالاتها'},
  {n:4,claim:'أخلّت المدعى عليها بالتزاماتها فيحق له فسخ العقد.',position:'إنكار',reply:'لا إخلال من المدعى عليها، والتأخر في سداد باقي الثمن من جهة المدعي.',law:[L3],evidence:[]},
  {n:5,claim:'لحق بالمدعي ضرر جسيم.',position:'غير منتج',reply:'ادعاء عام لا يبيّن الضرر ولا يقدّم عليه بينة.',law:[],evidence:[]}],
 requests:[{request:'فسخ العقد وإعادة الثمن',reply:'رد الطلب لعدم تحقق سبب الفسخ، واحتياطاً لا يُعاد إلا ما ثبت دفعه.',law:[L3]},{request:'تضمين المدعى عليها الرسوم وأتعاب المحاماة',reply:'رد الطلب تبعاً لرد الدعوى، وتضمين المدعي الرسوم والأتعاب.',law:[L2]}],
 notes:['تحقق من تاريخ تبليغ اللائحة لاحتساب مهلة تقديم الجواب.','أرفق أصل محضر التسليم بقائمة البينات.']};
const put=(k,v)=>d.prepare('insert or replace into kv(key,value) values(?,?)').run(k,JSON.stringify(v));
put('mbc:k7',{enabled:true,enabledBy:byName,enabledAt:'2026-10-20T10:00:00',findings:[rb],sends:[],snap:null,snapAt:''});
console.log('ok');
