; BrowsMe NSIS Custom Installer Script
; Executed during installation after files are extracted to $INSTDIR

!macro customInstall
  DetailPrint "BrowsMe: Python LTS və Node.js LTS mühiti yoxlanılır və quraşdırılır..."
  nsExec::ExecToLog '"$INSTDIR\installer\setup-runtimes.bat"'
!macroend
