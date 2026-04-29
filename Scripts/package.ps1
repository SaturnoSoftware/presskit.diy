param(
    [string]$ProjectRoot = (Split-Path $PSScriptRoot -Parent),
    [string]$Preset = "Default",
    [ValidateSet("development", "production")][string]$Environment = "development",
    [ValidateSet("debug", "release")][string]$ExportMode = "release",
    [int]$BuildNumber = 0
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
$ReleaseName = "$($PackageJson.name)-$($PackageJson.version)-$BuildNumber"
$BuildInputDir = Join-Path (Join-Path $ProjectRoot "__BUILD") $ReleaseName
$PackageOutputDir = Join-Path (Join-Path $ProjectRoot "__DIST") $ReleaseName

if (-not (Test-Path -LiteralPath $BuildInputDir -PathType Container)) {
    throw "Build output not found: $BuildInputDir"
}

Write-Host "==> Packaging: $ReleaseName"
Write-Host "==> Build input: $BuildInputDir"
Write-Host "==> Package output: $PackageOutputDir"

Clear-AndEnsureDirectory -Path $PackageOutputDir

Push-Location $ProjectRoot
try {
    Invoke-NativeCommand -CommandName "npm pack --pack-destination" -Command {
        npm pack --pack-destination $PackageOutputDir
    }
}
finally {
    Pop-Location
}

$Tarball = Get-ChildItem -LiteralPath $PackageOutputDir -Filter "*.tgz" | Select-Object -First 1
if ($null -eq $Tarball) {
    throw "Expected npm tarball was not produced in $PackageOutputDir"
}

Copy-IfPresent -SourcePath (Join-Path $ProjectRoot "README.md") -DestinationPath (Join-Path $PackageOutputDir "README.md")
Copy-IfPresent -SourcePath (Join-Path $ProjectRoot "package.json") -DestinationPath (Join-Path $PackageOutputDir "package.json")

@(
    "release_name=$ReleaseName"
    "preset=$Preset"
    "environment=$Environment"
    "export_mode=$ExportMode"
    "build_number=$BuildNumber"
    "build_input=$BuildInputDir"
    "package_artifact=$($Tarball.Name)"
) | Set-Content -LiteralPath (Join-Path $PackageOutputDir "package-summary.txt")

Write-Host "==> Done"
