@echo off
cd /d D:\Mithaq\mithaq_portal
call flutter build apk --release --dart-define=API=https://mithaq.palgaz.net
echo APK_EXIT %ERRORLEVEL%
if exist build\app\outputs\flutter-apk\app-release.apk copy /y build\app\outputs\flutter-apk\app-release.apk "D:\Mithaq\dist\Mithaq-Client.apk" >nul
echo APK_DONE
