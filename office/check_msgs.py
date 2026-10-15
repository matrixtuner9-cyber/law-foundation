import json,io,sys
sys.stdout.reconfigure(encoding='utf-8')
m=json.load(io.open(r'D:\Mithaq\data\messages.json',encoding='utf-8'))
st=json.load(io.open(r'D:\Mithaq\data\state.json',encoding='utf-8'))
codes={c['id']:(c.get('code'),c.get('name')) for c in st.get('clients',[])}
for x in m[-6:]:
    print(x.get('at'),x.get('from'),x.get('type'),codes.get(x.get('client')),'seen=',x.get('seen'),'|',(x.get('text') or '')[:40])
