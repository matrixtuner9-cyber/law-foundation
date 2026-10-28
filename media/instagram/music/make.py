# موسيقى خلفية خفيفة أصلية (مولّدة برمجياً): وسادة أوتار ناعمة + نقرات بيانو هادئة، تقدّم Am–F–C–G، 84 BPM
import numpy as np, wave, sys
SR=44100; DUR=float(sys.argv[1]) if len(sys.argv)>1 else 75; OUT=sys.argv[2] if len(sys.argv)>2 else 'bed.wav'
t=np.arange(int(SR*DUR))/SR; out=np.zeros((len(t),2))
f=lambda m:440*2**((m-69)/12)
BPM=84; beat=60/BPM; bar=4*beat
prog=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]  # Am F C G
bass=[45,41,48,43]
def env(n,a,r):
    e=np.ones(n); A=int(a*SR); R=int(r*SR); e[:A]=np.linspace(0,1,A); e[-R:]*=np.linspace(1,0,R); return e
nbars=int(DUR/bar)+1
for b in range(nbars):
    s=b*bar; ch=prog[b%4]; i0=int(s*SR); n=int(bar*1.15*SR); n=min(n,len(t)-i0)
    if n<=0: break
    tt=np.arange(n)/SR; e=env(n,1.2,1.4) if n>SR*3 else np.ones(n)
    pad=sum(np.sin(2*np.pi*f(m)*tt+0.3*np.sin(2*np.pi*0.2*tt))*0.5+0.25*np.sin(2*np.pi*f(m)*2.003*tt) for m in ch)/len(ch)
    out[i0:i0+n,0]+=0.16*pad*e; out[i0:i0+n,1]+=0.16*pad*e*0.95
    bn=np.sin(2*np.pi*f(bass[b%4])*tt)*np.exp(-tt*0.8)
    out[i0:i0+n,:]+=0.12*bn[:,None]*e[:,None]
    # آربيجيو بيانو ناعم (ثُمنيات)
    notes=[ch[0]+12,ch[1]+12,ch[2]+12,ch[1]+12,ch[0]+24,ch[2]+12,ch[1]+12,ch[2]+12]
    for k,m in enumerate(notes):
        j0=i0+int(k*beat/2*SR); L=int(1.6*SR); L=min(L,len(t)-j0)
        if L<=0: continue
        u=np.arange(L)/SR; pl=(np.sin(2*np.pi*f(m)*u)+0.3*np.sin(2*np.pi*f(m)*2*u)+0.1*np.sin(2*np.pi*f(m)*3*u))*np.exp(-u*3.2)*np.minimum(1,u*200)
        pan=0.5+0.3*np.sin(k)
        out[j0:j0+L,0]+=0.07*pl*(1-pan); out[j0:j0+L,1]+=0.07*pl*pan
# صدى بسيط
d=int(0.32*SR); 
for k in range(1,4): out[d*k:,:]+=out[:-d*k,:]*0.25**k
fi=env(len(t),2.5,4.0); out*=fi[:,None]
out/=np.max(np.abs(out))*1.05
w=wave.open(OUT,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype(np.int16).tobytes()); w.close()
print('ok',OUT,DUR)
