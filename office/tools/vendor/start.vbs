' تشغيل «إدارة نسخ المسبار» دون نافذة سوداء، ثم فتح صفحته في المتصفح
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
here = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = here
sh.Run "node """ & here & "\vendor.js""", 0, False
