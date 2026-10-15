@echo off
rem بناء كل نسخ ميثاق: تطبيق الموكل (APK)، بوابة الويب، وتطبيق سطح المكتب
rem الاستخدام: build_all.bat [عنوان الخادم للهاتف]
cd /d "%~dp0"
set API=%1
if "%API%"=="" set API=http://192.168.1.11:8080
cd mithaq_portal
echo === packages
call flutter pub add local_auth:^2.3.0
echo PUB_EXIT %ERRORLEVEL%
echo === apk (%API%)
call flutter build apk --release --dart-define=API=%API%
echo APK_EXIT %ERRORLEVEL%
if exist build\app\outputs\flutter-apk\app-release.apk copy /y build\app\outputs\flutter-apk\app-release.apk "..\dist\Mithaq-Client.apk" >nul
echo === web
call flutter build web --release --base-href /portal/ --pwa-strategy=none
echo WEB_EXIT %ERRORLEVEL%
cd ..
if exist mithaq_portal\build\web\main.dart.js (
  rmdir /s /q portal
  xcopy /e /i /q /y mithaq_portal\build\web portal >nul
  echo PORTAL_PUBLISHED
)
echo === desktop
call npx electron-builder --win nsis portable
echo DESKTOP_EXIT %ERRORLEVEL%
echo ALL_DONE
