@echo off
setlocal EnableExtensions
rem بناء تطبيق بوابة الموكل لأندرويد (APK) — يتوقف عند أي خطأ
rem الاستخدام: build_apk.bat https://office.palgaz.net   (عنوان خادم المكتب الفعلي، لا عنوان شبكة محلية افتراضي)
cd /d "%~dp0" || exit /b 1
set "API=%~1"
if not defined API (
  echo ERROR: Usage: build_apk.bat https://your-office-domain
  exit /b 2
)
echo === licenses
(for /l %%i in (1,1,30) do @echo y) | call flutter doctor --android-licenses >nul
echo === packages
call flutter pub get
if errorlevel 1 exit /b 1
echo === icons
call dart run flutter_launcher_icons
if errorlevel 1 exit /b 1
echo === build (%API%)
call flutter build apk --release "--dart-define=API=%API%"
if errorlevel 1 exit /b 1
if not exist "build\app\outputs\flutter-apk\app-release.apk" (echo ERROR: APK not generated & exit /b 1)
if not exist "..\dist" mkdir "..\dist" || exit /b 1
copy /y "build\app\outputs\flutter-apk\app-release.apk" "..\dist\Mithaq-Client.apk" >nul
if errorlevel 1 exit /b 1
echo SUCCESS: ..\dist\Mithaq-Client.apk
