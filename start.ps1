$nodePath = Join-Path $PSScriptRoot '../.runtime/node-v24.13.0-win-x64/node.exe'
if (Test-Path $nodePath) { & $nodePath (Join-Path $PSScriptRoot 'server.cjs') }
else { node (Join-Path $PSScriptRoot 'server.cjs') }
