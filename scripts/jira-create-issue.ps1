<#
.SYNOPSIS
    Crea un issue en Jira Cloud usando la API REST v3.

.DESCRIPTION
    Lee credenciales desde variables de entorno o desde el archivo .env en la raíz del repo.
    Uso típico desde la raíz del repo:
      .\scripts\jira-create-issue.ps1 -Summary "Título" -Description "Detalle opcional"

    Requisitos: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY en .env o en el entorno.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $Summary,

    [Parameter(Mandatory = $false)]
    [string] $Description = "",

    [Parameter(Mandatory = $false)]
    [string] $ProjectKey = "",

    [Parameter(Mandatory = $false)]
    [string] $IssueType = ""
)

$ErrorActionPreference = "Stop"

function Import-DotEnv {
    param([string] $EnvPath)
    if (-not (Test-Path $EnvPath)) { return }
    Get-Content $EnvPath -Encoding UTF8 | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#")) { return }
        $idx = $line.IndexOf("=")
        if ($idx -lt 1) { return }
        $name = $line.Substring(0, $idx).Trim()
        $value = $line.Substring($idx + 1).Trim()
        if ($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        if ($name) { Set-Item -Path "Env:$name" -Value $value }
    }
}

# scripts/ -> raíz del repo
$repoRoot = Split-Path $PSScriptRoot -Parent
$dotEnv = Join-Path $repoRoot ".env"
Import-DotEnv -EnvPath $dotEnv

$baseUrl = $env:JIRA_BASE_URL
if (-not $baseUrl) { $baseUrl = $env:JIRA_URL }
$email = $env:JIRA_EMAIL
$token = $env:JIRA_API_TOKEN
$proj = if ($ProjectKey) { $ProjectKey } else { $env:JIRA_PROJECT_KEY }
$type = if ($IssueType) { $IssueType } else { $env:JIRA_ISSUE_TYPE }
if (-not $type) { $type = "Task" }

if (-not $baseUrl -or -not $email -or -not $token -or -not $proj) {
    Write-Error "Faltan variables: JIRA_BASE_URL (o JIRA_URL), JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY. Configura .env según .env.example"
}

$baseUrl = $baseUrl.TrimEnd("/")

$fields = [ordered]@{
    project   = @{ key = $proj }
    summary   = $Summary
    issuetype = @{ name = $type }
}
$descText = if ($null -eq $Description) { "" } else { $Description.Trim() }
if ($descText.Length -gt 0) {
    $fields["description"] = @{
        type    = "doc"
        version = 1
        content = @(
            @{ type = "paragraph"; content = @( @{ type = "text"; text = $descText } ) }
        )
    }
}

$payload = @{ fields = [hashtable]$fields }

$json = $payload | ConvertTo-Json -Depth 12 -Compress
$pair = "${email}:${token}"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($pair)
$basic = [Convert]::ToBase64String($bytes)
$uri = "$baseUrl/rest/api/3/issue"

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json; charset=utf-8" `
        -Headers @{ Authorization = "Basic $basic" } -Body $json
    Write-Host "Creado: $($response.key) — $($response.self)"
    return $response
}
catch {
    $reader = $null
    try {
        if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream()) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errBody = $reader.ReadToEnd()
            Write-Error "Jira API error: $errBody"
        }
        else { throw $_ }
    }
    finally { if ($reader) { $reader.Dispose() } }
}
