@echo off
where cloudflared
if %ERRORLEVEL%==0 (echo ALREADY & goto end)
winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements
echo WINGET_EXIT %ERRORLEVEL%
:end
echo CF_DONE
