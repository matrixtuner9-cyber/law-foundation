@echo off
cd /d "%~dp0"
echo === packages
call flutter pub add flutter_background_service:^5.0.10 flutter_local_notifications:^17.2.4
echo PUB_EXIT %ERRORLEVEL%
echo === apk
call flutter build apk --release --dart-define=API=http://192.168.1.11:8080
echo APK_EXIT %ERRORLEVEL%
if exist build\app\outputs\flutter-apk\app-release.apk copy /y build\app\outputs\flutter-apk\app-release.apk "..\dist\Mithaq-Client.apk" >nul
echo === web
call flutter build web --release --base-href /portal/ --pwa-strategy=none
echo WEB_EXIT %ERRORLEVEL%
echo ALL_DONE
