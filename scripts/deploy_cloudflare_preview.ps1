$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

$projectName = 'elmasry-academy-lms'
$buildDirectory = Join-Path $repoRoot 'dist'

if (-not (Test-Path -LiteralPath (Join-Path $buildDirectory 'index.html'))) {
    throw 'The dist folder is missing. Run npm run build in the LMS project first.'
}

$accountId = (Read-Host 'Cloudflare Account ID (not secret)').Trim()
if ($accountId -notmatch '^[a-fA-F0-9]{32}$') {
    throw 'The Account ID should be 32 hexadecimal characters. Find it in your Cloudflare dashboard.'
}

$secureToken = Read-Host 'Paste the NEW Cloudflare API token here; input is hidden' -AsSecureString
$tokenPointer = [IntPtr]::Zero

try {
    $tokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
    $env:CLOUDFLARE_API_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPointer)
    $env:CLOUDFLARE_ACCOUNT_ID = $accountId

    $projectList = & npx --yes wrangler@latest pages project list --json 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Cloudflare project lookup failed. Check the token permission and Account ID. Details: $($projectList -join ' ')"
    }

    try {
        $projects = @(ConvertFrom-Json -InputObject ($projectList -join [Environment]::NewLine))
    } catch {
        throw 'Could not read the Cloudflare Pages project list. No project was created.'
    }

    $existingProject = $projects | Where-Object { $_.name -eq $projectName } | Select-Object -First 1
    if (-not $existingProject) {
        & npx --yes wrangler@latest pages project create $projectName --production-branch main
        if ($LASTEXITCODE -ne 0) {
            throw 'Cloudflare Pages project creation failed. No deployment was attempted.'
        }
    } else {
        Write-Host "Reusing the existing Pages project: $projectName"
    }

    & npx --yes wrangler@latest pages deploy $buildDirectory --project-name $projectName --branch preview --commit-dirty=true
    if ($LASTEXITCODE -ne 0) {
        throw 'Preview deployment failed. The Pages project may still have been created.'
    }
} finally {
    Remove-Item Env:\CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
    Remove-Item Env:\CLOUDFLARE_ACCOUNT_ID -ErrorAction SilentlyContinue
    if ($tokenPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPointer)
    }
    if ($secureToken) {
        $secureToken.Dispose()
    }
}
