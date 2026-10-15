@echo off
rem بناء تطبيق بوابة الموكل لأندرويد (APK)
rem الاستخدام: build_apk.bat [عنوان الخادم]   مثال: build_apk.bat http://192.168.1.11:8080
cd /d "%~dp0"
set API=%1
if "%API%"=="" set API=http://192.168.1.11:8080
echo === licenses
(for /l %%i in (1,1,30) do @echo y) | call flutter doctor --android-licenses
echo === icons
call flutter pub add --dev flutter_launcher_icons
call dart run flutter_launcher_icons
echo === build (%API%)
call flutter build apk --release --dart-define=API=%API%
echo APK_EXIT %ERRORLEVEL%
if exist build\app\outputs\flutter-apk\app-release.apk (
  copy /y build\app\outputs\flutter-apk\app-release.apk "..\dist\Mithaq-Client.apk" >nul
  echo COPIED ..\dist\Mithaq-Client.apk
)
