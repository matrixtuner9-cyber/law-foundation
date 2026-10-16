/* ── الشاشة الرئيسية ── تُحمَّل بعد app.js وتستبدل لوحة المكتب بتصميم «ميثاق» الجديد */
(function(){
const pad=n=>String(n).padStart(2,'0');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const hDT=h=>{const d=pd(h.date);const [hh,mm]=h.time.split(':').map(Number);d.setHours(hh,mm,0,0);return d};
const nextHearing=()=>hearings.map(h=>({h,t:hDT(h)})).filter(x=>x.t>new Date()).sort((a,b)=>a.t-b.t)[0];
const greet=()=>{const h=new Date().getHours();return h<12?'صباح الخير':h<17?'نهارك سعيد':'مساء الخير'};
const firstName=()=>window.MQ&&MQ.user?MQ.user.name.replace(/^(المحامي|المحامية|الأستاذ|الأستاذة)\s+/,'').split(' ')[0]:'أستاذ';
const hijri=n=>{try{return new Intl.DateTimeFormat('ar-u-ca-islamic-umalqura-nu-latn',{day:'numeric',month:'long',year:'numeric'}).format(n)}catch(e){return ''}};
const MONTHS=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const stampNow=()=>{const n=new Date();return iso(n)+' '+pad(n.getHours())+':'+pad(n.getMinutes())};
function ago(at){const m=Math.round((Date.now()-new Date(at.replace(' ','T')))/6e4);
 if(m<1)return 'الآن';
 if(m<60)return 'قبل '+(m===1?'دقيقة':m===2?'دقيقتين':m<=10?m+' دقائق':m+' دقيقة');
 const h=Math.round(m/60);if(h<24)return 'قبل '+(h===1?'ساعة':h===2?'ساعتين':h<=10?h+' ساعات':h+' ساعة');
 return dmy(at.slice(0,10))+' · '+at.slice(11)}
const initials=s=>String(s||'').replace(/^(المحامي|المحامية|الأستاذ|الأستاذة|شركة|جمعية|مؤسسة)\s+/,'').trim()[0]||'م';
const money=n=>Number(n||0).toLocaleString('en-US');

/* الأيقونات (خطية، تُلوَّن بـ currentColor) */
const I={
 bell:'<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2zM10 20a2 2 0 0 0 4 0"/></svg>',
 mail:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
 cal:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
 search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
 sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
 moon:'<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
 scales:'<svg viewBox="0 0 24 24"><path d="M12 3v17M7 20h10M4 7h16M6 7l-3 6a3 3 0 0 0 6 0L6 7zm12 0l-3 6a3 3 0 0 0 6 0l-3-6z"/></svg>',
 doc:'<svg viewBox="0 0 24 24"><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
 phone:'<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
 clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 pin:'<svg viewBox="0 0 24 24"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
 check:'<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 7"/></svg>',
 arrow:'<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
 plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
 task:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/></svg>',
 gavel:'<svg viewBox="0 0 24 24"><path d="m13 5 6 6M9 9l6 6M3 21l8-8M15 3l-6 6M18 10l-3-3"/></svg>',
 review:'<svg viewBox="0 0 24 24"><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 14l2 2 4-4"/></svg>',
 msg:'<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/></svg>',
 pay:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/></svg>',
 mz:'<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M18 4v4h-4M6 20v-4h4"/></svg>',
 portal:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
 file:'<svg viewBox="0 0 24 24"><path d="M21 12.5 12 21.5a5 5 0 0 1-7-7l9-9a3 3 0 0 1 4.5 4.5L10 18.5a1.5 1.5 0 0 1-2-2l8-8"/></svg>',
 voice:'<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
 image:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m3 17 5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1.5"/></svg>',
 users2:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M14 19a4 4 0 0 1 7 0"/></svg>',
 dots:'<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',
 chev:'<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
 money:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9h.01M18 15h.01"/></svg>',
 chart:'<svg viewBox="0 0 24 24"><path d="M4 20h16M7 16v-5M12 16V6M17 16v-8"/></svg>',
 bellq:'<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2zM10 20a2 2 0 0 0 4 0"/></svg>',
 wa:'<svg viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8.5 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-2-1-1 .8a4 4 0 0 1-2.1-2.1l.8-1-1-2z"/></svg>',
 building:'<svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6M9 12h2M13 12h2"/></svg>'
};

/* ── الشريط العلوي: المستخدم، التنبيهات، البحث، التاريخ، الوضع الليلي ── */
const DEMO_AV='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCABgAGADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6zleS8l8mH7nc1oWtvHbJtXr3pbWBbaLYvX1pszlcms4wtqypS6ErNk4HU1zk3irR21GTTLC8ivNQjOHhRhla5j4/+N5/A3wzu9XtYnkuZkZIyo5Q461+enhn4k+ItA8SXPiW21C4a9uHLOCx9abTa0BNJn6R3+rajK2z7Cy+2aqwm+kb5rRq+H4/2l/GqtukZ2Pua19N/at8VWxHmW4f6msfZSNeeK2PteK2ucc27VBqlze6NYvqENjJPDGMyRr1Ir5Mg/bE15Fw2mI1Sf8ADY2ulyDoyPEylWUjjmq9mTzn1R4Q8XaB4pjd9Euo47qM4ltGI3qa6e0vpEOHXjuPSvzPtPinqVl8T08W6O8lis0oM1ujfKQTzxX3/wCD/E8ev+FbHWx8jTxgup9cVLi46lJqSO6ubaK7TzIzhx0qraXLxyGCcYYdDUGn3oBBVuDV6+gW7hEkfEgpb6oW2jNJiMVVncAHNPlkwKy7642qa1cyFEx/GdvpWraNNp2rQpNasuMMM4r598dfC74V+F9Bn8QahCBFnKp617D4svWNu8KnJfivn/8AbAvM6DpOhwjLyoCyg9ayctTenC72IfBHhL4UeMbQzW9g0XOATW5/wpP4byuViQFwfu14z4e+IEfg7RrbSU04JcLglsda9l+FXj3S/FKfZ4YAuoZ5FebWniINyXwn0NLDYWdo2940YPgV8PIlHmwcmua+JPgf4aeBIbe7utOM9tIQHIHSvTPGXjbw14Nsj/bEifbSvEZNeWfFTxfYeOfAck+nWSTJHw4HainWq6SexEsJRd4panb+Gvgr8I/F3hyDxLoceVVQ5QHvXR6NMmnIumWo2W8HyovtUP7HthDH4HUIg8tzhoyelavjSzTT/EriJdqMc4r0JTbSPFcIwk4nR6PfsduWrstJutwHNeaaNKSRXbaLIcAVEXqZyRv3cmFrn9UudqkZrUv3wDmuZ1eTKtVNijE5fV7gSavaoem/kV8ufGPxA2vfHCKwJ3Q2Z27fpX0jfSn/AISSwQ9Gkwa8A/aU8MWvgr4xWOrxPlL7Dv7ZokvcbN8O17aK8wv/AAtYa3dx3U9uqKgxnFa3gfRLPwr4sgubNeZGB4q9YalYGCOWWZFttoYkmuS1n4kaUPHVja2pT7HG4DyZrx4+0qJxWx9XU9hTmpO1z2P4mfCXTPHki6nc3TLdFBtXPFV/AvwvtvCvgfVbK4ImMmSM9q7KHxj4K8i2dNYi3ugGN461o65eW9t4HvtT80PA4IV/XNRzVLKF9DFuC9+xwfwc1O68PPb29qx8iS4KkfjXo/xVixqVpOBjzVBNef8Awj0yfVGt5o0JjWbdn8a9P+MUXlrYED7i4r2acJRhqeDj6kJVfcMLR1+Za7fRF4H0rhtEfJX6Cu60M8D6U0tTikXdReua1U/Ka3r9+awNRZSCByadtQucJfEnxNZ/7Ema8u/b706bfo2qRqxRYxlvQ16vbgTeLol6hWqj+1fp9rqHhSKG4UNFtA3f3TW7tGFyYXlUUUfF9jqt/qtlb6Wly0ZfC9a3/C/gexXUNnia4MNvu4kJ61x+u6VeeH71MFhGTmOVa2vD3jNre7iTX4heWakHJ5Ncc4ycb0tmepTqxUuWvuj1/wAYfBW2HhRfEHh3VpTaKAVJkqTU/iBcap4K0vwBYOzygATOO+K4fx58XNR8RWNt4Z8LQvbWRwqRRdWP0rvPhr4IXQLS1v8AVh/xM5l3BG6isKUJ6Ot8joq14NNUtT6j+A2lQ2HhWCPYDIqDcfepPjXxbWzVY+D0p/sNg3XFV/jarHTbeQDgV6lR3geE7+0OS0J+U+grvdCfAH0rzbRJsBDnsK73w/NkDPpXMnqWzbOn3F04LHy09TWN4tudL0jTZIYiJblv4h2rR8V3N5bTCMOUjI4xXEanGLhX38se5rtp0Va7OaVRt2MDwg7SeKxI/PzZrZ+KljHqdpLp1x80UoyPY1k+E4Wj8V7SOhrtfEFiLq6w4ypHWrcLqwKVpJnyZr3hU22dN1i3MlszERy46Vi2PwQk1qcrol4kuTwnXFfWN94Nt9Rt/s93EHjP3WI6VN4K+Htp4XmlvLOdi7ngeleTLA4inO9KWh7Mcww9SFq0dUcR8Bf2c9H8JahFrfiLy72/T5o4gOFP0rovjL8PtSbVl8R6Sd20f6leg/CvX/DFi8ULXFy2+Vj1PapvEsbNpzlDj1rsjhlpzO7PPeKkpNx0RwHwPe9j0h49RQxzehrW+MeP+EaDkZ21L4YXF0QR3robyxttTge0vEDxH17VvVpcvuowjV5nzM8I0OUGFGU5rufD83I57Ua38OpbORrnSH3xdSh7VFolvcxTeTJEyuPauFxcXqdF1JaHf6hDFremMVx5q9K85v4JYbho3UhlOK74CSzn86HoPvLTdW0u31uD7RagLOOo9a7KNbozmnT6o878O2oPiYNjk16FPZq0o3CuU0e0e28UrFKAGB7V6BcRgS103MmUre1UKF28VZaKNI8bakUbVye1Y3jPxXovg+xju9ckdI5WCrtHc0nq7IPU6WyKiACm6nGJLGRfaq2kXtvf6bDf2jE28wDIT1watyfNbuPas9mUcnoabNRI966aIbbn61z2nDbqpHq1dHgm7XHQVrW3Iplkpg5H5dqy9WW0jYN5a+ee4FWtQvlt1KLzIelZcMUk8pllOSa4qs+iOmEerP/Z';
const GREET=()=>{const b=document.querySelector('.me .me-t b');if(b&&!b.dataset.g){b.dataset.g=1;b.textContent='أهلاً '+b.textContent;
  if(window.MQ_DEMO||(MQ.user&&MQ.user.username==='demo')){const a=document.querySelector('.me .avatar');if(a){a.style.backgroundImage='url('+DEMO_AV+')';a.textContent=''}}}};
const unreadN=()=>Object.values(messages).flat().filter(m=>m.unread).length;
function topBar(){
 const top=document.querySelector('.top');if(!top||document.getElementById('topIcons'))return;
 const search=top.querySelector('.search'),who=top.querySelector('.who');
 const inp=search&&search.querySelector('input');if(inp)inp.placeholder='البحث في الملفات أو العملاء أو المستندات ...';
 if(search&&!search.querySelector('.kbd'))search.insertAdjacentHTML('beforeend','<kbd class="kbd">Ctrl + K</kbd>');
 if(search&&!search.querySelector('.s-ico'))search.insertAdjacentHTML('afterbegin',`<span class="s-ico">${I.search}</span>`);
 const icons=document.createElement('div');icons.className='top-icons';icons.id='topIcons';
 icons.innerHTML=`<button class="tico" data-act="nav" data-v="portal" title="الرسائل الجديدة">${I.bell}<span class="tb" id="tbBell"></span></button>
  <button class="tico" data-act="nav" data-v="portal" title="بوابة الموكل">${I.mail}</button>
  <button class="tico" data-act="nav" data-v="agenda" title="المواعيد والجلسات">${I.cal}</button>`;
 const date=document.createElement('div');date.className='top-date';date.id="topDate";
 const theme=document.createElement('button');theme.className='tico theme';theme.id='themeBtn';theme.title='الوضع الليلي';theme.setAttribute('data-act','theme');
 /* الترتيب (من اليمين): المستخدم ثم الأيقونات ثم البحث ثم التاريخ وزر الوضع */
 top.append(who,icons,search,date,theme);
 who.classList.add('first');
 drawDate();drawTheme();
}
function drawDate(){const el=document.getElementById('topDate');if(!el)return;const n=new Date();
 el.innerHTML=`<b>${DAYS[n.getDay()]} ${n.getDate()} ${MONTHS[n.getMonth()]} ${n.getFullYear()}</b><small>${hijri(n)}</small>`}
const night=()=>document.documentElement.classList.contains('night');
function userChevron(){const me=document.getElementById('meBtn');if(me&&!me.querySelector('.chev'))me.insertAdjacentHTML('beforeend',`<span class="chev">${I.chev}</span>`)}
function drawTheme(){userChevron();const b=document.getElementById('themeBtn');if(b)b.innerHTML=night()?I.moon:I.sun;
 const bell=document.getElementById('tbBell');if(bell){const n=unreadN();bell.textContent=n||'';bell.hidden=!n}}
A.theme=()=>{document.documentElement.classList.toggle('night');try{localStorage.setItem('mq_theme',night()?'night':'day')}catch(e){}drawTheme()};
try{if(localStorage.getItem('mq_theme')==='night')document.documentElement.classList.add('night')}catch(e){}
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();const q=document.getElementById('gq');if(q){q.focus();q.select()}}});

