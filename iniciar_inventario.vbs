Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d """ & WshShell.ExpandEnvironmentStrings("USERPROFILE") & "\Desktop\Inv\inventario-fii"" && start /B npm start >nul 2>&1", 0, False
