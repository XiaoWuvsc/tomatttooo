param(
  [string]$Format = "jpg",
  [Parameter(ValueFromRemainingArguments = $true)][string[]]$Paths
)
# ============================================
# tomatttooo · RAW 转 JPG/PNG（本地转换）
# 用法1：把 DNG/ARW 等文件直接拖到 DNG转JPG.bat 上
# 用法2：双击 DNG转JPG.bat，转换脚本所在文件夹里的所有 RAW
# 依赖：Microsoft Store 免费的「Raw Image Extension」（已装）
# ============================================

$ErrorActionPreference = "Continue"
Add-Type -AssemblyName PresentationCore

$items = @()
if ($Paths -and $Paths.Count -gt 0) {
  foreach ($p in $Paths) {
    if (Test-Path -LiteralPath $p) {
      $it = Get-Item -LiteralPath $p
      if (-not $it.PSIsContainer) { $items += $it }
    }
  }
}
if (-not $items) {
  $items = Get-ChildItem -LiteralPath $PSScriptRoot -File |
    Where-Object { $_.Extension -match '^\.(dng|arw|cr2|cr3|nef|raf|rw2|orf|pef|srw)$' }
}

if (-not $items) {
  Write-Host ""
  Write-Host "没找到 RAW 文件。请把 DNG/ARW 等文件拖到本脚本上，或放到本文件夹后双击运行。" -ForegroundColor Yellow
  pause
  exit 1
}

$ok = 0
foreach ($f in $items) {
  $stream = $null
  $outStream = $null
  try {
    $stream = [System.IO.File]::OpenRead($f.FullName)
    $decoder = [System.Windows.Media.Imaging.BitmapDecoder]::Create(
      $stream,
      [System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,
      [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
    )
    $frame = $decoder.Frames[0]
    $out = [System.IO.Path]::ChangeExtension($f.FullName, ".$Format")
    if ($Format -eq "png") {
      $enc = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
    } else {
      $enc = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
      $enc.QualityLevel = 95
    }
    $enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($frame))
    $outStream = [System.IO.File]::Create($out)
    $enc.Save($outStream)
    $ok++
    Write-Host ("OK: {0}  ->  {1}" -f $f.Name, (Split-Path $out -Leaf)) -ForegroundColor Green
  } catch {
    Write-Host ("FAIL: {0} — {1}" -f $f.Name, $_.Exception.Message) -ForegroundColor Red
  } finally {
    if ($outStream) { $outStream.Close() }
    if ($stream) { $stream.Close() }
  }
}

Write-Host ""
Write-Host ("完成：成功 {0} 张，共 {1} 张。原文件保留。" -f $ok, $items.Count)
pause
