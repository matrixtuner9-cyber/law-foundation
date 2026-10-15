' تشغيل خادم ميثاق ونفق Cloudflare مخفيين عند دخول ويندوز
Set sh = CreateObject("WScript.Shell")
sh.Run "cmd /c D:\Mithaq\run_server.bat", 0, False
WScript.Sleep 4000
sh.Run "cmd /c D:\Mithaq\run_tunnel.bat", 0, False
