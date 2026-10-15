@echo off
set CF="C:\Program Files (x86)\cloudflared\cloudflared.exe"
%CF% tunnel create mithaq
echo CREATE_EXIT %ERRORLEVEL%
%CF% tunnel route dns mithaq mithaq.palgaz.net
echo ROUTE_EXIT %ERRORLEVEL%
%CF% tunnel list
echo SETUP_DONE
