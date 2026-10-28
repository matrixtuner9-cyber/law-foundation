// يرسم الريل إطاراً إطاراً (30 إطاراً/ث) ويُخرج MP4 بمواصفات انستغرام (H.264، 1080×1920، صوت صامت)
const { chromium } = require('playwright'), { spawn } = require('child_process');
const R = process.argv[2] || 'intro', FPS = 30, ONLY = process.argv[3] && process.argv[3] !== '-' ? process.argv[3] : '';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file:///home/claude/ig/reel.html?r=' + R + (process.env.B ? '&b=' + process.env.B : '')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
  const DUR = await p.evaluate(() => window.DUR);
  if (ONLY) { for (const t of ONLY.split(',')) { await p.evaluate(t => render(t), Number(t)); await p.screenshot({ path: `/home/claude/ig/out/${R}-t${t}.png` }) } await b.close(); return }
  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', ...(process.env.AUD ? ['-i', process.env.AUD, '-af', 'apad,afade=t=in:d=0.05'] : ['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo']),
    '-map', '0:v', '-map', '1:a', '-shortest', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', `/home/claude/ig/out/reel-${R}${process.env.AUD?'-voice':''}.mp4`], { stdio: ['pipe', 'ignore', 'inherit'] });
  const n = Math.round(DUR * FPS);
  for (let i = 0; i < n; i++) { await p.evaluate(t => render(t), i / FPS); const buf = await p.screenshot({ type: 'jpeg', quality: 92 }); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)) }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('done', R, n, 'frames');
})();
