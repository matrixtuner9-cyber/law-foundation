# يقطّع جمل الشخصيتين ويركّبها بالترتيب على خط زمني واحد ثم يمزجها مع الموسيقى
import json,subprocess,sys
A,B,OUT=sys.argv[1],sys.argv[2],sys.argv[3]
tl=json.load(open('/home/claude/ig/dlg/tl.json'))['tl']
inp=['-i',A,'-i',B]; parts=[]
for k,x in enumerate(tl):
  src=0 if x['sp']=='A' else 1; a,b=x['src']; d=int(x['t0']*1000)
  parts.append(f"[{src}:a]atrim={a}:{b},asetpts=PTS-STARTPTS,aresample=44100,aformat=channel_layouts=stereo,afade=t=in:d=0.03,afade=t=out:st={b-a-0.06:.3f}:d=0.06,adelay={d}|{d}[s{k}]")
fc=';'.join(parts)+';'+''.join(f'[s{k}]' for k in range(len(tl)))+f'amix=inputs={len(tl)}:normalize=0[v]'
subprocess.run(['ffmpeg','-v','error','-y',*inp,'-filter_complex',fc,'-map','[v]','-c:a','pcm_s16le',OUT],check=True)
print('ok',OUT)
