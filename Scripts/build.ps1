param(
    [string]$ProjectRoot = (Split-Path $PSScriptRoot -Parent),
    [string]$Preset = "Default",
    [ValidateSet("development", "production")][string]$Environment = "development",
    [ValidateSet("debug", "release")][string]$ExportMode = "release",
    [int]$BuildNumber = 0,
    [Parameter(ValueFromRemainingArguments = $true)][string[]]$ForwardedArgs
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Get-PackageJson {
    param([string]$RootPath)

    return Get-Content -LiteralPath (Join-Path $RootPath "package.json") -Raw | ConvertFrom-Json
}

function Clear-AndEnsureDirectory {
    param([string]$Path)

    Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
}

function Invoke-NativeCommand {
    param(
        [string]$CommandName,
        [scriptblock]$Command
    )

    Write-Host "==> $CommandName"
    & $Command

    if ($LASTEXITCODE -ne 0) {
        throw "$CommandName failed with exit code $LASTEXITCODE."
    }
}

function Copy-IfPresent {
    param(
        [string]$SourcePath,
        [string]$DestinationPath
    )

    if (Test-Path -LiteralPath $SourcePath) {
        Copy-Item -LiteralPath $SourcePath -Destination $DestinationPath -Recurse -Force
    }
}

$ProjectRoot = [System.IO.Path]::GetFullPath($ProjectRoot)
$PackageJson = Get-PackageJson -RootPath $ProjectRoot
$EffectiveForwardedArgs = @()
if ($null -ne $ForwardedArgs) {
    $EffectiveForwardedArgs = @(
        $ForwardedArgs | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    )
}
$ReleaseName = "$($PackageJson.name)-$($PackageJson.version)-$BuildNumber"
$BuildOutputDir = Join-Path (Join-Path $ProjectRoot "__BUILD") $ReleaseName
$SampleBuildSourceDir = Join-Path $ProjectRoot "build"
$SampleBuildOutputDir = Join-Path $BuildOutputDir "build"

Write-Host "==> Building: $ReleaseName"
Write-Host "==> Preset: $Preset"
Write-Host "==> Environment: $Environment"
Write-Host "==> Export mode: $ExportMode"
Write-Host "==> Output directory: $BuildOutputDir"

Clear-AndEnsureDirectory -Path $BuildOutputDir

Push-Location $ProjectRoot
try {
    Invoke-NativeCommand -CommandName "npm test -- --runInBand" -Command {
        npm test -- --runInBand
    }

    Invoke-NativeCommand -CommandName "npm run build" -Command {
        if (@($EffectiveForwardedArgs).Count -gt 0) {
            npm run build -- @EffectiveForwardedArgs
        }
        else {
            npm run build
        }
    }
}
finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath $SampleBuildSourceDir -PathType Container)) {
    throw "Expected sample build output directory was not created: $SampleBuildSourceDir"
}

Copy-Item -LiteralPath $SampleBuildSourceDir -Destination $SampleBuildOutputDir -Recurse -Force
Copy-IfPresent -SourcePath (Join-Path $ProjectRoot "README.md") -DestinationPath (Join-Path $BuildOutputDir "README.md")
Copy-IfPresent -SourcePath (Join-Path $ProjectRoot "package.json") -DestinationPath (Join-Path $BuildOutputDir "package.json")

@(
    "release_name=$ReleaseName"
    "preset=$Preset"
    "environment=$Environment"
    "export_mode=$ExportMode"
    "build_number=$BuildNumber"
    "verification_commands=npm test -- --runInBand && npm run build"
    "sample_build_dir=$SampleBuildOutputDir"
) | Set-Content -LiteralPath (Join-Path $BuildOutputDir "build-summary.txt")

Write-Host "==> Done"
