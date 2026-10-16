; مثبّت «ميثاق خاص»: طبقة حماية ثانية لا تعتمد على كود التطبيق —
; قاعدة في جدار حماية ويندوز تمنع أي اتصال خارج من البرنامج (الاتصال بالجهاز نفسه 127.0.0.1 غير متأثر)
!macro customInstall
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Mithaq Private - no internet"'
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Mithaq Private - no internet" dir=out action=block enable=yes profile=any program="$INSTDIR\${APP_EXECUTABLE_FILENAME}"'
!macroend
!macro customUnInstall
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Mithaq Private - no internet"'
!macroend
