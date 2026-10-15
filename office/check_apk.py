import zipfile
z=zipfile.ZipFile(r'D:\Mithaq\dist\Mithaq-Client.apk')
for n in z.namelist():
    if n.endswith('libapp.so'):
        b=z.read(n)
        print(n, len(b), 'palgaz' , b.count(b'mithaq.palgaz.net'), '1.11', b.count(b'192.168.1.11'), '1.6', b.count(b'192.168.1.6:'), 'api_for', b.count(b'api_for'))
