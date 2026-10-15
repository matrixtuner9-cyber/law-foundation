Set sh = CreateObject("WScript.Shell")
sh.Run "cmd /c for /f ""tokens=5"" %a in ('netstat -ano ^| findstr "":8080 "" ^| findstr LISTEN') do taskkill /F /PID %a", 0, True
sh.Run "taskkill /F /IM cloudflared.exe", 0, True
WScript.Sleep 2000
sh.Run "cmd /c D:\Mithaq\run_server.bat", 0, False
WScript.Sleep 4000
sh.Run "cmd /c D:\Mithaq\run_tunnel.bat", 0, False
