param(
  [string]$Env = "",
  [string]$Config = "deploy/cloudflare/wrangler.gateway.toml",
  [string]$SecretsFile = "deploy/cloudflare/secrets.local.env"
)

if (!(Test-Path $SecretsFile)) {
  Write-Error "Secrets file not found: $SecretsFile"
  exit 1
}

$needed = @("SESSION_SIGNING_KEY","OAUTH_CLIENT_SECRET")
$map = @{}

Get-Content $SecretsFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) { return }
  $idx = $line.IndexOf("=")
  if ($idx -lt 1) { return }
  $k = $line.Substring(0, $idx).Trim()
  $v = $line.Substring($idx + 1).Trim()
  $map[$k] = $v
}

foreach ($k in $needed) {
  if (-not $map.ContainsKey($k) -or [string]::IsNullOrWhiteSpace($map[$k])) {
    Write-Error "Missing required secret in file: $k"
    exit 1
  }
}

foreach ($k in $needed) {
  $val = $map[$k]
  $tmp = [System.IO.Path]::GetTempFileName()
  Set-Content -Path $tmp -Value $val -NoNewline
  if ([string]::IsNullOrWhiteSpace($Env)) {
    Write-Host "Setting secret $k for default environment"
    Get-Content $tmp | npx wrangler secret put $k --config $Config
  } else {
    Write-Host "Setting secret $k for env=$Env"
    Get-Content $tmp | npx wrangler secret put $k --config $Config --env $Env
  }
  Remove-Item $tmp -Force
}
