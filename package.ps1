#!/bin/env pwsh

param([string]$platform)

if ([String]::IsNullOrWhiteSpace($platform)) {
    throw "--platform missing (linux, win32, ...)"
}

Push-Location build

Write-Host "switched to directory: $(Get-Location)"

npm run package --platform $platform

Pop-Location

Write-Host "switched to directory: $(Get-Location)"
