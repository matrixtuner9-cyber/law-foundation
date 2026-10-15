@echo off
rem تغيير رمز عمليات مزود الخدمة: يولّد رمزاً جديداً ويحفظه في .ops_token ويرفعه سراً إلى Cloudflare دون طباعته
cd /d D:\MithaqCloud
node -e "require('fs').writeFileSync('.ops_token',require('crypto').randomBytes(32).toString('base64url'))"
icacls .ops_token /inheritance:r /grant:r "%USERNAME%:F" >nul
type .ops_token | npx wrangler secret put OPS_TOKEN > secret.log 2>&1
findstr /C:"Success" /C:"ERROR" secret.log