/* ── الأيقونات في القائمة الجانبية ── */
const NAV_ICON={dash:'<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-6h4v6"/></svg>',
 cases:'<svg viewBox="0 0 24 24"><path d="M3 7h6l2 2h10v11H3z"/></svg>',clients:I.portal,agenda:I.cal,docs:I.doc,
 tpls:'<svg viewBox="0 0 24 24"><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
 opps:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M14 19a4 4 0 0 1 7 0"/></svg>',
 courts:I.building,portal:I.msg,mizan:I.mz,finance:I.money,tasks:I.task,reports:I.chart,bar:I.users2,
 users:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/><path d="M19 8h3M20.5 6.5v3"/></svg>',
 audit:'<svg viewBox="0 0 24 24"><path d="M6 3h8l5 5v13H6z"/><path d="M9 13h6M9 17h6M9 9h2"/></svg>',
 settings:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
 out:'<svg viewBox="0 0 24 24"><path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9"/></svg>',
 help:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/></svg>'};
window.NAV_ICON=NAV_ICON;
const baseNav=drawNav;
window.drawNav=function(){baseNav();
 const nav=document.getElementById('nav');
 nav.querySelectorAll('button[data-v]').forEach(b=>{if(!b.querySelector('svg'))b.insertAdjacentHTML('afterbegin',`<span class="nico">${NAV_ICON[b.dataset.v]||I.doc}</span>`);
  const c=b.querySelector('.cnt');if(c&&!c.textContent.trim())c.remove()});
 /* الإعدادات والمساعدة في أسفل القائمة */
 const st=nav.querySelector('button[data-v="settings"]');
 let foot=document.getElementById('navFoot');if(!foot){foot=document.createElement('div');foot.id='navFoot';foot.className='nav-foot';nav.after(foot)}
 foot.innerHTML='';if(st){st.classList.add('low');foot.append(st)}
 foot.insertAdjacentHTML('beforeend',`<button data-act="help" class="low"><span class="nico">${NAV_ICON.help}</span>المساعدة</button><button data-act="logout" class="low out"><span class="nico">${NAV_ICON.out}</span>تسجيل الخروج</button>`);
 const bell=document.getElementById('tbBell');if(bell){const n=unreadN();bell.textContent=n||'';bell.hidden=!n}
};
function brand(){const b=document.querySelector('.brand');if(!b)return;const nm=b.querySelector('b'),sm=b.querySelector('small');if(nm)nm.textContent=OFFICE.name.replace(/\s+للمحاماة.*$/,' للمحاماة');if(sm)sm.textContent=(MQ.settings&&MQ.settings.tagline)||'محامون ومستشارون قانونيون'}
A.help=()=>toast('للدعم الفني: تواصل مع مزوّد نظام ميثاق');

/* ── الشاشة الرئيسية ── */
const TAB={work:'قيد العمل',soon:'جلسات قادمة',wait:'بانتظار إجراء',closed:'مغلقة'};
S.dashTab=S.dashTab||'work';
const active=()=>cases.filter(k=>k.status!=='منتهية');
function tabCases(t){
 if(t==='closed')return cases.filter(k=>k.status==='منتهية'||k.status==='محكوم');
 if(t==='soon'){const ids=new Set(hearings.filter(h=>{const d=diff(h.date);return d>=0&&d<=14}).map(h=>h.k));return active().filter(k=>ids.has(k.id))}
 if(t==='wait'){const ids=new Set(deadlines.filter(x=>diff(x.due)>=0).map(x=>x.k));return active().filter(k=>ids.has(k.id)&&k.status!=='محكوم')}
 return active().filter(k=>k.status!=='محكوم');
}
const stageCls=k=>/حكم/.test(k.stage)||k.status==='محكوم'?'green':k.status==='تنفيذ'||/تنفيذ/.test(k.stage)?'gold':/استئناف/.test(k.stage)?'blue':/لوائح|لائحة/.test(k.stage)?'purple':'orange';
function caseTable(){
 const ks=tabCases(S.dashTab).slice().sort((a,b)=>{const x=nextH(a.id),y=nextH(b.id);return (x?x.date:"9")<(y?y.date:"9")?-1:1}).slice(0,8);
 return `<div class="tabs" role="tablist">${Object.entries(TAB).map(([k,v])=>`<button role="tab" class="${S.dashTab===k?'on':''}" data-act="dashTab" data-v="${k}">${v}<span class="n">${tabCases(k).length}</span></button>`).join('')}</div>
 <div class="tblwrap"><table class="ct"><thead><tr><th>رقم الملف</th><th>اسم القضية</th><th>العميل</th><th>المرحلة</th><th>تاريخ الجلسة</th></tr></thead><tbody>
 ${ks.length?ks.map(k=>{const h=nextH(k.id);return `<tr class="clk" data-act="openCase" data-v="${k.id}"><td class="mono">${k.no}</td><td><b class="subj">${esc(k.type)}</b></td><td>${esc(C(k.client).name)}</td><td><span class="stg ${stageCls(k)}">${esc(k.stage)}</span></td><td class="mono">${h?h.date:'—'}</td></tr>`}).join(''):'<tr><td colspan="5" class="empty">لا ملفات في هذا التصنيف</td></tr>'}
 </tbody></table></div>`}
A.dashTab=v=>{S.dashTab=v;const el=document.getElementById('caseTbl');if(el)el.innerHTML=caseTable();else render()};
A.dashTpl=v=>{S.tpl=v;S.tplVals={};S.view='tpls';window.scrollTo(0,0);render()};

const CTYPE={'فرد':'عميل فردي','شركة':'عميل تجاري','جمعية':'جمعية تعاونية','مؤسسة':'عميل مؤسسي'};
const hdr=(ic,t,v)=>`<header><h2><span class="hic">${ic}</span>${t}</h2>${v?`<button class="more" data-act="nav" data-v="${v}">عرض الكل ${KI.chevL}</button>`:''}</header>`;
const sqBtn=`<span class="sqb">${I.dots}</span>`;
function clientsCard(){
 const cs=[...clients].sort((a,b)=>String(b.last||'').localeCompare(String(a.last||''))).slice(0,5);
 return `<section class="card reveal" style="animation-delay:.1s">${hdr(I.portal,'العملاء','clients')}
 <div class="clist">${cs.map(c=>`<button class="cl" data-act="bag" data-v="${c.id}"><span class="av">${esc(initials(c.name))}</span><span class="ct2"><b>${esc(c.name)}</b><small>${esc(CTYPE[c.type]||c.type)}</small></span><span class="wa-mini" data-act="waInvite" data-v="${c.id}" title="إرسال رابط الدخول عبر واتساب">${I.wa}</span>${sqBtn}</button>`).join('')}</div></section>`}

const ampm=t=>{if(!t)return '';const [h,m]=t.split(':').map(Number);return pad(h%12||12)+':'+pad(m)+' '+(h<12?'ص':'م')};
const TONE=['blue','orange','green','purple'];
function todayCard(){
 const ev=[...hearings.filter(h=>diff(h.date)>=0).map(h=>({d:h.date,time:h.time,k:h.k,t:h.purpose,kind:'h'})),...deadlines.filter(x=>diff(x.due)>=0).map(x=>({d:x.due,time:'',k:x.k,t:x.title,kind:'d'}))]
  .sort((a,b)=>(a.d+(a.time||'99')).localeCompare(b.d+(b.time||'99'))).slice(0,4);
 const ICO={blue:I.gavel,orange:I.doc,green:I.users2,purple:I.task};
 return `<section class="card reveal" style="animation-delay:.2s">${hdr(I.cal,'أقرب المواعيد','agenda')}
 <div class="tline">${ev.length?ev.map((x,i)=>{const k=K(x.k),tn=TONE[i%4];return `<button class="tli ${tn}" data-act="openCase" data-v="${k.id}"><span class="tic">${x.kind==='h'?ICO[tn]:I.task}</span><span class="tt"><b>${x.time?ampm(x.time):'مهلة'}</b><small>${x.d}</small></span><span class="tbar"></span><span class="td"><b>${esc(x.t)}</b><small>${esc(x.kind==='h'?CT(k.court).name:C(k.client).name)}</small></span>${sqBtn}</button>`}).join(''):'<div class="empty">لا مواعيد قادمة</div>'}</div>
 <footer><button class="btn-gold" data-act="nav" data-v="agenda">إضافة موعد جديد ${I.plus}</button></footer></section>`}

const DOCICON={'لائحة':'W','بينة خطية':'PDF','محضر':'PDF','إنذار':'W','حكم':'PDF','قرار':'PDF','وكالة':'W'};
function docsCard(){
 const ds=[...docs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
 return `<section class="card reveal" style="animation-delay:.3s">${hdr(KI.docs,'المستندات الأخيرة','docs')}
 <div class="dlist">${ds.map(d=>{const k=K(d.k),ic=DOCICON[d.kind]||'W';return `<button class="dli" data-act="openCase" data-v="${k.id}"><span class="fico ${ic==='PDF'?'pdf':ic==='X'?'xls':'doc'}">${ic}</span><span class="dd"><b>${esc(d.title)}</b><small>${esc(C(k.client).name)} · ${d.pages} ص</small></span><span class="dt">${d.date}</span>${sqBtn}</button>`}).join('')}</div></section>`}

function tplCard(){
 const ts=Object.entries(TPL).slice(0,5),TN=['orange','purple','blue','orange','green'];
 return `<section class="card reveal" style="animation-delay:.35s">${hdr(KI.docs,'العقود والنماذج','tpls')}
 <div class="dlist">${ts.map(([id,t],i)=>`<button class="dli tpl" data-act="dashTpl" data-v="${id}"><span class="ti ${TN[i]}">${I.doc}</span><span class="dd"><b>${esc(t.name)}</b></span><span class="tp ${TN[i]==='blue'?'blue':TN[i]==='purple'?'purple':'orange'}">${TN[i]==='blue'?'عقد':'نموذج'}</span>${sqBtn}</button>`).join('')}</div></section>`}

function revenue(){const fee=clients.reduce((s,c)=>s+(c.fee||0),0),paid=clients.reduce((s,c)=>s+(c.paid||0),0);
 const old=d=>d&&(TODAY-pd(d))/864e5>180;
 const late=clients.filter(c=>old(c.since)&&c.paid<c.fee).reduce((s,c)=>s+(c.fee-c.paid),0),due=fee-paid-late;
 return {fee,paid,late,due,pct:fee?Math.round(paid/fee*100):0}}

/* سجل النشاط */
const KIND={mz:'ميزان',msg:'رسالة',portal:'البوابة',pay:'دفعة',voice:'صوتية',image:'صورة',file:'مرفق'};
const FTITLE={msg:'رسالة جديدة من العميل',mz:'تم تحديث حالة القضية',pay:'تم تسجيل دفعة جديدة',portal:'نشاط في بوابة الموكل',voice:'رسالة صوتية جديدة',image:'تم إضافة صورة جديدة',file:'تم إضافة مستند جديد'};
const since=at=>{const a=ago(at);if(a.startsWith('قبل '))return a.replace(/^قبل /,'منذ ');if(a==='الآن')return a;const d=Math.max(1,Math.round((TODAY-pd(at.slice(0,10)))/864e5));return 'منذ '+(d===1?'يوم':d===2?'يومين':d<=10?d+' أيام':d+' يوماً')};
window.MQ_buildFeed=()=>{S.feed=[...mzLog.map(l=>({at:l.at,kind:'mz',k:l.k,t:l.t})),...Object.entries(messages).flatMap(([c,ms])=>ms.filter(m=>m.f==='them').map(m=>({at:m.at,kind:m.v?'voice':m.img?'image':m.file?'file':'msg',c,t:m.t})))].sort((a,b)=>b.at.localeCompare(a.at)).slice(0,8)};MQ_buildFeed();
const fTime=at=>ampm(at.slice(11,16));
const FTONE={msg:'blue',mz:'orange',portal:'green',pay:'brown',voice:'blue',image:'green',file:'green'};
function feedItem(f,fresh){const who=f.c?C(f.c).name:'القضية '+K(f.k).no;
 const act=f.c?`data-act="bag" data-v="${f.c}"`:`data-act="openCase" data-v="${f.k}"`;
 return `<button class="fi ${FTONE[f.kind]||'blue'} ${fresh?'fresh':''}" ${act}><span class="fic">${I[f.kind]||I.msg}</span><span class="fit"><b>${FTITLE[f.kind]||KIND[f.kind]}</b><span>${esc(who)}${f.t?' · '+esc(f.t):''}</span></span><span class="fdot"></span><time data-at="${f.at}">${fTime(f.at)}</time></button>`}
function feedCard(){return `<section class="card reveal" style="animation-delay:.4s">${hdr(KI.hist,'الأنشطة الأخيرة','')}<div class="feedlive" id="feed">${S.feed.length?S.feed.slice(0,5).map(f=>feedItem(f)).join(''):'<div class="empty">لا نشاط بعد</div>'}</div></section>`}

/* الصف العلوي (الهوية المعتمدة): لافتة المكتب + خمس بطاقات مؤشرات حية */
const KI={files:'<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',users:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2" fill="currentColor" stroke="none"/><circle cx="5.5" cy="10" r="2.4" fill="currentColor" stroke="none"/><circle cx="18.5" cy="10" r="2.4" fill="currentColor" stroke="none"/><path d="M6 20v-1.5A4 4 0 0 1 10 15h4a4 4 0 0 1 4 4V20zM1.5 19v-.8a3 3 0 0 1 3-3h1M22.5 19v-.8a3 3 0 0 0-3-3h-1" fill="currentColor" stroke="none"/></svg>',
 docs:'<svg viewBox="0 0 24 24"><path d="M6 3h8l5 5v13H6z" fill="currentColor" fill-opacity=".14"/><path d="M14 3v5h5M9 13h6M9 17h5"/></svg>',
 tpl:'<svg viewBox="0 0 24 24"><path d="M5 3h10l4 4v6M5 3v18h8"/><path d="M8 9h6M8 13h4"/><path d="m21 15-7 7-3 .5.5-3 7-7z"/></svg>',
 up:'<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
 chevL:'<svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg>',
 arrL:'<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
 hist:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M3 4v4h4" transform="translate(0 0)"/></svg>',
 sq:'<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>'};
const ago_d=d=>d?Math.round((TODAY-pd(d))/864e5):9999;
const inWin=(d,from,to)=>{const n=ago_d(d);return n>=from&&n<to};
/* اتجاه حقيقي من بيانات المكتب: آخر 30 يوماً مقابل الـ30 التي قبلها */
function trend(cur,prev){
 if(prev>0){const p=Math.round((cur-prev)/prev*100);return `<span class="kt ${p>0?'up':p<0?'down':'flat'}">${p!==0?`<i class="${p<0?'dn':''}">${KI.up}</i>`:''}<b>${Math.abs(p)}%</b></span>`}
 if(cur>0)return `<span class="kt up"><i>${KI.up}</i><b>+${cur}</b></span>`;
 return `<span class="kt flat"><b>0%</b></span>`}
function kpis(){
 const act=active().filter(k=>k.status!=='محكوم');
 const soon=hearings.filter(h=>{const n=diff(h.date);return n>=0&&n<=14});
 const soonP=hearings.filter(h=>{const n=diff(h.date);return n>=-14&&n<0}).length;
 const nCl=clients.filter(c=>inWin(c.since,0,30)).length,pCl=clients.filter(c=>inWin(c.since,30,60)).length;
 const nDo=docs.filter(d=>inWin(d.date,0,30)).length,pDo=docs.filter(d=>inWin(d.date,30,60)).length;
 const nCa=cases.filter(k=>inWin(k.opened,0,30)).length,pCa=cases.filter(k=>inWin(k.opened,30,60)).length;
 const nTpl=Object.keys(TPL).length+((window.MQ_LAWLIB&&MQ_LAWLIB.items)?MQ_LAWLIB.items.length:0);
 const st=[
  ['brown',KI.files,act.length,'الملفات النشطة','cases',trend(nCa,pCa)],
  ['orange',I.gavel,soon.length,'الجلسات القادمة','agenda',trend(soon.length,soonP)],
  ['green',KI.users,nCl,'العملاء الجدد','clients',trend(nCl,pCl)],
  ['blue',KI.docs,docs.length,'المستندات','docs',trend(nDo,pDo)],
  ['gold',KI.tpl,nTpl,'العقود والنماذج','lawlib','']];
 return `<div class="kpis reveal">${st.map(([c,ic,n,l,v,t])=>`<button class="kpi ${c}" data-act="nav" data-v="${v}"><span class="kico">${ic}</span><span class="kbody"><b data-key="k-${v}" data-count="${n}">${n}</b><span class="kl">${l}</span></span><span class="kfoot"><span class="kd">عرض التفاصيل ${KI.arrL}</span>${t}</span></button>`).join('')}</div>`}
function hero(){
 const slogan=(MQ.settings&&MQ.settings.slogan)||'خبرة قانونية .. نحو مجتمع أكثر عدلاً';
 const nm=String(OFFICE.name||'').replace(/\s+للمحاماة.*$/,' للمحاماة');
 return `<section class="banner reveal" aria-label="لافتة المكتب"><div class="bn-txt"><h1>${esc(nm)}</h1><p>${esc(slogan)}</p></div></section>${kpis()}`}

V.dash=()=>`${hero()}
 <div class="dgrid">
  <div class="dcol a">${clientsCard()}</div>
  <div class="dcol b"><section class="card reveal" style="animation-delay:.15s">${hdr(KI.files,'الملفات والقضايا','cases')}<div id="caseTbl">${caseTable()}</div></section></div>
  <div class="dcol c">${todayCard()}</div>
 </div>
 <div class="dgrid3">${feedCard()}${tplCard()}${docsCard()}</div>`;

/* ── واجهات مكمّلة للقائمة: المالية، المهام، التقارير ── */
V.finance=()=>{const r=revenue();const rows=[...clients].map(c=>({c,owed:c.fee-c.paid})).sort((a,b)=>b.owed-a.owed);
 return `<div class="head"><div><h1>المالية والفواتير</h1><p class="sub">الأتعاب المتفق عليها، المحصّل منها، والمستحق على كل موكل</p></div></div>
 <div class="kgrid"><div class="k"><small>إجمالي الأتعاب</small><b>₪ ${money(r.fee)}</b></div><div class="k ok"><small>محصّل</small><b>₪ ${money(r.paid)}</b></div><div class="k warn"><small>مستحق</small><b>₪ ${money(r.due)}</b></div><div class="k bad"><small>متأخر (أكثر من 180 يوماً)</small><b>₪ ${money(r.late)}</b></div></div>
 <section class="panel tablewrap"><table><thead><tr><th>الموكل</th><th>الأتعاب</th><th>المحصّل</th><th>المتبقي</th><th>نسبة التحصيل</th><th>منذ</th></tr></thead><tbody>${rows.map(({c,owed})=>`<tr class="clk" data-act="bag" data-v="${c.id}"><td><b>${esc(c.name)}</b></td><td class="mono">${money(c.fee)}</td><td class="mono">${money(c.paid)}</td><td class="mono">${money(owed)}</td><td><span class="pill ${owed?(c.paid?'warn':'bad'):'ok'}">${c.fee?Math.round(c.paid/c.fee*100):0}%</span></td><td>${c.since?dmy(c.since):'—'}</td></tr>`).join('')}</tbody></table></section>`};
V.tasks=()=>{const dl=[...deadlines].sort((a,b)=>a.due.localeCompare(b.due));
 return `<div class="head"><div><h1>المهام</h1><p class="sub">المهل الإجرائية والداخلية ومهل الطعن، مرتبة حسب الاستحقاق</p></div></div>
 <section class="panel tablewrap"><table><thead><tr><th>المهمة</th><th>النوع</th><th>القضية</th><th>الموكل</th><th>الاستحقاق</th><th>الحالة</th></tr></thead><tbody>${dl.map(x=>{const k=K(x.k),n=diff(x.due);return `<tr class="clk" data-act="openCase" data-v="${k.id}"><td><b>${esc(x.title)}</b></td><td>${esc(x.kind||'')}</td><td class="mono">${k.no}</td><td>${esc(C(k.client).name)}</td><td>${dmy(x.due)}</td><td><span class="pill ${n<0?'':sevOf(n)}">${n<0?'انقضت':rel(x.due)}</span></td></tr>`}).join('')||'<tr><td colspan="6" class="empty">لا مهام</td></tr>'}</tbody></table></section>`};
V.reports=()=>{const act=cases.filter(k=>k.status!=='منتهية'),r=revenue();
 const byS=['نشطة','تنفيذ','محكوم','منتهية'].map(s=>[s,cases.filter(k=>k.status===s).length]);
 const byC=[...new Set(cases.map(k=>k.court))].map(c=>[CT(c).name,cases.filter(k=>k.court===c).length]).sort((a,b)=>b[1]-a[1]);
 const byT=[...new Set(cases.map(k=>k.type.split(' ·')[0]))].map(t=>[t,cases.filter(k=>k.type.startsWith(t)).length]).sort((a,b)=>b[1]-a[1]);
 const bar=(rows)=>{const mx=Math.max(1,...rows.map(x=>x[1]));return `<div class="bars">${rows.map(([l,n])=>`<div class="br"><span>${esc(l)}</span><i style="width:${n/mx*100}%"></i><b class="mono">${n}</b></div>`).join('')}</div>`};
 return `<div class="head"><div><h1>التقارير</h1><p class="sub">ملخص أداء المكتب: القضايا، الجلسات، المهل، والتحصيل</p></div></div>
 <div class="kgrid"><div class="k"><small>القضايا</small><b>${cases.length}</b></div><div class="k"><small>قيد المتابعة</small><b>${act.length}</b></div><div class="k"><small>الموكلون</small><b>${clients.length}</b></div><div class="k"><small>جلسات خلال 30 يوماً</small><b>${hearings.filter(h=>{const n=diff(h.date);return n>=0&&n<=30}).length}</b></div><div class="k"><small>المستندات</small><b>${docs.length}</b></div><div class="k ok"><small>نسبة التحصيل</small><b>${r.pct}%</b></div></div>
 <div class="rgrid"><section class="panel"><header><h2>القضايا حسب الحالة</h2></header><div class="bd">${bar(byS)}</div></section><section class="panel"><header><h2>القضايا حسب المحكمة</h2></header><div class="bd">${bar(byC)}</div></section><section class="panel"><header><h2>القضايا حسب النوع</h2></header><div class="bd">${bar(byT)}</div></section></div>`};
const navCount1=window.navCount;window.navCount=function(v){if(v==='tasks'){const n=deadlines.filter(x=>{const d=diff(x.due);return d>=0&&d<=7}).length;return n||''}if(v==='finance'||v==='reports')return '';return navCount1(v)};

/* العدّ التصاعدي للأرقام */
const last={};
function countUp(root,fromZero){if(!root)return;root.querySelectorAll('[data-count]').forEach(el=>{
 const key=el.dataset.key,to=+el.dataset.count,from=fromZero?0:(last[key]??to);last[key]=to;
 if(reduce||from===to){el.textContent=to.toLocaleString('en-US');return}
 const t0=performance.now(),dur=900;
 (function step(t){const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=Math.round(from+(to-from)*e).toLocaleString('en-US');if(p<1)requestAnimationFrame(step)})(t0);
})}

/* نبض الدقيقة: التاريخ في الشريط العلوي وأوقات النشاط */
function tick(){const n=new Date();if(n.getSeconds()!==0)return;drawDate();document.querySelectorAll('#feed time[data-at]').forEach(t=>t.textContent=fTime(t.dataset.at))}
setInterval(tick,1000);

/* أحداث حية تجريبية (للعرض فقط) */
const LIVE=[
 {kind:'portal',c:'c2',t:'اطّلع على «لائحة الدعوى» في البوابة'},
 {kind:'mz',k:'k4',t:'تأكيد موعد تدقيق الاستئناف 27/10/2026 دون تغيير'},
 {kind:'pay',c:'c1',amount:1000,t:'سدّد دفعة أتعاب بقيمة 1,000 ₪'},
 {kind:'portal',c:'c3',t:'دخل إلى البوابة واطّلع على موعد جلسة المرافعة'}];
function pushFeed(f){S.feed.unshift(f);S.feed=S.feed.slice(0,12);drawNav();
 if(S.view!=='dash')return;
 const feed=document.getElementById('feed');
 if(feed){const e=feed.querySelector('.empty');if(e)e.remove();feed.insertAdjacentHTML('afterbegin',feedItem(f,true));while(feed.children.length>5)feed.lastElementChild.remove()}
}
window.MQ_pushFeed=pushFeed;
let li=0;
function liveEvent(){
 const e=LIVE[li++];if(!e)return;const at=stampNow();
 if(e.kind==='msg')(messages[e.c]=messages[e.c]||[]).push({f:'them',ch:e.ch,t:e.t,at,unread:true});
 if(e.kind==='mz')mzLog.unshift({at,k:e.k,t:e.t});
 if(e.kind==='pay'){const c=C(e.c);c.paid=Math.min(c.fee,c.paid+e.amount)}
 if(e.kind==='portal')C(e.c).last=iso(TODAY);
 pushFeed({at,kind:e.kind,c:e.c,k:e.k,t:e.t});
}
if(window.MQ_DEMO)(function loop(){setTimeout(()=>{liveEvent();if(li<LIVE.length)loop()},li?17000:7000)})();

/* ── روابط دخول الموكلين عبر واتساب ── */
const portalBase=()=>((MQ.settings&&MQ.settings.portalUrl)||(/palgaz\.net$/.test(location.hostname)?location.origin:'https://mithaq.palgaz.net')).replace(/\/$/,'');
const loginLink=c=>portalBase()+'/p/'+encodeURIComponent(c.code);
const waNum=c=>{let d=String(c.whatsapp||c.phone||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);else if(d.startsWith('0'))d='970'+d.slice(1);return d.length>=11?d:''};
const waText=c=>`مرحباً ${c.name}،\nيسعدنا تواصلك مع ${OFFICE.name}.\nلمتابعة قضاياك ومواعيد جلساتك ومراسلة المكتب، افتح بوابة الموكل من هذا الرابط الخاص بك:\n${loginLink(c)}\n\nرمز الدخول: ${c.code}\nيُرجى عدم مشاركة الرابط أو الرمز مع أي شخص.`;
A.waInvite=id=>{const c=C(id);if(!c)return;if(!c.portal){toast('فعّل بوابة الموكل لهذا الموكل أولاً');return}
 const n=waNum(c),url='https://wa.me/'+(n||'')+'?text='+encodeURIComponent(waText(c));
 window.open(url,'_blank','noopener');if(!n)toast('لا يوجد رقم واتساب للموكل؛ اختر جهة الاتصال من واتساب')};
A.copyLink=id=>{const c=C(id);if(!c)return;const t=loginLink(c);(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('نُسخ رابط الدخول'),()=>prompt('انسخ الرابط:',t))};
window.MQ_loginLink=loginLink;
function waOnClient(){if(S.view!=='client')return;const h=document.querySelector('.bag-head .bag-id>div:last-child');if(!h||document.getElementById('waBar'))return;const c=C(S.clientId);if(!c)return;
 h.insertAdjacentHTML('beforeend',`<div class="wa-bar" id="waBar"><button class="btn wa-btn sm" data-act="waInvite" data-v="${c.id}">${I.wa} إرسال رابط الدخول عبر واتساب</button><button class="btn sm" data-act="copyLink" data-v="${c.id}">نسخ الرابط</button></div>`)}

/* ── اللوحة الجانبية الحية: صورة المكتب القانوني مع حركة هادئة ── */
function sideArt(){if(document.getElementById('sideArt'))return;const m=document.querySelector('.main');if(!m)return;
 const r=(a,b)=>(a+Math.random()*(b-a)).toFixed(2);
 const dust=[...Array(14)].map(()=>`<i style="left:${r(4,92)}%;--d:${r(14,28)}s;--w:${r(-28,0)}s;--s:${r(1.5,3.4)}px;--x:${r(-22,22)}px"></i>`).join('');
 const lights=[...Array(9)].map(()=>`<i style="left:${r(6,90)}%;top:${r(3,22)}%;--d:${r(3,7)}s;--w:${r(-7,0)}s;--s:${r(2,4.5)}px"></i>`).join('');
 const sparks=[[60,43.5],[92,44.5],[76,35],[48,24],[84,27]].map(([x,y],i)=>`<i style="left:${x}%;top:${y}%;--d:${(2.4+i*.55).toFixed(2)}s;--w:${(-i*.7).toFixed(2)}s"></i>`).join('');
 m.insertAdjacentHTML('afterbegin',`<div class="side-art" id="sideArt" aria-hidden="true"><div class="sa-img"></div><div class="sa-rays"></div><div class="sa-lights">${lights}</div><div class="sa-glow"></div><div class="sa-pan l"></div><div class="sa-pan r"></div><div class="sa-sweep"></div><div class="sa-sparks">${sparks}</div><div class="sa-dust">${dust}</div><div class="sa-neon"></div></div>`)}

/* ربط العرض */
const baseRender=render;
render=function(){baseRender();topBar();GREET();brand();waOnClient();sideArt();if(S.view==='dash')countUp(document.getElementById('page'),true)};
topBar();
})();
