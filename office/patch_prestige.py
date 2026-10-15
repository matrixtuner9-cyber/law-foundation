import sys,io,os
lib=sys.argv[1]
def rd(f): return io.open(os.path.join(lib,f),encoding='utf-8').read()
def wr(f,s): io.open(os.path.join(lib,f),'w',encoding='utf-8',newline='\n').write(s)
def sub(f,pairs):
    s=rd(f)
    for a,b,n in pairs:
        c=s.count(a)
        if c<1 or (n and c!=n): print('MISMATCH',f,repr(a),c); sys.exit(1)
        s=s.replace(a,b)
    wr(f,s)
G={'Color(0xFF184A3F)':'MQ.navy2','Color(0xFF1E5A4C)':'MQ.navy2','Color(0xFF9FBDB2)':'MQ.soft','Color(0xFFB7CFC6)':'MQ.soft','Color(0xFF8FB0A5)':'MQ.soft','Color(0xFF1B4038)':'MQ.surfaceAlt','Color(0xFF3C6A5E)':'MQ.line','Color(0xFFB3261E)':'MQ.danger'}
for f in ['home.dart','main.dart','docs.dart','settings.dart']:
    s=rd(f)
    for a,b in G.items(): s=s.replace(a,b)
    wr(f,s)
sub('attach.dart',[("Icon(ic, color: Colors.white, size: 26)","Icon(ic, color: MQ.onGold, size: 26)",1)])
sub('cases.dart',[("Chip2(relDay(t), bg: MQ.pine, fg: Colors.white)","Chip2(relDay(t), bg: MQ.pine, fg: MQ.onGold)",1)])
sub('chat.dart',[
 ("child: SizedBox(width: 48, height: 48, child: Icon(icon, color: Colors.white, size: 23))","child: SizedBox(width: 48, height: 48, child: Icon(icon, color: MQ.onGold, size: 23))",1),
 ("color: mine ? MQ.pine : MQ.surface,","color: mine ? MQ.mine : MQ.surface,",1),
 ("color: widget.mine ? Colors.white : MQ.pine,\n          shape: const CircleBorder(),","color: MQ.pine,\n          shape: const CircleBorder(),",1),
 ("color: widget.mine ? MQ.pine : Colors.white))","color: MQ.onGold))",1),
 ("color: widget.mine ? MQ.pine : Colors.white, size: 26)","color: MQ.onGold, size: 26)",1),
 ("final on = widget.mine ? Colors.white : MQ.pine;","final on = widget.mine ? MQ.brassHi : MQ.pine;",1),
])
sub('docs.dart',[("foregroundColor: Colors.white,\n        onPressed: () => Attach.sheet","foregroundColor: MQ.onGold,\n        onPressed: () => Attach.sheet",1),
 ("style: MQ.body(14, color: Colors.white, weight: FontWeight.w600)),\n      ),\n      body: ListenableBuilder","style: MQ.body(14, color: MQ.onGold, weight: FontWeight.w700)),\n      ),\n      body: ListenableBuilder",1)])
sub('home.dart',[("color: m.seen ? MQ.pine : Colors.white)","color: m.seen ? MQ.pine : MQ.onGold)",1)])
sub('main.dart',[("strokeWidth: 2.4, color: Colors.white)","strokeWidth: 2.4, color: MQ.onGold)",1)])
sub('push.dart',[("strokeWidth: 2, color: Colors.white)","strokeWidth: 2, color: MQ.onGold)",1)])
sub('settings.dart',[("strokeWidth: 2, color: Colors.white)","strokeWidth: 2, color: MQ.onGold)",1)])
print('OK')
