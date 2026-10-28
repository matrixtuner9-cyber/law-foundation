# تركيب فيديو الحوار الواقعي — يشتغل داخل الـ workbench (فيه إنترنت)
import json, os, subprocess, urllib.request
try:
    import imageio_ffmpeg; FF = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    FF = 'ffmpeg'
RAW = 'https://raw.githubusercontent.com/matrixtuner9-cyber/law-foundation/ig-renders/dlgreal/'
W = os.environ.get('WDIR', '/tmp/dlgreal'); os.makedirs(W, exist_ok=True); os.chdir(W)

def get(url, name):
    if not os.path.exists(name) or os.path.getsize(name) == 0:
        urllib.request.urlretrieve(url, name)
    return name

LOCAL = os.environ.get('LOCAL')
urls = {} if LOCAL else json.load(urllib.request.urlopen(RAW + 'urls.json'))
for n in ([] if LOCAL else ['i04', 'i06', 'i08', 'i10', 'i12', 'end', 'tagK', 'tagA', 'tagI']):
    get(RAW + n + '.png', n + '.png')
LOCAL or get(RAW + 'bed.mp3', 'bed.mp3')
for k, u in urls.items():
    get(u, k + ('.mp4' if k.startswith('v') else '.mp3'))

def run(args):
    r = subprocess.run([FF, '-v', 'error', '-y'] + args, capture_output=True, text=True)
    if r.returncode: raise SystemExit(r.stderr[-2000:])

def dur(f):
    r = subprocess.run([FF, '-i', f], capture_output=True, text=True).stderr
    h, m, s = r.split('Duration: ')[1].split(',')[0].split(':')
    return int(h) * 3600 + int(m) * 60 + float(s)

GAP = 0.3
ENC = ['-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p',
       '-c:a', 'aac', '-ar', '44100', '-ac', '2', '-b:a', '160k']

def face(src, tag, out):
    run(['-i', src, '-i', tag, '-filter_complex',
         f'[0:v]fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,'
         f'tpad=stop_mode=clone:stop_duration={GAP}[b];[b][1:v]overlay=0:0[v];'
         f'[0:a]aresample=44100,apad=pad_dur={GAP}[a]',
         '-map', '[v]', '-map', '[a]'] + ENC + [out])

def insert(img, aud, out):
    d = dur(aud) + GAP + 0.1
    fr = int(d * 30) + 1
    run(['-loop', '1', '-framerate', '30', '-t', f'{d:.3f}', '-i', img, '-i', aud, '-i', 'tagI.png', '-filter_complex',
         f"[0:v]scale=1188:2112,zoompan=z='min(zoom+0.0007,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={fr}:s=1080x1920:fps=30,setsar=1[b];"
         f'[b][2:v]overlay=0:0[v];[1:a]aresample=44100,apad[a]',
         '-map', '[v]', '-map', '[a]', '-t', f'{d:.3f}'] + ENC + [out])

def endcard(out, d=4.0):
    run(['-loop', '1', '-framerate', '30', '-t', str(d), '-i', 'end.png', '-f', 'lavfi', '-t', str(d),
         '-i', 'anullsrc=r=44100:cl=stereo', '-vf', 'fade=in:st=0:d=0.4,setsar=1'] + ENC + ['-shortest', out])

seq = [('f', 'v01', 'tagK'), ('f', 'v02', 'tagA'), ('f', 'v03', 'tagK'), ('i', 'i04', 'a04'),
       ('f', 'v05', 'tagK'), ('i', 'i06', 'a06'), ('f', 'v07', 'tagK'), ('i', 'i08', 'a08'),
       ('f', 'v09', 'tagK'), ('i', 'i10', 'a10'), ('f', 'v11', 'tagK'), ('i', 'i12', 'a12'),
       ('f', 'v13', 'tagK'), ('f', 'v14', 'tagA')]
parts = []
for n, (kind, a, b) in enumerate(seq):
    out = f'seg{n:02d}.mp4'
    if kind == 'f': face(a + '.mp4', b + '.png', out)
    else: insert(a + '.png', b + '.mp3', out)
    parts.append(out)
endcard('seg99.mp4'); parts.append('seg99.mp4')
open('list.txt', 'w').write(''.join(f"file '{p}'\n" for p in parts))
run(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'dialog.mp4'])
T = dur('dialog.mp4')
# موسيقى خفيفة تحت الكلام، وتعلى شوي على بطاقة الختام
run(['-i', 'dialog.mp4', '-stream_loop', '-1', '-i', 'bed.mp3', '-filter_complex',
     f"[1:a]atrim=0:{T:.2f},volume='if(gt(t,{T-4:.2f}),0.32,0.11)':eval=frame,afade=t=out:st={T-1.5:.2f}:d=1.5[m];"
     f'[0:a][m]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=11[a]',
     '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-movflags', '+faststart', 'reel-dialog-real.mp4'])
# لقطات للفحص
run(['-i', 'reel-dialog-real.mp4', '-vf', f'fps={8/T:.4f},scale=270:480,tile=8x1', '-frames:v', '1', 'sheet.jpg'])
print('DONE', round(T, 2), os.path.getsize('reel-dialog-real.mp4'))
