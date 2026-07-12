$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Node = $env:D4_OPTIMIZER_NODE

if (-not $Node) {
  $NodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if ($NodeCommand) {
    $Node = $NodeCommand.Source
  }
}

if (-not $Node) {
  $BundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  if (Test-Path $BundledNode) {
    $Node = $BundledNode
  }
}

if (-not $Node) {
  throw "Node introuvable. Installer Node.js ou definir D4_OPTIMIZER_NODE avec le chemin de node.exe."
}

$SuiteScript = Join-Path $Root "work\diablo4-data-exporter\scripts\build-target-optimizer-suite.js"
& $Node $SuiteScript
exit $LASTEXITCODE
