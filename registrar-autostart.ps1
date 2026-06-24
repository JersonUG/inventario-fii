$vbs = Join-Path $PSScriptRoot "iniciar.vbs"
$lnk = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\InventarioFII.lnk"
$wshell = New-Object -ComObject WScript.Shell
$shortcut = $wshell.CreateShortcut($lnk)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbs`""
$shortcut.WindowStyle = 7
$shortcut.Description = "Inventario FII - Sistema de Gestion Patrimonial"
$shortcut.Save()
Write-Host "Autostart registrado. El sistema iniciara al encender la PC."
