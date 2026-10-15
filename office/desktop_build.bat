@echo off
cd /d D:\Mithaq
call npx electron-builder --win nsis portable
echo DESKTOP_EXIT %ERRORLEVEL%
