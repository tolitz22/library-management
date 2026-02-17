Add-Type -AssemblyName System.Drawing

$source = Resolve-Path "public/logo-icon.png"
$srcImage = [System.Drawing.Image]::FromFile($source)

function Save-ResizedPng($image, $targetPath, $size) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $graphics = [System.Drawing.Graphics]::FromImage($bmp)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $srcW = $image.Width
  $srcH = $image.Height
  $scale = [Math]::Min($size / $srcW, $size / $srcH)
  $drawW = [int]([Math]::Round($srcW * $scale))
  $drawH = [int]([Math]::Round($srcH * $scale))
  $offsetX = [int](($size - $drawW) / 2)
  $offsetY = [int](($size - $drawH) / 2)

  $graphics.DrawImage($image, $offsetX, $offsetY, $drawW, $drawH)

  $dir = Split-Path -Parent $targetPath
  if (!(Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir | Out-Null
  }

  $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bmp.Dispose()
}

Save-ResizedPng $srcImage "public/icons/icon-192.png" 192
Save-ResizedPng $srcImage "public/icons/icon-512.png" 512
Save-ResizedPng $srcImage "public/icons/maskable-512.png" 512
Save-ResizedPng $srcImage "public/icons/apple-touch-icon.png" 180

$srcImage.Dispose()
Write-Output "Generated PWA icons."
