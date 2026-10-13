$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot '..\public\assets\game\sevendream'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$out = Join-Path $outDir 'sevendream-placeholder.jpg'

$w, $h = 1600, 900
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.Clear([System.Drawing.Color]::FromArgb(255, 10, 12, 14))

$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(180, 0, 255, 204), 3)
$g.DrawRectangle($pen, 48, 48, $w - 96, $h - 96)

$font = New-Object System.Drawing.Font 'Consolas', 72, ([System.Drawing.FontStyle]::Bold)
$sub = New-Object System.Drawing.Font 'Consolas', 28, ([System.Drawing.FontStyle]::Regular)
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 255, 204))
$white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 255, 255, 255))

$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = 'Center'
$fmt.LineAlignment = 'Center'
$g.DrawString('SEVENDREAM', $font, $brush, (New-Object System.Drawing.RectangleF 0, ($h/2 - 80), $w, 120), $fmt)
$g.DrawString('CMD_02 // PLACEHOLDER COVER', $sub, $white, (New-Object System.Drawing.RectangleF 0, ($h/2 + 40), $w, 60), $fmt)

$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$g.Dispose(); $bmp.Dispose(); $pen.Dispose(); $font.Dispose(); $sub.Dispose(); $brush.Dispose(); $white.Dispose()
Write-Host "Wrote $out"
