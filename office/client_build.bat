@echo off
cd /d D:\Mithaq\mithaq_portal
echo === analyze
call flutter analyze lib --no-fatal-infos --no-fatal-warnings
echo ANALYZE_EXIT %ERRORLEVEL%
echo === apk
call flutter build apk --release --dart-define=API=https://mithaq.palgaz.net
echo APK_EXIT %ERRORLEVEL%
if exist build\app\outputs\flutter-apk\app-release.apk copy /y build\app\outputs\flutter-apk\app-release.apk "D:\Mithaq\dist\Mithaq-Client.apk" >nul
echo === web
call flutter build web --release --base-href /portal/ --pwa-strategy=none
echo WEB_EXIT %ERRORLEVEL%
cd /d D:\Mithaq
if exist mithaq_portal\build\web\main.dart.js (
  rmdir /s /q portal
  xcopy /e /i /q /y mithaq_portal\build\web portal >nul
  echo PORTAL_PUBLISHED
)
echo CLIENT_DONE
