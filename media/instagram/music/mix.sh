#!/bin/sh
# $1 = الصوت، $2 = الموسيقى، $3 = الناتج: الموسيقى خافتة وتنخفض تلقائياً أثناء الكلام
ffmpeg -v error -y -i "$1" -i "$2" -filter_complex "[0:a]aresample=44100,aformat=channel_layouts=stereo,apad=pad_dur=2.4,asplit=2[v][sc];[1:a]volume=0.30[m];[m][sc]sidechaincompress=threshold=0.02:ratio=5:attack=30:release=600[d];[v][d]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.95" -c:a pcm_s16le "$3"
